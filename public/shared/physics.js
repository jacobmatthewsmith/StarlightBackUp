// Shared, deterministic physics for starlight. Runs in the browser and on the server,
// so mastery checks on the server reproduce exactly what the player saw.
//
// Units are stated on every function. Nothing here uses randomness.

// ---------- constants (SI unless noted) ----------
export const G = 6.6743e-11;          // m^3 kg^-1 s^-2 (CODATA 2018)
export const C = 299792458;           // m/s (exact)
export const M_SUN = 1.98847e30;      // kg (IAU nominal GM / G)
export const M_EARTH = 5.9722e24;     // kg
export const R_EARTH = 6.371e6;       // m (mean)
export const AU = 1.495978707e11;     // m (exact)
export const LY = 9.4607304725808e15; // m (Julian year)
export const YEAR = 31557600;         // s (Julian year)

// Gravitational parameter in AU^3 / (M_sun yr^2): 4π² to the precision we need.
export const G_AU = 4 * Math.PI * Math.PI;
export const EARTH_IN_SUN = M_EARTH / M_SUN;

// =====================================================================
// Level 1 — mass & energy, gravity, Newtonian motion, stability trial
// =====================================================================

// E = m c^2. mass in kg -> energy in joules.
export const restEnergy = (massKg) => massKg * C * C;

// Newtonian surface gravity g = GM/R^2 (m/s^2), for mass in kg and radius in m.
export const surfaceGravity = (massKg, radiusM) => (G * massKg) / (radiusM * radiusM);

// A player-built system, as stored in its JSON document:
// { star: { massSun }, planets: [{ name, massEarth, aAU, inclinationDeg, nodeDeg, phaseDeg }] }
export const LIMITS = {
  starMassSun: [0.08, 20],
  planetMassEarth: [0.01, 5000],
  aAU: [0.05, 60],
  inclinationDeg: [0, 90],
  planets: [1, 8],
};

export function validateSystem(sys) {
  const errors = [];
  const inRange = (v, [lo, hi]) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
  if (!sys || typeof sys !== "object") return ["System must be an object."];
  if (!inRange(sys.star?.massSun, LIMITS.starMassSun)) errors.push(`Star mass must be ${LIMITS.starMassSun.join("–")} solar masses.`);
  const planets = Array.isArray(sys.planets) ? sys.planets : [];
  if (planets.length < LIMITS.planets[0] || planets.length > LIMITS.planets[1]) errors.push(`Systems need ${LIMITS.planets.join("–")} planets.`);
  planets.forEach((p, i) => {
    const n = `Planet ${i + 1}`;
    if (typeof p.name !== "string" || p.name.length < 1 || p.name.length > 40) errors.push(`${n}: name must be 1–40 characters.`);
    if (!inRange(p.massEarth, LIMITS.planetMassEarth)) errors.push(`${n}: mass must be ${LIMITS.planetMassEarth.join("–")} Earth masses.`);
    if (!inRange(p.aAU, LIMITS.aAU)) errors.push(`${n}: orbital distance must be ${LIMITS.aAU.join("–")} AU.`);
    if (!inRange(p.inclinationDeg ?? 0, LIMITS.inclinationDeg)) errors.push(`${n}: orbital plane tilt must be 0–90°.`);
  });
  return errors;
}

// Initial state: each planet on a circular orbit around the star in its own plane.
// Returns bodies with position (AU) and velocity (AU/yr), masses in solar masses.
export function initialState(sys) {
  const ms = sys.star.massSun;
  const bodies = [{ name: "star", m: ms, x: [0, 0, 0], v: [0, 0, 0] }];
  for (const p of sys.planets) {
    const m = p.massEarth * EARTH_IN_SUN;
    const a = p.aAU;
    const inc = ((p.inclinationDeg || 0) * Math.PI) / 180;
    const node = ((p.nodeDeg || 0) * Math.PI) / 180;
    const ph = ((p.phaseDeg || 0) * Math.PI) / 180;
    const speed = Math.sqrt((G_AU * (ms + m)) / a);
    // Position/velocity in the orbit plane, then tilt by inclination about the node line.
    const xo = a * Math.cos(ph), yo = a * Math.sin(ph);
    const vxo = -speed * Math.sin(ph), vyo = speed * Math.cos(ph);
    const rot = (x, y) => {
      const y1 = y * Math.cos(inc), z1 = y * Math.sin(inc);
      return [x * Math.cos(node) - y1 * Math.sin(node), x * Math.sin(node) + y1 * Math.cos(node), z1];
    };
    bodies.push({ name: p.name, m, x: rot(xo, yo), v: rot(vxo, vyo) });
  }
  // Move to the centre-of-mass frame so the system doesn't drift.
  const M = bodies.reduce((s, b) => s + b.m, 0);
  for (let k = 0; k < 3; k++) {
    const cx = bodies.reduce((s, b) => s + b.m * b.x[k], 0) / M;
    const cv = bodies.reduce((s, b) => s + b.m * b.v[k], 0) / M;
    for (const b of bodies) { b.x[k] -= cx; b.v[k] -= cv; }
  }
  return bodies;
}

// Gravitational acceleration (AU/yr^2) at point p from bodies, skipping index `skip`.
export function accelerationAt(bodies, p, skip = -1, soft2 = 0) {
  const a = [0, 0, 0];
  for (let j = 0; j < bodies.length; j++) {
    if (j === skip) continue;
    const dx = bodies[j].x[0] - p[0], dy = bodies[j].x[1] - p[1], dz = bodies[j].x[2] - p[2];
    const r2 = dx * dx + dy * dy + dz * dz + soft2;
    const inv = (G_AU * bodies[j].m) / (r2 * Math.sqrt(r2));
    a[0] += dx * inv; a[1] += dy * inv; a[2] += dz * inv;
  }
  return a;
}

export function energy(bodies) {
  let K = 0, U = 0;
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    K += 0.5 * b.m * (b.v[0] ** 2 + b.v[1] ** 2 + b.v[2] ** 2);
    for (let j = i + 1; j < bodies.length; j++) {
      const d = Math.hypot(b.x[0] - bodies[j].x[0], b.x[1] - bodies[j].x[1], b.x[2] - bodies[j].x[2]);
      U -= (G_AU * b.m * bodies[j].m) / d;
    }
  }
  return K + U;
}

// One kick-drift-kick leapfrog step (symplectic, time-reversible). dt in years.
export function step(bodies, dt) {
  const acc = bodies.map((b, i) => accelerationAt(bodies, b.x, i));
  for (let i = 0; i < bodies.length; i++) for (let k = 0; k < 3; k++) bodies[i].v[k] += 0.5 * dt * acc[i][k];
  for (const b of bodies) for (let k = 0; k < 3; k++) b.x[k] += dt * b.v[k];
  const acc2 = bodies.map((b, i) => accelerationAt(bodies, b.x, i));
  for (let i = 0; i < bodies.length; i++) for (let k = 0; k < 3; k++) bodies[i].v[k] += 0.5 * dt * acc2[i][k];
}

// Mutual Hill radius of two planets (AU).
export function mutualHill(m1, m2, a1, a2, mStar) {
  return Math.cbrt((m1 + m2) / (3 * mStar)) * ((a1 + a2) / 2);
}

// The stability trial. Deterministic: fixed step and fixed duration for a given system.
//   - integrates for TRIAL_OUTER_ORBITS of the outermost planet (step = innermost period / 80),
//     capped at MAX_STEPS
//   - fails if a planet escapes (positive orbital energy around the star or > 4x its start
//     distance), comes within 3 mutual Hill radii of another planet, or falls inside 0.01 AU
//   - also reports adjacent-pair spacing in mutual Hill radii (guidance, not a pass rule)
export const TRIAL_OUTER_ORBITS = 10;
export const MAX_STEPS = 200000;

export function stabilityTrial(sys) {
  const errors = validateSystem(sys);
  if (errors.length) return { passed: false, reason: errors[0], errors };
  const bodies = initialState(sys);
  const ms = sys.star.massSun;
  const sorted = [...sys.planets].sort((a, b) => a.aAU - b.aAU);
  const period = (a) => Math.sqrt(a ** 3 / ms); // years
  const dt = period(sorted[0].aAU) / 80;
  let steps = Math.ceil((TRIAL_OUTER_ORBITS * period(sorted.at(-1).aAU)) / dt);
  const capped = steps > MAX_STEPS;
  steps = Math.min(steps, MAX_STEPS);
  const start = bodies.map((b) => Math.hypot(...b.x));
  const E0 = energy(bodies);

  const spacing = [];
  for (let i = 1; i < sorted.length; i++) {
    const p = sorted[i - 1], q = sorted[i];
    const rh = mutualHill(p.massEarth * EARTH_IN_SUN, q.massEarth * EARTH_IN_SUN, p.aAU, q.aAU, ms);
    spacing.push({ inner: p.name, outer: q.name, hillRadii: (q.aAU - p.aAU) / rh });
  }

  for (let s = 0; s < steps; s++) {
    step(bodies, dt);
    if (s % 20 !== 0 && s !== steps - 1) continue;
    const star = bodies[0];
    for (let i = 1; i < bodies.length; i++) {
      const b = bodies[i];
      const rel = [b.x[0] - star.x[0], b.x[1] - star.x[1], b.x[2] - star.x[2]];
      const vr = [b.v[0] - star.v[0], b.v[1] - star.v[1], b.v[2] - star.v[2]];
      const r = Math.hypot(...rel);
      const e = 0.5 * (vr[0] ** 2 + vr[1] ** 2 + vr[2] ** 2) - (G_AU * (star.m + b.m)) / r;
      const t = +((s + 1) * dt).toFixed(3);
      if (r < 0.01) return result(false, `${b.name} fell into the star after ${t} years.`);
      if (e > 0 || r > 4 * start[i]) return result(false, `${b.name} was flung out of the system after ${t} years.`);
      for (let j = i + 1; j < bodies.length; j++) {
        const c = bodies[j];
        const d = Math.hypot(b.x[0] - c.x[0], b.x[1] - c.x[1], b.x[2] - c.x[2]);
        const rh = mutualHill(b.m, c.m, Math.hypot(...rel), Math.hypot(c.x[0] - star.x[0], c.x[1] - star.x[1], c.x[2] - star.x[2]), star.m);
        if (d < 3 * rh) return result(false, `${b.name} and ${c.name} came dangerously close after ${t} years.`);
      }
    }
  }
  const drift = Math.abs((energy(bodies) - E0) / E0);
  return result(true, capped ? `Stable for the length of the trial (${(steps * dt).toFixed(1)} years).` : `Stable for ${TRIAL_OUTER_ORBITS} orbits of the outermost planet.`);

  function result(passed, reason) {
    return {
      passed,
      reason,
      years: +(steps * dt).toFixed(3),
      steps,
      capped,
      energyDrift: passed ? +Math.abs((energy(bodies) - E0) / E0).toExponential(2) : null,
      spacing,
    };
  }
}

// =====================================================================
// Level 2 — gravity and time: stationary clocks outside a spherical mass
// =====================================================================
// Schwarzschild exterior, isolated, spherical, non-rotating mass. Valid only for clocks
// held at fixed radius (supported/hovering), outside the material surface and horizon.

export const schwarzschildRadius = (massKg) => (2 * G * massKg) / (C * C); // m

// Clock rate relative to a clock far away (at infinity): sqrt(1 - r_s/r).
export function stationaryRate(r, rs) {
  if (!(r > rs)) throw new RangeError("Clock must be outside the horizon (r > r_s).");
  return Math.sqrt(1 - rs / r);
}

// near elapsed / far elapsed for two stationary clocks.
export function clockRatio(rNear, rFar, rs) {
  return stationaryRate(rNear, rs) / stationaryRate(rFar, rs);
}

// Domain check: outside the material surface (and therefore the horizon).
export function validClockRadius(r, surfaceR, rs) {
  if (!(surfaceR > rs)) return { ok: false, reason: "This model needs a body larger than its Schwarzschild radius." };
  if (!(r >= surfaceR)) return { ok: false, reason: "Clocks must stay outside the material surface." };
  return { ok: true };
}

// The fictional compact-object laboratory (clearly labelled fictional in the UI).
// Units of r_s; the mass sets r_s in km for display.
export const LAB = {
  massSun: 2.0,
  surfaceRs: 2.0,        // surface radius, in r_s (outside the photon sphere at 1.5 r_s)
  farRs: 10.0,           // the far clock is held fixed here for the mastery challenge
  nearRange: [2.0, 9.0], // where the player may place the near clock
  targetRatio: 0.9,      // near records 9 s while far records 10 s
  tolerance: 0.002,      // ratio tolerance (±0.02 s on the near clock per 10 s)
};

// Exact radius (in r_s) for a target ratio with the far clock fixed: used for checks & hints.
export function radiusForRatio(ratio, farRs) {
  const k = ratio * ratio * (1 - 1 / farRs); // = 1 - 1/r_near
  return 1 / (1 - k);
}

// Level 2 mastery check. answers: { predictLess: "near"|"far"|"same", nearRs, predictFarther: "closer to 1"|..., normalSeconds: bool }
export function checkLevel2Mastery(answers) {
  const issues = [];
  if (answers.predictLess !== "near") issues.push("prediction: the clock deeper in the gravity well records less time");
  const r = Number(answers.nearRs);
  const valid = validClockRadius(r, LAB.surfaceRs, 1);
  if (!valid.ok || r < LAB.nearRange[0] || r > LAB.nearRange[1]) issues.push("placement: near clock outside the allowed range");
  else {
    const ratio = clockRatio(r, LAB.farRs, 1);
    if (Math.abs(ratio - LAB.targetRatio) > LAB.tolerance) issues.push(`placement: ratio ${ratio.toFixed(4)} is not within ±${LAB.tolerance} of ${LAB.targetRatio}`);
  }
  if (answers.predictFarther !== "ratio approaches 1") issues.push("prediction: moving the near clock farther out brings the two clocks closer to agreeing");
  if (answers.normalSeconds !== true) issues.push("explanation: each clock's own seconds feel normal locally");
  return { passed: issues.length === 0, issues };
}

// =====================================================================
// Level 3 — special relativity: constant-speed cruise and light clocks
// =====================================================================

export function gamma(beta) {
  if (!(beta >= 0 && beta < 1)) throw new RangeError("Speed must be at least 0 and below c.");
  return 1 / Math.sqrt(1 - beta * beta);
}

// Constant-speed cruise between endpoints at rest in a shared frame.
// distanceLy in light years, beta = v/c. Times in years.
export function cruise(distanceLy, beta) {
  const g = gamma(beta);
  const external = beta > 0 ? distanceLy / beta : Infinity;
  return { gamma: g, externalYears: external, shipYears: external / g, contractedLy: distanceLy / g };
}

// Speed needed so the external (origin/destination frame) trip takes `years`.
export const betaForExternalTime = (distanceLy, years) => Math.min(distanceLy / years, 0.999999);
// Speed needed so the ship-frame trip takes `years`: d/β · sqrt(1-β²) = τ  ->  β = d / sqrt(d² + τ²).
export const betaForShipTime = (distanceLy, years) => distanceLy / Math.sqrt(distanceLy * distanceLy + years * years);

// Light clock with mirror separation chosen so one ship-frame tick (up and back) is 1 s.
// External-frame tick lasts gamma seconds; photon path per tick is c·gamma·1s in that frame.
export function lightClockTick(beta) {
  const g = gamma(beta);
  return { shipTick: 1, externalTick: g, shipPathLs: 1, externalPathLs: g };
}

// Level 3 mastery check. answers: { prediction, calibrationShip (for 10 external s at 0.8c),
// destinationLy, beta, targetShipYears, explanation: string[] of chosen reasons }
export function checkLevel3Mastery(answers) {
  const issues = [];
  if (answers.prediction !== "ship less") issues.push("prediction: the ship clock records less time than the external frame");
  if (Math.abs(Number(answers.calibrationShip) - 6) > 0.01) issues.push("calibration: at 0.8c, 10 external seconds correspond to 6 ship seconds");
  const d = Number(answers.destinationLy), b = Number(answers.beta), target = Number(answers.targetShipYears);
  if (!(d > 0) || !(b > 0 && b < 1)) issues.push("journey: choose a destination and a speed below c");
  else {
    const t = cruise(d, b);
    if (t.shipYears > target + 1e-9) issues.push(`journey: ship time ${t.shipYears.toFixed(2)} y exceeds the ${target} y target`);
  }
  const need = ["path longer at same speed", "each clock normal locally", "frames disagree on distance"];
  const wrong = ["light slows down", "signal delay"];
  const got = new Set(answers.explanation || []);
  if (!need.every((n) => got.has(n))) issues.push("explanation: include all three reasons");
  if (wrong.some((w) => got.has(w))) issues.push("explanation: light's speed is c in every frame, and this isn't a signal delay");
  return { passed: issues.length === 0, issues };
}
