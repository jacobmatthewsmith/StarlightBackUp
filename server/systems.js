// Player-created (FICTIONAL) star systems. Each system is a separate, versioned JSON
// document under data/systems/<uuid>/v<version>.json — never inside public/.
// SQLite holds the index: owner, name, version, Level 1 status, publication.
//
// Rules: only the owner reads or edits their systems; edits use compare-and-swap on
// `version`. (Publishing systems to Explore was removed in October 2026.)

import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { HttpError } from "./errors.js";
import { validateSystem, stabilityTrial } from "../public/shared/physics.js";

export const SYSTEM_SCHEMA = "starlight.system/1";
const ID_RE = /^fictional:[0-9a-f-]{36}$/;

const docPath = (dataDir, id, version) => join(dataDir, "systems", id.slice("fictional:".length), `v${version}.json`);

async function writeDoc(dataDir, doc) {
  const file = docPath(dataDir, doc.id, doc.version);
  await mkdir(join(file, ".."), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(doc, null, 2), { flag: "wx" });
  await rename(tmp, file); // atomic on the same filesystem
}

export async function loadSystem(db, dataDir, id, ownerId) {
  if (!ID_RE.test(id)) throw new HttpError(404, "No such system.");
  const row = db.prepare("SELECT owner_id, version FROM systems WHERE id = ?").get(id);
  if (!row || row.owner_id !== ownerId) throw new HttpError(404, "No such system."); // don't reveal others' ids
  return JSON.parse(await readFile(docPath(dataDir, id, row.version), "utf8"));
}

// Clean, schema-checked document body from client input.
function cleanSystem(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  if (name.length < 1 || name.length > 60) throw new HttpError(400, "System name must be 1–60 characters.");
  const sys = {
    name,
    star: { name: String(input.star?.name || `${name} star`).slice(0, 40), massSun: Number(input.star?.massSun) },
    planets: (Array.isArray(input.planets) ? input.planets : []).slice(0, 12).map((p) => ({
      name: String(p?.name ?? "").trim().slice(0, 40),
      massEarth: Number(p?.massEarth),
      aAU: Number(p?.aAU),
      inclinationDeg: Number(p?.inclinationDeg ?? 0),
      nodeDeg: Number(p?.nodeDeg ?? 0),
      phaseDeg: Number(p?.phaseDeg ?? 0),
    })),
  };
  const errors = validateSystem(sys);
  if (errors.length) throw new HttpError(400, errors[0], { errors });
  return sys;
}

// Deterministic fictional map position from the id: 30–90 ly from the Sun, inside the
// neighbourhood but flagged FICTIONAL. Kept clear of actual catalog objects when an
// avoid() check is provided by the catalog layer.
export function fictionalPosition(id, avoid = () => false) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const h = createHash("sha256").update(`${id}:${attempt}`).digest();
    const u = h.readUInt32BE(0) / 2 ** 32, v = h.readUInt32BE(4) / 2 ** 32, w = h.readUInt32BE(8) / 2 ** 32;
    const r = 30 + 60 * w, th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
    const p = { x: r * Math.sin(ph) * Math.cos(th), y: r * Math.sin(ph) * Math.sin(th), z: r * Math.cos(ph) * 0.3 };
    if (!avoid(p)) return Object.fromEntries(Object.entries(p).map(([k, n]) => [k, +n.toFixed(3)]));
  }
  throw new HttpError(500, "Could not place system.");
}

export function publicView(doc, row) {
  return {
    id: doc.id,
    content: "FICTIONAL",
    label: "FICTIONAL — PLAYER CREATED",
    name: doc.name,
    creator: row.published_name,
    star: doc.star,
    planets: doc.planets.map(({ name, massEarth, aAU, inclinationDeg, nodeDeg, phaseDeg }) => ({ name, massEarth, aAU, inclinationDeg, nodeDeg, phaseDeg })),
    mapPosition: doc.mapPosition,
    version: doc.version,
    updatedAt: doc.updatedAt,
  };
}

export function systemRoutes(route, { db, dataDir, avoidActual }) {
  const avoid = (p) => (typeof avoidActual === "function" ? avoidActual(p) : false);
  const list = (ownerId) =>
    db.prepare("SELECT id, name, version, passed_level1, published, updated_at FROM systems WHERE owner_id = ? ORDER BY updated_at DESC").all(ownerId)
      .map((r) => ({ id: r.id, name: r.name, version: r.version, passedLevel1: !!r.passed_level1, published: !!r.published, updatedAt: r.updated_at }));

  route("GET", "/api/systems", async (req, res, { user }) => ({ systems: list(user.id) }));

  route("POST", "/api/systems", async (req, res, { user, body }) => {
    if (list(user.id).length >= 20) throw new HttpError(400, "You can keep up to 20 systems.");
    const sys = cleanSystem(body.system);
    const id = `fictional:${randomUUID()}`;
    const now = new Date().toISOString();
    const doc = { schema: SYSTEM_SCHEMA, id, version: 1, ownerId: user.id, createdAt: now, updatedAt: now, ...sys, mapPosition: fictionalPosition(id, avoid) };
    await writeDoc(dataDir, doc);
    db.prepare("INSERT INTO systems (id, owner_id, name, version, map_x, map_y, map_z, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?)")
      .run(id, user.id, sys.name, doc.mapPosition.x, doc.mapPosition.y, doc.mapPosition.z, now);
    return { system: doc };
  });

  route("GET", "/api/systems/:id", async (req, res, { user, params }) => ({ system: await loadSystem(db, dataDir, params.id, user.id) }));

  // Safe concurrent update: the client sends the version it edited; a stale version gets 409.
  route("PUT", "/api/systems/:id", async (req, res, { user, params, body }) => {
    const current = await loadSystem(db, dataDir, params.id, user.id);
    if (body.expectedVersion !== current.version) throw new HttpError(409, "This system was changed elsewhere; reload it first.", { currentVersion: current.version });
    const sys = cleanSystem(body.system);
    const now = new Date().toISOString();
    const doc = { ...current, ...sys, version: current.version + 1, updatedAt: now };
    // Claim the version in the index first (CAS), then write the new document.
    const r = db.prepare("UPDATE systems SET version = ?, name = ?, passed_level1 = 0, updated_at = ? WHERE id = ? AND owner_id = ? AND version = ?")
      .run(doc.version, sys.name, now, params.id, user.id, current.version);
    if (r.changes !== 1) throw new HttpError(409, "This system was changed elsewhere; reload it first.");
    await writeDoc(dataDir, doc);
    // A published system keeps showing its published version until republished? Simpler and
    // safer: editing unpublishes, so the public never sees an untested version.
    db.prepare("UPDATE systems SET published = 0 WHERE id = ?").run(params.id);
    return { system: doc };
  });

  route("POST", "/api/systems/:id/trial", async (req, res, { user, params }) => {
    const doc = await loadSystem(db, dataDir, params.id, user.id);
    const trial = stabilityTrial(doc);
    db.prepare("UPDATE systems SET passed_level1 = ? WHERE id = ?").run(trial.passed ? 1 : 0, doc.id);
    return { trial };
  });

}
