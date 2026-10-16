// Player progress: one versioned JSON blob per user. The client may save where it is
// (current step, mode, visited objects); mastery flags are set only by the server after
// re-running the deterministic checks in public/shared/physics.js.

import { HttpError } from "./errors.js";
import { checkLevel2Mastery, checkLevel3Mastery, stabilityTrial } from "../public/shared/physics.js";
import { loadSystem } from "./systems.js";

export function defaultProgress() {
  return {
    schema: "starlight.progress/1",
    mode: "game",
    intro: { done: false, foundClosest: false },
    level1: { step: "account", completed: ["account"], systemId: null, passed: false },
    level2: { step: "intro", completed: [], passed: false },
    level3: { step: "intro", completed: [], passed: false, calibrationPassed: false },
    explore: { visited: [], lastFocus: null },
  };
}

const STEP_IDS = {
  level1: ["account", "mass-energy", "gravity-3d", "motion", "build", "trial", "human-gravity"],
  level2: ["intro", "two-clocks", "weak-field", "lab", "free-fall", "orbit", "mastery"],
  level3: ["intro", "journey", "light-clock", "contraction", "calibration", "plan", "mastery"],
};

// Merge only the fields a client is allowed to write.
function applyClientUpdate(current, update) {
  const next = structuredClone(current);
  if (update.mode === "game" || update.mode === "explore") next.mode = update.mode;
  if (update.intro) {
    if (update.intro.done === true) next.intro.done = true;
    if (update.intro.foundClosest === true) next.intro.foundClosest = true;
  }
  for (const level of ["level1", "level2", "level3"]) {
    const u = update[level];
    if (!u) continue;
    if (STEP_IDS[level].includes(u.step)) next[level].step = u.step;
    if (Array.isArray(u.completed)) {
      // Steps can be marked done by the client, except the mastery steps (server only).
      const serverOnly = { level1: ["trial"], level2: ["mastery"], level3: ["calibration", "mastery"] }[level];
      for (const s of u.completed) {
        if (STEP_IDS[level].includes(s) && !serverOnly.includes(s) && !next[level].completed.includes(s)) next[level].completed.push(s);
      }
    }
  }
  if (update.explore) {
    if (Array.isArray(update.explore.visited)) {
      const set = new Set(next.explore.visited);
      for (const v of update.explore.visited.slice(0, 50)) if (typeof v === "string" && v.length < 120) set.add(v);
      next.explore.visited = [...set].slice(-500);
    }
    if (typeof update.explore.lastFocus === "string" && update.explore.lastFocus.length < 120) next.explore.lastFocus = update.explore.lastFocus;
  }
  return next;
}

export function getProgress(db, userId) {
  const row = db.prepare("SELECT version, json FROM progress WHERE user_id = ?").get(userId);
  if (!row) throw new HttpError(404, "No progress record.");
  return { version: row.version, progress: JSON.parse(row.json) };
}

// Compare-and-swap write: fails with 409 if someone else saved first.
function writeProgress(db, userId, expectedVersion, progress) {
  const r = db
    .prepare("UPDATE progress SET version = version + 1, json = ?, updated_at = ? WHERE user_id = ? AND version = ?")
    .run(JSON.stringify(progress), new Date().toISOString(), userId, expectedVersion);
  if (r.changes !== 1) throw new HttpError(409, "Progress changed elsewhere; reload and try again.", getProgress(db, userId));
  return getProgress(db, userId);
}

// Apply a server-side change with retries (no client version needed).
function serverUpdate(db, userId, fn) {
  for (let i = 0; i < 3; i++) {
    const { version, progress } = getProgress(db, userId);
    fn(progress);
    try { return writeProgress(db, userId, version, progress); } catch (e) { if (e.status !== 409) throw e; }
  }
  throw new HttpError(409, "Busy; try again.");
}

export const levelUnlocked = (p, level) =>
  level === 1 ? true : level === 2 ? p.level1.passed && p.level1.completed.includes("human-gravity") : p.level2.passed;

export function progressRoutes(route, { db, dataDir }) {
  route("GET", "/api/progress", async (req, res, { user }) => getProgress(db, user.id));

  route("PUT", "/api/progress", async (req, res, { user, body }) => {
    if (!Number.isInteger(body.version)) throw new HttpError(400, "version is required.");
    const { progress } = getProgress(db, user.id);
    return writeProgress(db, user.id, body.version, applyClientUpdate(progress, body.progress || {}));
  });

  // Level 1: the player's saved system must pass the stability trial (re-run here).
  route("POST", "/api/mastery/level1", async (req, res, { user, body }) => {
    const doc = await loadSystem(db, dataDir, String(body.systemId || ""), user.id);
    const trial = stabilityTrial(doc);
    db.prepare("UPDATE systems SET passed_level1 = ? WHERE id = ? AND owner_id = ?").run(trial.passed ? 1 : 0, doc.id, user.id);
    const saved = trial.passed
      ? serverUpdate(db, user.id, (p) => {
          p.level1.passed = true;
          p.level1.systemId = doc.id;
          if (!p.level1.completed.includes("trial")) p.level1.completed.push("trial");
        })
      : getProgress(db, user.id);
    return { trial, ...saved };
  });

  route("POST", "/api/mastery/level2", async (req, res, { user, body }) => {
    const { progress } = getProgress(db, user.id);
    if (!levelUnlocked(progress, 2)) throw new HttpError(403, "Finish Level 1 first.");
    const check = checkLevel2Mastery(body.answers || {});
    const saved = check.passed
      ? serverUpdate(db, user.id, (p) => { p.level2.passed = true; if (!p.level2.completed.includes("mastery")) p.level2.completed.push("mastery"); })
      : getProgress(db, user.id);
    return { check, ...saved };
  });

  route("POST", "/api/mastery/level3/calibration", async (req, res, { user, body }) => {
    const ship = Number(body.shipSeconds);
    const passed = Math.abs(ship - 6) <= 0.01;
    const saved = passed
      ? serverUpdate(db, user.id, (p) => { p.level3.calibrationPassed = true; if (!p.level3.completed.includes("calibration")) p.level3.completed.push("calibration"); })
      : getProgress(db, user.id);
    return { check: { passed, issues: passed ? [] : ["At 0.8c, 10 external seconds correspond to 6 ship seconds."] }, ...saved };
  });

  route("POST", "/api/mastery/level3", async (req, res, { user, body }) => {
    const { progress } = getProgress(db, user.id);
    if (!levelUnlocked(progress, 3)) throw new HttpError(403, "Finish Level 2 first.");
    // Calibration is taken from the server's own record, not the client's claim.
    const check = checkLevel3Mastery({ ...(body.answers || {}), calibrationShip: progress.level3.calibrationPassed ? 6 : null });
    const saved = check.passed
      ? serverUpdate(db, user.id, (p) => { p.level3.passed = true; if (!p.level3.completed.includes("mastery")) p.level3.completed.push("mastery"); })
      : getProgress(db, user.id);
    return { check, ...saved };
  });
}
