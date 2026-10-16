// Server-side view of the built catalog (public/catalog), for agent tools and for
// keeping fictional systems clear of actual objects. Loaded once, read-only.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function loadCatalog(publicDir) {
  const dir = join(publicDir, "catalog");
  let manifest;
  try { manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8")); }
  catch { return null; } // catalog not built yet
  const objects = [];
  for (const c of manifest.chunks) {
    const chunk = JSON.parse(await readFile(join(dir, c.path), "utf8"));
    objects.push(...chunk.objects);
  }
  const skyOnly = JSON.parse(await readFile(join(dir, "sky-only.json"), "utf8")).objects;
  const featured = JSON.parse(await readFile(join(dir, "featured.json"), "utf8")).items;
  const byId = new Map([...objects, ...skyOnly].map((o) => [o.id, o]));
  const lower = objects.map((o) => `${o.name || ""}|${Object.values(o.ids || {}).join("|")}`.toLowerCase());

  return {
    manifest, objects, skyOnly, featured, byId,
    search(q, { type = null, limit = 10, offset = 0 } = {}) {
      const needle = String(q || "").trim().toLowerCase();
      if (needle.length < 2) return { total: 0, items: [] };
      const hits = [];
      for (let i = 0; i < objects.length; i++) {
        if (type && objects[i].type !== type) continue;
        const at = lower[i].indexOf(needle);
        if (at < 0) continue;
        const o = objects[i];
        hits.push({ o, score: ((o.name || "").toLowerCase().startsWith(needle) ? 0 : 1) * 100 + (o.g ?? o.hp ?? 20) });
      }
      for (const s of skyOnly) if ((s.name || "").toLowerCase().includes(needle)) hits.push({ o: s, score: 50 });
      hits.sort((a, b) => a.score - b.score);
      return { total: hits.length, items: hits.slice(offset, offset + limit).map((h) => h.o) };
    },
    region(center, radiusLy, { type = null, limit = 20, offset = 0 } = {}) {
      const hits = [];
      for (const o of objects) {
        if (!o.p || (type && o.type !== type)) continue;
        const d = Math.hypot(o.p[0] - center[0], o.p[1] - center[1], o.p[2] - center[2]);
        if (d <= radiusLy) hits.push({ o, d });
      }
      hits.sort((a, b) => a.d - b.d);
      return { total: hits.length, items: hits.slice(offset, offset + limit).map((h) => ({ ...h.o, _distanceFromCenterLy: +h.d.toFixed(3) })) };
    },
    nearestDistance(p) {
      let best = Infinity;
      for (const o of objects) if (o.p) best = Math.min(best, Math.hypot(o.p[0] - p.x, o.p[1] - p.y, o.p[2] - p.z));
      return best;
    },
  };
}

// Compact summary of an object: only requested fields, with ACTUAL/FICTIONAL label.
export const SUMMARY_FIELDS = ["id", "name", "type", "distance_ly", "content"];
export function summarize(o, fields = SUMMARY_FIELDS) {
  const all = {
    id: o.id,
    name: o.name || o.ids?.gaia || o.ids?.hip || o.id,
    type: o.type,
    distance_ly: o.d ?? null,
    distance_err_ly: o.de ?? null,
    position_ly: o.p ?? null,
    ids: o.ids ?? null,
    g_mag: o.g ?? o.hp ?? null,
    bp_rp: o.c ?? null,
    teff_k: o.teff ?? null,
    source: o.src ?? null,
    system: o.system ?? null,
    note: o.note ?? null,
    content: o.id?.startsWith("fictional:") ? "FICTIONAL" : "ACTUAL",
  };
  return Object.fromEntries(fields.filter((f) => f in all).map((f) => [f, all[f]]));
}
