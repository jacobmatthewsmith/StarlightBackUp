// Backend checks against a real server on a throwaway data directory.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";

let server, base, dataDir;

before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "starlight-eval-"));
  ({ server } = createApp({ dataDir }));
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await rm(dataDir, { recursive: true, force: true });
});

// Tiny client with its own cookie jar.
function client() {
  let cookie = "";
  return async (method, path, body, { headers = true } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(cookie && { cookie }), ...(body !== undefined && headers && { "content-type": "application/json", "x-starlight": "1" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    return { status: res.status, json: await res.json().catch(() => null), headers: res.headers };
  };
}

const goodSystem = {
  name: "Testworld",
  star: { massSun: 1 },
  planets: [{ name: "Inner", massEarth: 1, aAU: 1 }, { name: "Outer", massEarth: 300, aAU: 5.2, inclinationDeg: 2 }],
};

test("accounts: sign up, session cookie, me, logout, login", async () => {
  const a = client();
  let r = await a("POST", "/api/auth/signup", { email: "ada@example.com", password: "correct horse battery", displayName: "Ada" });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("set-cookie"), /HttpOnly/);
  r = await a("GET", "/api/me");
  assert.equal(r.json.user.displayName, "Ada");
  assert.equal(r.json.user.email, undefined, "me does not echo email");
  r = await a("POST", "/api/auth/logout", {});
  r = await a("GET", "/api/me");
  assert.equal(r.json.user, null);
  r = await a("POST", "/api/auth/login", { email: "ada@example.com", password: "wrong password!!" });
  assert.equal(r.status, 401);
  r = await a("POST", "/api/auth/login", { email: "ADA@example.com", password: "correct horse battery" });
  assert.equal(r.status, 200);
});

test("accounts: duplicate email and weak password rejected", async () => {
  const a = client();
  assert.equal((await a("POST", "/api/auth/signup", { email: "ada@example.com", password: "another long one", displayName: "Ada2" })).status, 409);
  assert.equal((await a("POST", "/api/auth/signup", { email: "bob@example.com", password: "short", displayName: "Bob" })).status, 400);
});

test("CSRF guard: state changes need the custom header", async () => {
  const a = client();
  const r = await a("POST", "/api/auth/login", { email: "x@y.z", password: "whatever12345" }, { headers: false });
  assert.equal(r.status, 403);
});

test("progress: versioned compare-and-swap, mastery fields are server-only", async () => {
  const a = client();
  await a("POST", "/api/auth/signup", { email: "cas@example.com", password: "long enough pass", displayName: "Cas" });
  let r = await a("GET", "/api/progress");
  const v = r.json.version;
  r = await a("PUT", "/api/progress", { version: v, progress: { mode: "explore", level1: { step: "motion", completed: ["mass-energy", "trial"], passed: true } } });
  assert.equal(r.status, 200);
  assert.equal(r.json.progress.mode, "explore");
  assert.equal(r.json.progress.level1.passed, false, "client cannot set passed");
  assert.ok(!r.json.progress.level1.completed.includes("trial"), "client cannot complete mastery step");
  r = await a("PUT", "/api/progress", { version: v, progress: { mode: "game" } });
  assert.equal(r.status, 409, "stale version rejected");
  // Mode switch keeps level progress.
  r = await a("GET", "/api/progress");
  r = await a("PUT", "/api/progress", { version: r.json.version, progress: { mode: "game" } });
  assert.ok(r.json.progress.level1.completed.includes("mass-energy"));
});

test("systems: ownership, versions as separate JSON files, no public view", async () => {
  const owner = client(), other = client(), anon = client();
  await owner("POST", "/api/auth/signup", { email: "own@example.com", password: "long enough pass", displayName: "Owner" });
  await other("POST", "/api/auth/signup", { email: "oth@example.com", password: "long enough pass", displayName: "Other" });

  let r = await owner("POST", "/api/systems", { system: goodSystem });
  assert.equal(r.status, 200);
  const id = r.json.system.id;
  assert.match(id, /^fictional:/);

  assert.equal((await other("GET", `/api/systems/${encodeURIComponent(id)}`)).status, 404, "others can't read");
  assert.equal((await other("PUT", `/api/systems/${encodeURIComponent(id)}`, { expectedVersion: 1, system: goodSystem })).status, 404, "others can't edit");
  assert.notEqual((await anon("GET", `/api/public/systems/${encodeURIComponent(id)}`)).status, 200, "no public view of systems");

  r = await owner("PUT", `/api/systems/${encodeURIComponent(id)}`, { expectedVersion: 1, system: { ...goodSystem, name: "Testworld II" } });
  assert.equal(r.json.system.version, 2);
  assert.equal((await owner("PUT", `/api/systems/${encodeURIComponent(id)}`, { expectedVersion: 1, system: goodSystem })).status, 409, "stale edit rejected");
  const files = await readdir(join(dataDir, "systems", id.slice(10)));
  assert.deepEqual(files.sort(), ["v1.json", "v2.json"]);

  assert.equal((await owner("POST", "/api/systems", { system: { ...goodSystem, planets: [{ name: "Bad", massEarth: 1, aAU: 1000 }] } })).status, 400, "schema validation");

  assert.notEqual((await owner("POST", `/api/systems/${encodeURIComponent(id)}/publish`, {})).status, 200, "publishing was removed");

  // Private docs live in the data dir, never under public/.
  const doc = JSON.parse(await readFile(join(dataDir, "systems", id.slice(10), "v2.json"), "utf8"));
  assert.equal(doc.ownerId.startsWith("user:"), true);
});

test("Level 1 mastery is decided by the server-run stability trial", async () => {
  const a = client();
  await a("POST", "/api/auth/signup", { email: "l1@example.com", password: "long enough pass", displayName: "L1" });
  const bad = await a("POST", "/api/systems", { system: { name: "Crowded", star: { massSun: 1 }, planets: [{ name: "A", massEarth: 3000, aAU: 1 }, { name: "B", massEarth: 3000, aAU: 1.15, inclinationDeg: 20 }] } });
  let r = await a("POST", "/api/mastery/level1", { systemId: bad.json.system.id });
  assert.equal(r.json.trial.passed, false);
  assert.equal(r.json.progress.level1.passed, false);
  const good = await a("POST", "/api/systems", { system: goodSystem });
  r = await a("POST", "/api/mastery/level1", { systemId: good.json.system.id });
  assert.equal(r.json.trial.passed, true);
  assert.equal(r.json.progress.level1.passed, true);
  // Level 2 stays locked until the human-gravity transition is done.
  assert.equal((await a("POST", "/api/mastery/level2", { answers: {} })).status, 403);
  // The AI guide is Explore-only and bounded before any model call (same session: auth is rate limited).
  assert.equal((await a("POST", "/api/tutor", { question: "what is gravity?" })).status, 404, "old Game tutor route is gone");
  assert.equal((await a("POST", "/api/guide", { question: "what is gravity?" })).status, 400, "Explore mode only");
  assert.equal((await a("POST", "/api/guide", { mode: "explore", question: "x".repeat(281) })).status, 400, "question length capped");
  assert.equal((await a("POST", "/api/guide", { mode: "explore", question: "hi" })).status, 400, "too short");
});

test("static files: no path traversal outside public/", async () => {
  const a = client();
  const r = await fetch(base + "/..%2fserver%2fapp.js");
  assert.equal(r.status, 404);
  const r2 = await fetch(base + "/shared/physics.js");
  assert.equal(r2.status, 200);
});
