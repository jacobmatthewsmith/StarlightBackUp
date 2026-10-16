// Light clock, two frames. Adapted from Jacob's light-clock page (../../light-clock/
// light-clock.js): same model, same layout, packaged so Level 3 can drive it.
//
// One simulation, driven by external-frame elapsed time t (seconds). Units: c = 1
// light-second per second. Mirror separation L = 0.5 light-seconds, so one round trip
// aboard takes exactly 1 ship second. In the external frame the ship and photon move
// sideways at v; the photon's vertical speed is c/γ, so its total speed is still c.
// Photons are yellow (game colour rule); clocks and ships are white.

import { gamma } from "./physics.js";
import { PHOTON_YELLOW } from "./view3d.js";

const EPS = 1e-9;
const ticks = (time) => Math.floor(time + EPS);

// 0 at the bottom mirror, 1 at the top, as a function of ship time.
export function pulseHeight(tau) {
  const p = Math.max(0, tau - ticks(tau));
  return p < 0.5 ? p * 2 : 2 - p * 2;
}

// Draw both panels into one canvas context. box = {x, y, w, h}. state = { beta, t }.
export function drawLightClocks(c, box, { beta, t }) {
  const g = gamma(beta);
  const tau = t / g;
  const half = box.w / 2 - 10;
  const L = Math.min(110, box.h * 0.45); // px for 0.5 light-second
  const cpx = 2 * L;                      // px per light-second
  const top = box.y + 40, bottom = top + L;

  c.save();
  c.font = '11px "Courier New", monospace';
  c.textBaseline = "alphabetic";

  // --- ship frame ---
  const sx = box.x + half / 2;
  panelFrame(c, box.x, box.y, half, box.h, "aboard the ship");
  mirrors(c, sx, top, bottom);
  c.strokeStyle = `rgba(${PHOTON_YELLOW},0.35)`;
  c.setLineDash([4, 4]);
  c.beginPath(); c.moveTo(sx, top); c.lineTo(sx, bottom); c.stroke();
  c.setLineDash([]);
  photon(c, sx, bottom - pulseHeight(tau) * L);
  c.fillStyle = "#ccc";
  c.fillText(`ship clock: ${tau.toFixed(2)} s`, box.x + 8, box.y + box.h - 26);
  c.fillText("light speed: c, measured aboard", box.x + 8, box.y + box.h - 10);

  // --- external frame ---
  const ex0 = box.x + half + 20;
  panelFrame(c, ex0, box.y, half, box.h, "measured from outside");
  c.save();
  c.beginPath(); c.rect(ex0, box.y, half, box.h); c.clip();
  const shipX = beta * t * cpx;
  const cam = Math.max(0, shipX - half * 0.55);
  const X = (wx) => ex0 + 30 + wx - cam;
  // zigzag trail: bounces every half tick (γ/2 external seconds)
  const halfTicks = Math.floor(tau * 2 + EPS);
  const step = (beta * g * cpx) / 2;
  const kStart = step > 0 ? Math.max(0, Math.floor((cam - 30) / Math.max(step, 1e-9)) - 1) : Math.max(0, halfTicks - 1);
  c.strokeStyle = `rgba(${PHOTON_YELLOW},0.45)`;
  c.beginPath();
  for (let k = kStart; k <= halfTicks; k++) {
    const x = X(beta * ((k * g) / 2) * cpx), y = k % 2 === 0 ? bottom : top;
    k === kStart ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  const py = bottom - pulseHeight(tau) * L;
  c.lineTo(X(shipX), py);
  c.stroke();
  mirrors(c, X(shipX), top, bottom);
  photon(c, X(shipX), py);
  c.restore();
  c.fillStyle = "#ccc";
  c.fillText(`outside clock: ${t.toFixed(2)} s`, ex0 + 8, box.y + box.h - 26);
  c.fillText("light speed: c, measured outside", ex0 + 8, box.y + box.h - 10);
  c.restore();
}

function panelFrame(c, x, y, w, h, title) {
  c.strokeStyle = "#555";
  c.strokeRect(x + 0.5, y + 0.5, w, h);
  c.fillStyle = "#fff";
  c.font = 'bold 12px "Courier New", monospace';
  c.fillText(title, x + 8, y + 18);
  c.font = '11px "Courier New", monospace';
}

function mirrors(c, x, top, bottom) {
  c.strokeStyle = "#fff";
  c.lineWidth = 1;
  c.strokeRect(x - 34, top - 14, 68, bottom - top + 28);
  c.lineWidth = 4;
  c.beginPath(); c.moveTo(x - 24, top); c.lineTo(x + 24, top); c.moveTo(x - 24, bottom); c.lineTo(x + 24, bottom); c.stroke();
  c.lineWidth = 1;
}

function photon(c, x, y) {
  c.fillStyle = `rgb(${PHOTON_YELLOW})`;
  c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
}
