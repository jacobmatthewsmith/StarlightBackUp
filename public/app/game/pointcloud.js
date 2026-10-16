// Point-cloud celestial bodies: a sphere implied by randomly scattered luminous dots.
//
// Directions are normalised Gaussian triples (uniform over the sphere, no lat/long
// pattern); radii sit in a shell (planets) or fill the ball (the Sun), so rotating the
// view gives real parallax. Each body's layout is seeded, so it never shimmers. Each dot
// carries a fixed random threshold: the sunlit side shows more and brighter dots, the
// night side thins into darkness. Drawn additively on a black canvas.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STRIDE = 5; // x, y, z (unit body radius), threshold, brightness

// n points; inner = innermost radius as a fraction of the body radius (0 fills the ball).
// ring: { inner, outer, n } adds a thin flat annulus in the equatorial plane (Saturn).
export function makeCloud({ n, seed, inner = 0.86, ring = null }) {
  const rand = mulberry32(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const total = n + (ring ? ring.n : 0);
  const pts = new Float32Array(total * STRIDE);
  const i3 = inner ** 3;
  for (let i = 0; i < n; i++) {
    let x = gauss(), y = gauss(), z = gauss();
    const m = Math.hypot(x, y, z) || 1;
    const r = Math.cbrt(i3 + rand() * (1 - i3)); // uniform by volume within the shell
    pts.set([(x / m) * r, (y / m) * r, (z / m) * r, rand(), 0.55 + 0.45 * rand()], i * STRIDE);
  }
  if (ring) {
    const a2 = ring.inner ** 2, b2 = ring.outer ** 2;
    for (let i = 0; i < ring.n; i++) {
      const r = Math.sqrt(a2 + rand() * (b2 - a2)), th = 2 * Math.PI * rand();
      pts.set([r * Math.cos(th), r * Math.sin(th), (rand() - 0.5) * 0.01, -1 - rand(), 0.4 + 0.4 * rand()], (n + i) * STRIDE);
    }
  }
  return { pts, n, total };
}

// Rotation: spin `phase` about the body's own axis, then tilt that axis by `obliquity`
// toward +y. Returns a 3x3 row-major matrix.
export function bodyRotation(phase, obliquity) {
  const cs = Math.cos(phase), ss = Math.sin(phase), co = Math.cos(obliquity), so = Math.sin(obliquity);
  // R = Rx(-obliquity) · Rz(phase)
  return [cs, -ss, 0, co * ss, co * cs, so, -so * ss, -so * cs, co];
}

// Draw one body. project(p) -> [sx, sy, f, camZ] | null.
//   center: world position; radius: world radius; rot: bodyRotation(); sunDir: unit
//   vector from the body toward the Sun (null for the Sun itself); rgb "r,g,b";
//   rpx: on-screen radius in px (sets how many dots are worth drawing); alpha: 0..1.
export function drawCloud(ctx, cloud, { project, center, radius, rot, sunDir, rgb, rpx, alpha = 1, camZ0 }) {
  const want = Math.min(cloud.n, Math.max(120, Math.round(rpx * rpx * 0.5)));
  const ringWant = cloud.total > cloud.n ? Math.min(cloud.total - cloud.n, Math.max(40, Math.round(rpx * rpx * 1.2))) : 0;
  const size = rpx > 60 ? 1.7 : rpx > 20 ? 1.4 : 1.1;
  const P = cloud.pts;
  const [r0, r1, r2, r3, r4, r5, r6, r7, r8] = rot;
  ctx.fillStyle = `rgb(${rgb})`;
  const draw = (i) => {
    const o = i * STRIDE;
    const lx = P[o], ly = P[o + 1], lz = P[o + 2], t = P[o + 3], b = P[o + 4];
    const nx = r0 * lx + r1 * ly + r2 * lz, ny = r3 * lx + r4 * ly + r5 * lz, nz = r6 * lx + r7 * ly + r8 * lz;
    let a;
    if (!sunDir) a = b;                                       // the Sun: self-luminous
    else {
      if (t < 0) a = b * (0.3 + 0.7 * Math.abs(r2 * sunDir[0] + r5 * sunDir[1] + r8 * sunDir[2])); // ring: lit by the sun's angle to its plane
      else {
        const l = (nx * sunDir[0] + ny * sunDir[1] + nz * sunDir[2]) / (Math.hypot(nx, ny, nz) || 1);
        const light = Math.max(0, Math.min(1, (l + 0.15) / 1.15));
        if (t > 0.12 + 0.88 * light) return;                  // fewer dots on the night side
        a = b * (0.12 + 1.1 * light ** 0.8);
      }
    }
    const q = project([center[0] + nx * radius, center[1] + ny * radius, center[2] + nz * radius]);
    if (!q) return;
    if (camZ0 != null && q[3] > camZ0) a *= 0.55;             // far half of the sphere, dimmer
    ctx.globalAlpha = Math.min(1, a * alpha);
    ctx.fillRect(q[0] - size / 2, q[1] - size / 2, size, size);
  };
  for (let i = 0; i < want; i++) draw(i);
  for (let i = 0; i < ringWant; i++) draw(cloud.n + i);
  ctx.globalAlpha = 1;
  return want + ringWant;
}
