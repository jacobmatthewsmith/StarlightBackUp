// Catalog loader for Explore mode: manifest + compact search index up front, spatial
// chunks on demand (nearest to the camera first), held in a bounded LRU cache.

const BASE = "/catalog/";
export const MAX_CHUNKS = 24; // memory bound (~13k objects of ~17.7k)

export async function openCatalog() {
  // The manifest is always revalidated; every other file is fetched with its checksum as a
  // version tag, so a catalog rebuild reaches players at once while unchanged files stay cached.
  const manifest = await (await fetch(`${BASE}manifest.json`, { cache: "no-cache" })).json();
  const sha = new Map(manifest.files.map((f) => [f.path, f.sha256.slice(0, 12)]));
  const url = (path) => `${BASE}${path}?v=${sha.get(path) || manifest.built}`;
  const search = await (await fetch(url("search.json"))).json();
  const featured = await (await fetch(url("featured.json"))).json();
  const skyOnly = await (await fetch(url("sky-only.json"))).json();

  const chunks = new Map(); // i -> { objects, usedAt }
  const pending = new Map();
  const stats = { loads: 0, evictions: 0, bytes: 0, lastLoadMs: 0 };

  // Search rows: [id, name, aliases, type, chunk, distance_ly, g_mag]
  const rows = search.rows.map(([id, name, aliases, type, chunk, d, g, con]) => ({ id, name, aliases, type, chunk, d, g, con, hay: `${name}|${aliases}`.toLowerCase() }));
  const byId = new Map(rows.map((r) => [r.id, r]));

  async function loadChunk(i) {
    if (chunks.has(i)) { chunks.get(i).usedAt = performance.now(); return chunks.get(i); }
    if (pending.has(i)) return pending.get(i);
    const meta = manifest.chunks[i];
    const t0 = performance.now();
    const p = fetch(url(meta.path)).then(async (res) => {
      const text = await res.text();
      const data = JSON.parse(text);
      stats.loads++;
      stats.bytes += text.length;
      stats.lastLoadMs = performance.now() - t0;
      const entry = { i, objects: data.objects, usedAt: performance.now() };
      chunks.set(i, entry);
      pending.delete(i);
      while (chunks.size > MAX_CHUNKS) {
        const oldest = [...chunks.values()].sort((a, b) => a.usedAt - b.usedAt)[0];
        chunks.delete(oldest.i);
        stats.evictions++;
      }
      return entry;
    });
    pending.set(i, p);
    return p;
  }

  // Distance from a point to a chunk's bounding box (ly).
  const boxDist = (c, [x, y, z]) => Math.hypot(
    Math.max(c.min[0] - x, 0, x - c.max[0]),
    Math.max(c.min[1] - y, 0, y - c.max[1]),
    Math.max(c.min[2] - z, 0, z - c.max[2]),
  );

  // Load the chunks nearest the camera first, a few at a time.
  // maxFromSun: skip chunks lying entirely farther than this from the Sun.
  async function loadAround(pos, max = MAX_CHUNKS, { maxFromSun = Infinity } = {}) {
    const order = [...manifest.chunks].filter((c) => boxDist(c, [0, 0, 0]) <= maxFromSun)
      .sort((a, b) => boxDist(a, pos) - boxDist(b, pos)).slice(0, max);
    for (let k = 0; k < order.length; k += 4) await Promise.all(order.slice(k, k + 4).map((c) => loadChunk(c.i)));
  }

  function search_(q, { types = null, limit = 20 } = {}) {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out = [];
    for (const r of rows) {
      if (types && !types.has(r.type)) continue;
      const at = r.hay.indexOf(needle);
      if (at < 0) continue;
      // Rank: exact name (systems first), name starts with query, name contains, alias; brighter first.
      const name = r.name.toLowerCase();
      const rank = name === needle ? (r.type === "star system" ? 0 : 1) : name.startsWith(needle) ? 2 : at < r.name.length ? 3 : 4;
      const score = rank * 100 + (r.g ?? 20);
      out.push({ r, score });
    }
    return out.sort((a, b) => a.score - b.score).slice(0, limit).map((x) => x.r);
  }

  async function getObject(id) {
    const row = byId.get(id);
    if (!row) return null;
    const chunk = await loadChunk(row.chunk);
    return chunk.objects.find((o) => o.id === id) || null;
  }

  return {
    manifest, featured: featured.items, skyOnly: skyOnly.objects, rows, byId, stats,
    chunks, loadChunk, loadAround, search: search_, getObject,
    loadedObjects: () => { const all = []; for (const c of chunks.values()) all.push(...c.objects); return all; },
  };
}
