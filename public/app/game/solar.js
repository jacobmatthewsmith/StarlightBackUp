// The Solar System at true scale, for the Game. Units: AU, days, ecliptic J2000 (z = north
// ecliptic pole). Positions are real for the given date.
//
// Sources
//   Orbits: E. M. Standish (JPL), "Keplerian Elements for Approximate Positions of the Major
//     Planets", Table 1 (valid 1800–2050): a, e, I, L, ϖ, Ω at J2000; mean motion from the
//     NSSDC sidereal periods (solar-system.js).
//   Radii, sidereal rotation periods, obliquities: NASA NSSDC planetary fact sheets.
//   Sun: IAU 2015 nominal solar radius (695,700 km); rotation ~25.4 d (Carrington).
//   Moon: low-precision lunar position from the Astronomical Almanac (good to ~0.3°).
// Spin-axis directions are simplified (each axis is tilted by its true obliquity toward the
// same direction); positions, sizes and distances are not.

export const KM_PER_AU = 149597870.7;
const J2000 = Date.UTC(2000, 0, 1, 12);
export const daysSinceJ2000 = (ms) => (ms - J2000) / 86400000;
const RAD = Math.PI / 180;

// name: [a, e, I, L, varpi, Omega], deg
const ELEMENTS = {
  Mercury: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593],
  Venus: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255],
  Earth: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
  Mars: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
  Jupiter: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
  Saturn: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
  Uranus: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503],
  Neptune: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
};
// NSSDC: obliquity (deg), sidereal rotation (hours; negative = retrograde)
const SPIN = {
  Sun: [7.25, 609.12], Mercury: [0.034, 1407.6], Venus: [177.4, -5832.6], Earth: [23.44, 23.9345],
  Moon: [1.54, 655.72], Mars: [25.19, 24.6229], Jupiter: [3.13, 9.925], Saturn: [26.73, 10.656],
  Uranus: [97.77, -17.24], Neptune: [28.32, 16.11],
};
// Restrained colour language (decided with the designer, not measured colours).
const COLOUR = {
  Sun: "255,240,214", Mercury: "176,174,170", Venus: "226,208,150", Earth: "104,150,226", Moon: "170,170,168",
  Mars: "196,104,72", Jupiter: "214,188,152", Saturn: "222,202,150", Uranus: "160,210,216", Neptune: "104,132,224",
};

const info = (name) => (typeof SOLAR_SYSTEM !== "undefined" ? SOLAR_SYSTEM.bodies.find((b) => b.name === name) : null);
const MOON = info("Earth")?.moons.find((m) => m.name === "Moon");

export const BODIES = [
  { name: "Sun", radiusKm: 695700, massEarth: 332946, kind: "star" },
  ...Object.keys(ELEMENTS).map((name) => {
    const b = info(name);
    return { name, kind: "planet", radiusKm: b?.radiusKm, massEarth: b?.mass, periodDays: b?.period, el: ELEMENTS[name] };
  }),
  { name: "Moon", kind: "moon", radiusKm: MOON?.radiusKm ?? 1737.4, parent: "Earth" },
].map((b) => ({ ...b, radius: b.radiusKm / KM_PER_AU, obliquity: SPIN[b.name][0] * RAD, rotHours: SPIN[b.name][1], rgb: COLOUR[b.name] }));

function kepler(M, e) {
  let E = M + e * Math.sin(M);
  for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

// Heliocentric ecliptic position from elements at eccentric anomaly E.
function fromE(el, E) {
  const [a, e, I, , varpi, Omega] = el;
  const w = (varpi - Omega) * RAD, O = Omega * RAD, i = I * RAD;
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(i), si = Math.sin(i);
  return [
    (cw * cO - sw * sO * ci) * xp + (-sw * cO - cw * sO * ci) * yp,
    (cw * sO + sw * cO * ci) * xp + (-sw * sO + cw * cO * ci) * yp,
    sw * si * xp + cw * si * yp,
  ];
}

export function planetPosition(body, d) {
  const el = body.el;
  const M = ((el[3] - el[4]) * RAD + (2 * Math.PI * d) / body.periodDays) % (2 * Math.PI);
  return fromE(el, kepler(M, el[1]));
}

// The whole orbit as a closed path (n points), for drawing.
export function orbitPath(body, n = 360) {
  const pts = [];
  for (let k = 0; k <= n; k++) pts.push(fromE(body.el, (k / n) * 2 * Math.PI));
  return pts;
}

// Geocentric Moon (AU), Astronomical Almanac low-precision formulae.
export function moonOffset(d) {
  const L = (218.316 + 13.176396 * d) * RAD, M = (134.963 + 13.064993 * d) * RAD, F = (93.272 + 13.22935 * d) * RAD;
  const lon = L + 6.289 * RAD * Math.sin(M), lat = 5.128 * RAD * Math.sin(F);
  const r = (385001 - 20905 * Math.cos(M)) / KM_PER_AU;
  return [r * Math.cos(lat) * Math.cos(lon), r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat)];
}

// Positions of every body at day d (since J2000).
export function positions(d) {
  const out = { Sun: [0, 0, 0] };
  for (const b of BODIES) if (b.el) out[b.name] = planetPosition(b, d);
  const m = moonOffset(d);
  out.Moon = [out.Earth[0] + m[0], out.Earth[1] + m[1], out.Earth[2] + m[2]];
  return out;
}
