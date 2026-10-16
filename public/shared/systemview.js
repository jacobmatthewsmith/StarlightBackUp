// Shared 3D drawing of a player-built (FICTIONAL) system: star, tilted circular orbits,
// planets, and optional red gravity dots. Used by the Level 1 builder/trial and by the
// Explore-mode system view of published systems.

import * as P from "./physics.js";
import { drawGravityDots, tilt } from "./view3d.js";

export function drawSystem(view, sys, t, { dots = true } = {}) {
  const ms = sys.star.massSun;
  const bodies = [{ m: ms, x: [0, 0, 0] }];
  const positions = sys.planets.map((p) => {
    const period = Math.sqrt(p.aAU ** 3 / ms);
    const ang = (p.phaseDeg * Math.PI) / 180 + (2 * Math.PI * t) / (period * 4); // 4 s per year of playback
    const pos = tilt([p.aAU * Math.cos(ang), p.aAU * Math.sin(ang), 0], (p.inclinationDeg * Math.PI) / 180, (p.nodeDeg * Math.PI) / 180);
    bodies.push({ m: p.massEarth * P.EARTH_IN_SUN, x: pos });
    return pos;
  });
  const extent = Math.max(2, ...sys.planets.map((p) => p.aAU)) * 1.15;
  if (dots) {
    // A cloud around the star out to the edge of the system, and one around each planet out
    // to roughly its Hill radius (where its own pull stops dominating the star's).
    const sources = [{ pos: [0, 0, 0], rMin: extent * 0.04, rMax: extent, perShell: 30 }];
    sys.planets.forEach((p, i) => {
      const hill = p.aAU * Math.cbrt((p.massEarth * P.EARTH_IN_SUN) / (3 * ms));
      const rMax = Math.max(extent * 0.03, Math.min(p.aAU * 0.5, hill * 1.5));
      sources.push({ pos: positions[i], rMin: rMax / 6, rMax, perShell: 14 });
    });
    drawGravityDots(view, (q) => P.accelerationAt(bodies, q, -1, (extent * 0.004) ** 2), { sources, ref: P.G_AU * ms / extent ** 2, ticks: false });
  }
  view.dot([0, 0, 0], 7, "#fff");
  sys.planets.forEach((p, i) => {
    view.orbit(p.aAU, (p.inclinationDeg * Math.PI) / 180, (p.nodeDeg * Math.PI) / 180, "rgba(255,255,255,0.22)");
    view.dot(positions[i], Math.max(2, Math.min(6, 1.5 + Math.log10(p.massEarth + 1) * 1.4)), "#fff");
    view.label(positions[i], p.name);
  });
  return extent;
}

