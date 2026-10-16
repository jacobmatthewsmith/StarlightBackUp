// Catalog + tools evaluation. Requires a built catalog (node catalog-build/build.mjs).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createApp } from "../server/app.js";
import { cruise } from "../public/shared/physics.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CAT = join(ROOT, "public", "catalog");
let manifest, objects, skyOnly, search, featured;

before(async () => {
  manifest = JSON.parse(await readFile(join(CAT, "manifest.json"), "utf8"));
  objects = [];
  for (const c of manifest.chunks) objects.push(...JSON.parse(await readFile(join(CAT, c.path), "utf8")).objects);
  skyOnly = JSON.parse(await readFile(join(CAT, "sky-only.json"), "utf8")).objects;
  search = JSON.parse(await readFile(join(CAT, "search.json"), "utf8"));
  featured = JSON.parse(await readFile(join(CAT, "featured.json"), "utf8")).items;
});

test("at least 10,000 unique, usable ACTUAL objects", () => {
  const counted = objects.filter((o) => o.counted !== false);
  assert.ok(counted.length >= 10000, `counted ${counted.length}`);
  assert.equal(counted.length, manifest.counts.countedActualObjects);
  const ids = new Set(objects.map((o) => o.id));
  assert.equal(ids.size, objects.length, "ids unique across chunks");
  for (const o of counted) {
    assert.ok(o.id.startsWith("actual:"), o.id);
    assert.ok(typeof o.type === "string" && o.type.length, `type for ${o.id}`);
    assert.ok(o.p.every(Number.isFinite), `position for ${o.id}`);
    assert.ok(o.src in manifest.sources, `provenance for ${o.id}: ${o.src}`);
    if (o.src === "gaia") assert.match(o.ids.gaia, /^Gaia DR3 \d+$/, "Gaia ids kept as strings");
  }
  // No Gaia source counted twice (e.g. once on its own and once inside a system).
  const gaia = counted.filter((o) => o.ids?.gaia).map((o) => o.ids.gaia);
  assert.equal(new Set(gaia).size, gaia.length);
});

test("search index covers every placed object; ids are strings (no precision loss)", () => {
  assert.equal(search.rows.length, objects.length);
  for (const [id] of search.rows) assert.equal(typeof id, "string");
  const big = search.rows.find(([id]) => id.includes("gaia-dr3:5853498713190525696"));
  assert.ok(big, "Proxima's full 19-digit Gaia id survives");
});

test("chunks: bounded sizes and checksums match", async () => {
  for (const c of manifest.chunks) assert.ok(c.count >= 300 && c.count <= 1000, `chunk ${c.i} has ${c.count}`);
  for (const f of manifest.files) {
    const text = await readFile(join(CAT, f.path), "utf8");
    assert.equal(createHash("sha256").update(text).digest("hex"), f.sha256, f.path);
  }
});

test("coordinates: one convention, known stars where expected", () => {
  const sun = objects.find((o) => o.id === "actual:sol");
  assert.deepEqual(sun.p, [0, 0, 0]);
  const near = (name) => objects.find((o) => o.name === name);
  const prox = near("Proxima Centauri");
  assert.ok(Math.abs(Math.hypot(...prox.p) - 4.246) < 0.01, "Proxima ~4.25 ly");
  const vega = near("Vega");
  assert.ok(Math.abs(vega.d - 25.04) < 0.2, `Vega ${vega.d}`);
  // Galactic convention: Proxima (l ≈ 313.9°, b ≈ −1.9°) has x > 0, y < 0.
  assert.ok(prox.p[0] > 0 && prox.p[1] < 0, `Proxima at ${prox.p}`);
  for (const o of objects) assert.ok(Math.abs(Math.hypot(...o.p) - (o.d ?? Math.hypot(...o.p))) < 0.02 * Math.max(1, o.d ?? 1), `distance/position agree for ${o.id}`);
});

test("Messier: Milky Way members placed with sourced distances; galaxies kept out", () => {
  const messier = objects.filter((o) => o.ids?.messier);
  assert.ok(messier.length >= 60, `${messier.length} placed`);
  for (const m of messier) {
    assert.ok(!/galaxy/i.test(m.type), `${m.ids.messier} is ${m.type}`);
    assert.ok(m.method || m.ref, `${m.ids.messier} has a distance source`);
  }
  const external = skyOnly.filter((o) => o.type === "external galaxy");
  assert.ok(external.length >= 39, "all Messier galaxies in the separate layer");
  assert.ok(!objects.some((o) => o.ids?.messier === "M31"), "Andromeda is not placed in the Milky Way layer");
  assert.ok(skyOnly.some((o) => o.ids?.messier === "M24"), "M24 star cloud: no single distance claimed");
});

test("featured stories: every item matched and sourced", () => {
  assert.ok(featured.length >= 20 && featured.length <= 40);
  for (const f of featured) {
    assert.ok(f.id, `${f.name} matched to an object`);
    assert.ok(f.sources?.length, `${f.name} has sources`);
  }
});

// ---------- tools + system placement (live server) ----------
let server, base, dataDir, ctxRef;
before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "starlight-cat-"));
  const app = createApp({ dataDir });
  server = app.server; ctxRef = app.ctx;
  await app.ready;
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(async () => { await new Promise((r) => server.close(r)); await rm(dataDir, { recursive: true, force: true }); });

async function session() {
  let cookie = "";
  return async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { ...(cookie && { cookie }), ...(body && { "content-type": "application/json", "x-starlight": "1" }) }, body: body && JSON.stringify(body) });
    const set = res.headers.get("set-cookie"); if (set) cookie = set.split(";")[0];
    return { status: res.status, json: await res.json(), bytes: Number(res.headers.get("content-length")) || 0 };
  };
}

test("tools: compact, paginated, capped, consistent with the physics", async () => {
  const a = await session();
  assert.equal((await a("GET", "/api/tools/search_universe?query=vega")).status, 401, "tools need an account");
  await a("POST", "/api/auth/signup", { email: "tools@example.com", password: "long enough pass", displayName: "Tools" });
  let r = await a("GET", "/api/tools/search_universe?query=gaia%20dr3&limit=500");
  assert.equal(r.json.limit, 25, "limit capped");
  assert.ok(r.json.total > 1000);
  assert.ok(JSON.stringify(r.json).length < 6000, "a page of summaries stays small");
  assert.deepEqual(Object.keys(r.json.results[0]).sort(), ["content", "distance_ly", "id", "name", "type"]);
  r = await a("GET", "/api/tools/search_universe?query=sirius&fields=id,name,distance_ly");
  assert.deepEqual(Object.keys(r.json.results[0]).sort(), ["distance_ly", "id", "name"]);
  r = await a("GET", "/api/tools/list_region_objects?x=0&y=0&z=0&radius_ly=5&limit=5");
  assert.ok(r.json.results.some((o) => o.name === "Proxima Centauri"));
  r = await a("GET", "/api/tools/plan_nearby_journey?origin=Sun&destination=Proxima%20Centauri&speed_c=0.8");
  const t = cruise(r.json.distance_ly, 0.8);
  assert.ok(Math.abs(r.json.ship_years - t.shipYears) < 1e-3);
});

test("player-built systems are placed clear of actual objects", async () => {
  const a = await session();
  await a("POST", "/api/auth/signup", { email: "place@example.com", password: "long enough pass", displayName: "Placer" });
  for (let k = 0; k < 5; k++) {
    const r = await a("POST", "/api/systems", { system: { name: `p${k}`, star: { massSun: 1 }, planets: [{ name: "a", massEarth: 1, aAU: 1 }] } });
    const p = r.json.system.mapPosition;
    assert.ok(ctxRef.catalog.nearestDistance(p) >= 2, `system ${k} sits ${ctxRef.catalog.nearestDistance(p)} ly from an actual object`);
    assert.match(r.json.system.id, /^fictional:/);
  }
});
