// Physics checks for all three levels. Run: node --test starlight/eval/
import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../public/shared/physics.js";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);

test("Level 1: E = mc^2 and surface gravity", () => {
  close(P.restEnergy(1), 8.987551787e16, 1e7, "1 kg rest energy");
  close(P.surfaceGravity(P.M_EARTH, P.R_EARTH), 9.82, 0.01, "Earth surface gravity");
});

test("Level 1: a Solar-System-like system passes the stability trial", () => {
  const sys = {
    star: { massSun: 1 },
    planets: [
      { name: "Earthlike", massEarth: 1, aAU: 1 },
      { name: "Jovian", massEarth: 318, aAU: 5.2, inclinationDeg: 1.3 },
    ],
  };
  const r = P.stabilityTrial(sys);
  assert.equal(r.passed, true, r.reason);
  assert.ok(r.energyDrift < 1e-3, `energy drift ${r.energyDrift}`);
});

test("Level 1: two giants packed together fail the stability trial", () => {
  const sys = { star: { massSun: 1 }, planets: [
    { name: "A", massEarth: 3000, aAU: 1.0 },
    { name: "B", massEarth: 3000, aAU: 1.15, inclinationDeg: 20 },
  ] };
  const r = P.stabilityTrial(sys);
  assert.equal(r.passed, false);
});

test("Level 1: invalid systems are rejected", () => {
  assert.ok(P.validateSystem({ star: { massSun: 100 }, planets: [] }).length >= 2);
});

test("Level 2: Schwarzschild stationary clock ratios", () => {
  const rs = P.schwarzschildRadius(P.M_SUN);
  close(rs, 2953.3, 0.5, "Sun's Schwarzschild radius (m)");
  // Ratio for r_near = 4 r_s, r_far = 10 r_s
  close(P.clockRatio(4, 10, 1), Math.sqrt(0.75 / 0.9), 1e-12, "ratio formula");
  // Near clock always records less time.
  assert.ok(P.clockRatio(3, 10, 1) < 1);
  // Domain: inside the surface or horizon is invalid.
  assert.equal(P.validClockRadius(1.5, P.LAB.surfaceRs, 1).ok, false);
  assert.throws(() => P.stationaryRate(0.9, 1), RangeError);
});

test("Level 2: weak-field example — 1 km height on Earth is ~9.4 ns/day", () => {
  const rs = P.schwarzschildRadius(P.M_EARTH);
  const ratio = P.clockRatio(P.R_EARTH, P.R_EARTH + 1000, rs);
  close((1 - ratio) * 86400 * 1e9, 9.4, 0.2, "ns per day");
});

test("Level 2: lab target 9 s vs 10 s is attainable inside the allowed range", () => {
  const r = P.radiusForRatio(P.LAB.targetRatio, P.LAB.farRs);
  assert.ok(r > P.LAB.nearRange[0] && r < P.LAB.nearRange[1], `r = ${r}`);
  close(P.clockRatio(r, P.LAB.farRs, 1), 0.9, 1e-12, "exact radius gives 0.9");
  const good = { predictLess: "near", nearRs: r, predictFarther: "ratio approaches 1", normalSeconds: true };
  assert.equal(P.checkLevel2Mastery(good).passed, true);
  assert.equal(P.checkLevel2Mastery({ ...good, nearRs: r + 0.3 }).passed, false);
  assert.equal(P.checkLevel2Mastery({ ...good, predictLess: "far" }).passed, false);
});

test("Level 3: cruise times and light clock consistency", () => {
  const t = P.cruise(4.24, 0.8);
  close(t.gamma, 5 / 3, 1e-12, "gamma at 0.8c");
  close(t.externalYears, 5.3, 1e-9, "external years");
  close(t.shipYears, 3.18, 1e-9, "ship years");
  close(t.contractedLy, 4.24 * 0.6, 1e-9, "contracted distance");
  // Ship frame: contracted distance / speed = ship time (the two views agree).
  close(t.contractedLy / 0.8, t.shipYears, 1e-12, "length contraction reconciles ship time");
  const lc = P.lightClockTick(0.8);
  close(lc.externalTick / lc.shipTick, t.gamma, 1e-12, "light clock tick ratio = gamma");
  close(10 / P.gamma(0.8), 6, 1e-12, "calibration 10 external s -> 6 ship s");
  assert.throws(() => P.gamma(1), RangeError);
  const ok = { prediction: "ship less", calibrationShip: 6, destinationLy: 4.24, beta: 0.9, targetShipYears: 3,
    explanation: ["path longer at same speed", "each clock normal locally", "frames disagree on distance"] };
  assert.equal(P.checkLevel3Mastery(ok).passed, true);
  assert.equal(P.checkLevel3Mastery({ ...ok, explanation: [...ok.explanation, "light slows down"] }).passed, false, "wrong reason rejected");
  assert.equal(P.checkLevel3Mastery({ ...ok, beta: 0.5 }).passed, false, "target not met");
  const b = P.betaForShipTime(4.24, 2);
  close(P.cruise(4.24, b).shipYears, 2, 1e-9, "betaForShipTime inverts");
});
