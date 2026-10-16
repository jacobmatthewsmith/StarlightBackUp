// starlight catalog build. Reproducible, cached, resumable; never sends data to an LLM.
//
//   node catalog-build/build.mjs            # fetch anything missing from cache/, then build
//   node catalog-build/build.mjs --refetch   # ignore cached downloads
//
// Output: public/catalog/ (manifest, search index, spatial chunks, featured, systems).
// Coordinate convention (everywhere): heliocentric galactic Cartesian, light years.
//   x → galactic centre (l = 0°, b = 0°), y → l = 90° (direction of rotation), z → north galactic pole.

import { readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { enrich, ENRICH_SOURCES, COLOUR_CLASSES, ZODIAC } from "./enrich.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CACHE = join(HERE, "cache");
const OUT = join(ROOT, "public", "catalog");
const RESEARCH = join(ROOT, "research");
const REFETCH = process.argv.includes("--refetch");

const LY_PER_PC = 3.261563777;
const CHUNK_MAX = 900;           // objects per spatial chunk (target 500–1,000)
const MATCH_DEG = 0.05;          // nearby-system ↔ catalog match: within 3′ on the sky (allows for
const MATCH_DIST = 0.10;         // fast proper motion between epochs) and within 10% in distance

// ---------- pinned sources ----------
export const SOURCES = {
  gaia: {
    title: "Gaia Data Release 3 (gaiadr3.gaia_source + gaiadr3.hipparcos2_best_neighbour)",
    release: "Gaia DR3 (2022-06-13)",
    citation: "Gaia Collaboration, Vallenari et al. 2023, A&A 674, A1",
    url: "https://gea.esac.esa.int/archive/",
    query: "SELECT g.source_id, g.ra, g.dec, g.l, g.b, g.parallax, g.parallax_error, g.parallax_over_error, g.ruwe, g.phot_g_mean_mag, g.bp_rp, g.teff_gspphot, h.original_ext_source_id AS hip FROM gaiadr3.gaia_source AS g LEFT OUTER JOIN gaiadr3.hipparcos2_best_neighbour AS h ON h.source_id = g.source_id WHERE (g.parallax > 32.6 OR g.phot_g_mean_mag < 6.5) AND g.parallax_over_error > 10",
    selection: "Union of (a) every Gaia DR3 source with parallax > 32.6 mas (within ~30.7 pc / ~100 ly, matching Explore's 100 ly view) and (b) every source brighter than G = 6.5 (roughly naked-eye), both restricted to parallax_over_error > 10.",
    distance: "distance = 1 / parallax. With fractional parallax error below 10%, simple inversion is a good estimator (bias well under the quoted uncertainty). Uncertainty propagated as σd ≈ d · σϖ/ϖ. RUWE > 1.4 is flagged as a less reliable astrometric solution.",
  },
  iauNames: { title: "IAU Catalog of Star Names (WGSN), maintained list", url: "https://www.pas.rochester.edu/~emamajek/WGSN/IAU-CSN.txt", citation: "IAU Working Group on Star Names" },
  openngc: { title: "OpenNGC (Messier identifications, types, positions)", url: "https://github.com/mattiaverga/OpenNGC", citation: "Verga, M. OpenNGC, CC-BY-SA-4.0" },
  hunt2023: { title: "Hunt & Reffert 2023 open-cluster catalogue (VizieR J/A+A/673/A114)", url: "https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=J/A+A/673/A114", citation: "Hunt, E. L. & Reffert, S. 2023, A&A 673, A114" },
  hipparcos: {
    title: "Hipparcos, the New Reduction (VizieR I/311/hip2)",
    url: "https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=I/311",
    citation: "van Leeuwen, F. 2007, A&A 474, 653",
    selection: "Bright-star supplement: Hp < 6.5 and parallax > 10 × its error, added only where the Gaia DR3 sample has no counterpart (by HIP cross-match, then by position and distance). Gaia DR3 lacks reliable parallaxes for the very brightest stars (G ≲ 3), e.g. Vega, Betelgeuse, Rigel.",
  },
  baumgardt: { title: "Fundamental parameters of Galactic globular clusters (orbits table)", url: "https://people.smp.uq.edu.au/HolgerBaumgardt/globular/", citation: "Baumgardt, H. & Vasiliev, E. 2021, MNRAS 505, 5957 (distances)" },
  simbad: { title: "SIMBAD astronomical database (identifier resolution only)", url: "https://simbad.cds.unistra.fr/", citation: "Wenger et al. 2000, A&AS 143, 9" },
  research: { title: "starlight research batches (nearby systems, Solar System, Messier nebulae, featured stories)", url: "research/ in this repository", citation: "Bounded AI-assisted research with per-item source URLs" },
};

// ---------- fetching (cached) ----------
async function cached(name, fetcher) {
  const file = join(CACHE, name);
  if (!REFETCH) { try { await stat(file); return readFile(file, "utf8"); } catch {} }
  console.log(`fetching ${name} …`);
  const text = await fetcher();
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, text);
  return text;
}

async function gaiaAsync(query) {
  const body = new URLSearchParams({ REQUEST: "doQuery", LANG: "ADQL", FORMAT: "csv", PHASE: "RUN", QUERY: query });
  const res = await fetch("https://gea.esac.esa.int/tap-server/tap/async", { method: "POST", body, redirect: "manual" });
  const job = res.headers.get("location");
  if (!job) throw new Error(`Gaia job not created (${res.status})`);
  for (let i = 0; i < 180; i++) {
    const phase = (await (await fetch(`${job}/phase`)).text()).trim();
    if (phase === "COMPLETED") break;
    if (phase === "ERROR" || phase === "ABORTED") throw new Error(`Gaia job ${phase}: ${job}`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  return (await fetch(`${job}/results/result`)).text();
}

// Identifier resolution for featured objects that the bulk catalogs don't name.
// SIMBAD id → [Gaia DR3 id | HIP id]. Display name on the left.
const FEATURED_RESOLVE = { "TRAPPIST-1": "TRAPPIST-1", Betelgeuse: "* alf Ori", Antares: "* alf Sco", Deneb: "* alf Cyg" };

async function simbadSync(query) {
  const body = new URLSearchParams({ REQUEST: "doQuery", LANG: "ADQL", FORMAT: "csv", QUERY: query });
  const res = await fetch("https://simbad.cds.unistra.fr/simbad/sim-tap/sync", { method: "POST", body });
  if (!res.ok) throw new Error(`SIMBAD ${res.status}`);
  return res.text();
}

async function vizierSync(query) {
  const body = new URLSearchParams({ REQUEST: "doQuery", LANG: "ADQL", FORMAT: "csv", QUERY: query });
  const res = await fetch("https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync", { method: "POST", body });
  if (!res.ok) throw new Error(`VizieR ${res.status}`);
  return res.text();
}

// NASA Exoplanet Archive TAP (synchronous; results are small).
async function tapSync(query) {
  const res = await fetch(`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(query)}&format=csv`);
  if (!res.ok) throw new Error(`Exoplanet Archive ${res.status}`);
  return res.text();
}

const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${url} ${r.status}`); return r.text(); };

// ---------- parsing ----------
function parseCsv(text, delim = ",") {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...data] = rows;
  return data.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ""])));
}

const num = (s) => (s === "" || s == null ? null : Number(s));
const round = (x, d = 4) => (x == null ? null : Number(x.toFixed(d)));

// Galactic (l, b in degrees, distance in ly) → Cartesian ly.
function galXYZ(lDeg, bDeg, dLy) {
  const l = (lDeg * Math.PI) / 180, b = (bDeg * Math.PI) / 180;
  return [dLy * Math.cos(b) * Math.cos(l), dLy * Math.cos(b) * Math.sin(l), dLy * Math.sin(b)];
}

// Equatorial J2000 (degrees) → galactic (degrees), standard rotation.
const EQ_TO_GAL = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.4448296300, 0.7469822445],
  [-0.8676661490, -0.1980763734, 0.4559837762],
];
function eqToGal(raDeg, decDeg) {
  const a = (raDeg * Math.PI) / 180, d = (decDeg * Math.PI) / 180;
  const e = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  const [x, y, z] = EQ_TO_GAL.map((r) => r[0] * e[0] + r[1] * e[1] + r[2] * e[2]);
  return { l: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, b: (Math.asin(z) * 180) / Math.PI };
}

function hms(s) { const [h, m, x] = s.split(":").map(Number); return 15 * (h + m / 60 + x / 3600); }
function dms(s) { const sign = s.trim().startsWith("-") ? -1 : 1; const [d, m, x] = s.replace(/^[+-]/, "").split(":").map(Number); return sign * (d + m / 60 + x / 3600); }

// IAU-CSN fixed-ish columns: name, ascii, designation, bayer…, con, comp, wds, mag, band, HIP, HD, RA, Dec, date
function parseIauNames(text) {
  const byHip = new Map();
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#") || line.startsWith("$")) continue;
    const m = line.match(/^(\S.{0,17}?)\s{2,}(\S.*?)\s{2,}(\S.*?)\s{2,}.*?\s([A-Z][A-Za-z]{2})\s+\S+\s+\S+\s+(-?[\d.]+|_)\s+\S\s+(\d+|_)\s+(\d+|_)\s+([\d.]+)\s+(-?[\d.]+)/);
    if (!m) continue;
    const [, name, , designation, con, , hip] = m;
    if (hip !== "_") byHip.set(hip, { name: name.trim(), designation: designation.trim(), constellation: con });
  }
  return byHip;
}

// ---------- research inputs (nearby systems, Solar System, Messier, featured) ----------
async function loadJs(file, name) {
  const src = await readFile(file, "utf8");
  return new Function(`${src}; return ${name};`)();
}

async function readJsonMaybe(file) { try { return JSON.parse(await readFile(file, "utf8")); } catch { return null; } }

// ---------- build ----------
async function main() {
  const gaiaCsv = await cached("gaia_dr3_sample_100ly.csv", () => gaiaAsync(SOURCES.gaia.query));
  const iauText = await cached("iau_csn.txt", () => get(SOURCES.iauNames.url));
  const ngcText = await cached("openngc_NGC.csv", () => get("https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv"));
  const addText = await cached("openngc_addendum.csv", () => get("https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/addendum.csv"));
  const baumText = await cached("baumgardt_orbits.txt", () => get("https://people.smp.uq.edu.au/HolgerBaumgardt/globular/orbits_table.txt"));

  const messierRows = [...parseCsv(ngcText, ";"), ...parseCsv(addText, ";")].filter((r) => r.M);
  const ocNames = messierRows.filter((r) => r.Type === "OCl").map((r) => hrName(r.Name));
  const extraClusters = ["Melotte_25"]; // Hyades (featured, not Messier)
  const hrText = await cached("hunt2023_messier_ocl_v2.csv", () =>
    vizierSync(`SELECT Name, AllNames, N, RA_ICRS, DE_ICRS, GLON, GLAT, dist16, dist50, dist84, logAge50 FROM "J/A+A/673/A114/clusters" WHERE ${[...ocNames, ...extraClusters].map((n) => `AllNames LIKE '%${n}%'`).join(" OR ")}`));
  const hipText = await cached("hip2_bright.csv", () =>
    vizierSync(`SELECT HIP, RArad, DErad, Plx, e_Plx, Hpmag, "B-V" AS bv FROM "I/311/hip2" WHERE Hpmag < 6.5 AND Plx > 10*e_Plx`));

  const iau = parseIauNames(iauText);
  const objects = [];
  const seen = new Set();
  const stats = { gaiaRows: 0, gaiaDuplicates: 0, named: 0, ruweFlagged: 0, missingColour: 0, missingTeff: 0 };

  // 1. Gaia stars
  for (const r of parseCsv(gaiaCsv)) {
    stats.gaiaRows++;
    const id = `actual:gaia-dr3:${r.source_id}`;
    if (seen.has(id)) { stats.gaiaDuplicates++; continue; }
    seen.add(id);
    const plx = Number(r.parallax), eplx = Number(r.parallax_error);
    const dLy = (1000 / plx) * LY_PER_PC;
    const [x, y, z] = galXYZ(Number(r.l), Number(r.b), dLy);
    const hip = r.hip ? String(r.hip) : null;
    const nm = hip ? iau.get(hip) : null;
    if (nm) stats.named++;
    const ruwe = num(r.ruwe);
    if (ruwe != null && ruwe > 1.4) stats.ruweFlagged++;
    if (r.bp_rp === "") stats.missingColour++;
    if (r.teff_gspphot === "") stats.missingTeff++;
    objects.push({
      id, type: "star", name: nm?.name || null,
      ids: { gaia: `Gaia DR3 ${r.source_id}`, ...(hip && { hip: `HIP ${hip}` }), ...(nm?.designation && nm.designation !== "_" && { designation: nm.designation }) },
      p: [round(x), round(y), round(z)], d: round(dLy, 3), de: round(dLy * (eplx / plx), 3),
      g: round(num(r.phot_g_mean_mag), 3), c: round(num(r.bp_rp), 3), teff: num(r.teff_gspphot) ? Math.round(num(r.teff_gspphot)) : null,
      ruwe: round(ruwe, 3), ra: round(Number(r.ra), 6), dec: round(Number(r.dec), 6), src: "gaia",
      ...(nm?.constellation && { con: nm.constellation }),
    });
  }

  // 1b. Hipparcos bright-star supplement (only where Gaia has no counterpart).
  const gaiaHip = new Set(objects.map((o) => o.ids.hip).filter(Boolean));
  const gaiaByDir = objects.map((o) => ({ o, ra: o.ra, dec: o.dec }));
  stats.hipAdded = 0; stats.hipSkippedAsDuplicate = 0;
  for (const r of parseCsv(hipText)) {
    const hipId = `HIP ${r.HIP}`;
    if (gaiaHip.has(hipId)) continue;
    const ra = Number(r.RArad), dec = Number(r.DErad), plx = Number(r.Plx), eplx = Number(r.e_Plx);
    const dLy = (1000 / plx) * LY_PER_PC;
    // Same star already in Gaia without a HIP cross-match? Hipparcos (J1991.25) and Gaia
    // (J2016.0) epochs differ by ~25 years, so fast-moving nearby stars can shift by minutes
    // of arc: match within 5′, 5% in distance, and 1.5 mag in brightness.
    const hp = Number(r.Hpmag);
    const dup = gaiaByDir.find(({ o }) => !o.ids.hip && Math.abs(o.dec - dec) < 0.1 && angSep(o.ra, o.dec, ra, dec) < 300 / 3600
      && Math.abs(o.d - dLy) / dLy < 0.05 && (o.g == null || Math.abs(o.g - hp) < 1.5));
    if (dup) {
      // Enrich the Gaia star with the Hipparcos id and IAU name instead of dropping them.
      stats.hipSkippedAsDuplicate++;
      dup.o.ids.hip = hipId;
      const nmDup = iau.get(String(r.HIP));
      if (nmDup && !dup.o.name) {
        dup.o.name = nmDup.name;
        if (nmDup.designation && nmDup.designation !== "_") dup.o.ids.designation = nmDup.designation;
        if (nmDup.constellation) dup.o.con = nmDup.constellation;
        stats.named++;
      }
      gaiaHip.add(hipId);
      continue;
    }
    const g = eqToGal(ra, dec);
    const [x, y, z] = galXYZ(g.l, g.b, dLy);
    const nm = iau.get(String(r.HIP));
    if (nm) stats.named++;
    stats.hipAdded++;
    objects.push({
      id: `actual:hip:${r.HIP}`, type: "star", name: nm?.name || null,
      ids: { hip: hipId, ...(nm?.designation && nm.designation !== "_" && { designation: nm.designation }) },
      p: [round(x), round(y), round(z)], d: round(dLy, 3), de: round(dLy * (eplx / plx), 3),
      hp: round(num(r.Hpmag), 3), bv: round(num(r.bv), 3), ra: round(ra, 6), dec: round(dec, 6), src: "hipparcos",
      ...(nm?.constellation && { con: nm.constellation }),
    });
  }

  // 2. Nearby researched systems + the Sun: match to Gaia sources in 3D, never double-count.
  const STAR_DATA = await loadJs(join(ROOT, "public", "star-data.js"), "STAR_DATA");
  const systems = [];
  const matchLog = [];
  for (const [name, info] of Object.entries(STAR_DATA)) {
    if (name === "Sun") continue;
    if (info.ra == null || info.dec == null || info.distance_ly == null) continue;
    const { l, b } = eqToGal(info.ra * 15, info.dec);
    const pos = galXYZ(l, b, info.distance_ly);
    const raDeg = info.ra * 15;
    const comps = objects.filter((o) => (o.src === "gaia" || o.src === "hipparcos") && Math.abs(o.dec - info.dec) < MATCH_DEG * 2
      && angSep(o.ra, o.dec, raDeg, info.dec) < MATCH_DEG && Math.abs(o.d - info.distance_ly) / info.distance_ly < MATCH_DIST);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const sysId = `actual:system:${slug}`;
    for (const c of comps) { c.system = sysId; if (!c.name) c.name = comps.length === 1 ? name : `${name} (${c.ids.gaia || c.ids.hip})`; }
    matchLog.push({ system: name, catalogComponents: comps.map((c) => c.ids.gaia || c.ids.hip) });
    systems.push({
      id: sysId, type: "star system", name, ids: {}, p: pos.map((v) => round(v)), d: info.distance_ly, de: null,
      src: "research", components: comps.map((c) => c.id), counted: comps.length === 0,
      hasDetail: true, constellation: info.constellation || null,
    });
  }
  objects.push({ id: "actual:sol", type: "star", name: "Sun", ids: {}, p: [0, 0, 0], d: 0, de: 0, src: "research", system: "actual:system:solar-system", counted: true });
  systems.push({ id: "actual:system:solar-system", type: "star system", name: "Solar System", ids: {}, p: [0, 0, 0], d: 0, src: "research", components: ["actual:sol"], counted: false, hasDetail: true });
  for (const s of systems) objects.push(s);

  // 3. Messier: Milky Way members with defensible distances; external galaxies separate.
  const baum = new Map();
  for (const line of baumText.split("\n")) {
    if (line.startsWith("#") || !line.trim()) continue;
    const f = line.trim().split(/\s+/);
    baum.set(f[0], { ra: Number(f[1]), dec: Number(f[2]), l: Number(f[3]), b: Number(f[4]), rsunKpc: Number(f[5]), dKpc: Number(f[6]) });
  }
  const hrRows = parseCsv(hrText);
  const hrFind = (name) => hrRows.find((r) => r.Name === name)
    || hrRows.filter((r) => r.AllNames.split(",").includes(name)).sort((a, b) => Number(b.N) - Number(a.N))[0];
  const hr = { get: hrFind };
  const nebulae = (await readJsonMaybe(join(RESEARCH, "messier_nebulae.json"))) || [];
  const neb = new Map(nebulae.map((n) => [Number(String(n.messier).replace(/\D/g, "")), n]));
  const messier = { inGalaxy: 0, external: 0, noDistance: [], sources: {} };
  const skyOnly = [];
  for (const r of messierRows.sort((a, b) => Number(a.M) - Number(b.M))) {
    const m = Number(r.M);
    const common = (r["Common names"] || "").split(",")[0] || null;
    const name = common ? `M${m} (${common})` : `M${m}`;
    const ra = r.RA ? hms(r.RA) : null, dec = r.Dec ? dms(r.Dec) : null;
    const base = { id: `actual:messier:m${m}`, name, ids: { messier: `M${m}`, ...(r.Name && !r.Name.startsWith("M") && { ngc: r.Name }) }, ra: round(ra, 5), dec: round(dec, 5), con: r.Const || null };
    if (["G", "GPair", "GGroup", "GTrpl"].includes(r.Type) || r.Type === "Dup") {
      messier.external++;
      skyOnly.push({ ...base, type: r.Type === "Dup" ? "disputed identification" : "external galaxy", layer: "external", note: r.Type === "Dup" ? "M102's identity is disputed; often equated with NGC 5866 (a galaxy)." : "Outside the Milky Way: shown by sky direction only." });
      continue;
    }
    let dLy = null, lo = null, hi = null, method = null, src = null, type = { GCl: "globular cluster", OCl: "open cluster" }[r.Type] || null;
    if (r.Type === "GCl") {
      const b = baum.get(r.Name.replace(/^NGC0*/, "NGC_").replace(/^IC0*/, "IC_"));
      if (b) { dLy = b.rsunKpc * 1000 * LY_PER_PC; lo = (b.rsunKpc - b.dKpc) * 1000 * LY_PER_PC; hi = (b.rsunKpc + b.dKpc) * 1000 * LY_PER_PC; method = "Baumgardt & Vasiliev 2021 mean distance"; src = "baumgardt"; }
    } else if (r.Type === "OCl") {
      const h = hr.get(hrName(r.Name));
      if (h) { dLy = Number(h.dist50) * LY_PER_PC; lo = Number(h.dist16) * LY_PER_PC; hi = Number(h.dist84) * LY_PER_PC; method = "Hunt & Reffert 2023 (Gaia DR3 members), 16–84th percentile range"; src = "hunt2023"; }
    } else {
      const n = neb.get(m);
      if (n) {
        type = n.type || r.Type;
        if (n.milky_way === false) { skyOnly.push({ ...base, type, layer: "external" }); messier.external++; continue; }
        if (n.distance_ly != null) { dLy = n.distance_ly; lo = n.distance_ly_low; hi = n.distance_ly_high; method = n.distance_method; src = "research"; base.ref = n.source_url || n.source || null; }
        else base.note = n.notes || "No defensible single distance.";
      }
    }
    if (dLy == null) {
      messier.noDistance.push(`M${m}`);
      skyOnly.push({ ...base, type: type || r.Type, layer: "milky-way (no distance)", note: base.note || "No defensible 3D distance in the imported sources; shown by sky direction only." });
      continue;
    }
    const g = eqToGal(ra, dec);
    const pos = galXYZ(g.l, g.b, dLy);
    messier.inGalaxy++;
    messier.sources[src] = (messier.sources[src] || 0) + 1;
    objects.push({ ...base, type, p: pos.map((v) => round(v, 2)), d: round(dLy, 1), dLo: round(lo, 1), dHi: round(hi, 1), method, src, featuredLayer: "messier" });
  }

  // 3a. Featured objects the bulk catalogs leave unnamed or out (resolved via SIMBAD ids).
  const ids = Object.values(FEATURED_RESOLVE).map((x) => `'${x}'`).join(",");
  const simText = await cached("simbad_featured.csv", () =>
    simbadSync(`SELECT i2.id AS name, i.id AS ident FROM ident AS i JOIN ident AS i2 ON i.oidref = i2.oidref WHERE i2.id IN (${ids}) AND (i.id LIKE 'Gaia DR3 %' OR i.id LIKE 'HIP %')`));
  const sim = parseCsv(simText);
  const lowQ = [];
  for (const [display, simbadId] of Object.entries(FEATURED_RESOLVE)) {
    const rows = sim.filter((r) => r.name === simbadId);
    const gaia = rows.find((r) => r.ident.startsWith("Gaia DR3 "));
    const hip = rows.find((r) => r.ident.startsWith("HIP "));
    const inGaia = gaia && objects.find((o) => o.ids?.gaia === gaia.ident);
    const inHip = hip && objects.find((o) => o.ids?.hip === hip.ident);
    const hit = inGaia || inHip;
    if (hit) { if (!hit.name) hit.name = display; continue; }
    if (hip) lowQ.push({ display, hip: hip.ident.replace("HIP ", "") });
  }
  if (lowQ.length) {
    const lowText = await cached("hip2_featured_lowq.csv", () =>
      vizierSync(`SELECT HIP, RArad, DErad, Plx, e_Plx, Hpmag FROM "I/311/hip2" WHERE HIP IN (${lowQ.map((x) => x.hip).join(",")})`));
    for (const r of parseCsv(lowText)) {
      const f = lowQ.find((x) => x.hip === r.HIP);
      const snr = Number(r.Plx) / Number(r.e_Plx);
      skyOnly.push({
        id: `actual:hip:${r.HIP}`, type: "star", name: f.display, ids: { hip: `HIP ${r.HIP}` }, ra: round(Number(r.RArad), 5), dec: round(Number(r.DErad), 5),
        layer: "milky-way (distance below quality cut)", parallaxMas: Number(r.Plx), parallaxErrMas: Number(r.e_Plx),
        note: `Hipparcos parallax ${r.Plx} ± ${r.e_Plx} mas (${snr.toFixed(1)}σ) is below this catalog's 10σ quality cut, so no 3D position is claimed; roughly ${Math.round((1000 / Number(r.Plx)) * LY_PER_PC).toLocaleString()} ly if taken at face value.`,
      });
    }
  }

  // 3b. Featured clusters outside the Messier list: the Hyades and Omega Centauri.
  const hy = hrFind("Melotte_25");
  if (hy) {
    const dLy = Number(hy.dist50) * LY_PER_PC, g = eqToGal(Number(hy.RA_ICRS), Number(hy.DE_ICRS));
    objects.push({ id: "actual:cluster:hyades", type: "open cluster", name: "Hyades", ids: { other: "Melotte 25" }, ra: round(Number(hy.RA_ICRS), 5), dec: round(Number(hy.DE_ICRS), 5), con: "Tau",
      p: galXYZ(g.l, g.b, dLy).map((v) => round(v, 2)), d: round(dLy, 1), dLo: round(Number(hy.dist16) * LY_PER_PC, 1), dHi: round(Number(hy.dist84) * LY_PER_PC, 1), method: "Hunt & Reffert 2023", src: "hunt2023" });
  }
  const oc = baum.get("NGC_5139");
  if (oc) {
    const dLy = oc.rsunKpc * 1000 * LY_PER_PC, g = eqToGal(oc.ra, oc.dec);
    objects.push({ id: "actual:cluster:ngc5139", type: "globular cluster", name: "Omega Centauri", ids: { ngc: "NGC 5139" }, ra: oc.ra, dec: oc.dec, con: "Cen",
      p: galXYZ(g.l, g.b, dLy).map((v) => round(v, 2)), d: round(dLy, 1), dLo: round((oc.rsunKpc - oc.dKpc) * 1000 * LY_PER_PC, 1), dHi: round((oc.rsunKpc + oc.dKpc) * 1000 * LY_PER_PC, 1), method: "Baumgardt & Vasiliev 2021 mean distance", src: "baumgardt" });
  }

  // 3c. Enrichment: constellation, visible colour, planets, mass, composition.
  const enrichStats = await enrich(objects, { cached, gaiaAsync, tapSync, root: ROOT, LY_PER_PC, STAR_DATA });
  console.log("enrichment:", JSON.stringify(enrichStats));

  // 4. Featured stories (curated, sourced) → attach to object ids.
  const featured = [];
  for (const f of ["featured_batch1.json", "featured_batch2.json"]) {
    const batch = await readJsonMaybe(join(RESEARCH, f));
    for (const item of batch?.items || []) {
      const target = findFeatured(item, objects, skyOnly);
      featured.push({ id: target?.id || null, name: item.name, hook: item.hook, story: item.story, sources: item.sources, type: item.type || target?.type || null, found: !!target });
    }
  }

  // 5. Spatial chunks (k-d split until ≤ CHUNK_MAX) for objects with 3D positions.
  const placed = objects.filter((o) => o.p);
  const chunks = [];
  (function split(list, depth) {
    if (list.length <= CHUNK_MAX) { chunks.push(list); return; }
    const ext = [0, 1, 2].map((k) => { const v = list.map((o) => o.p[k]); return Math.max(...v) - Math.min(...v); });
    const axis = ext.indexOf(Math.max(...ext));
    const sorted = [...list].sort((a, b) => a.p[axis] - b.p[axis]);
    const mid = sorted.length >> 1;
    split(sorted.slice(0, mid), depth + 1);
    split(sorted.slice(mid), depth + 1);
  })(placed, 0);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(join(OUT, "chunks"), { recursive: true });
  await mkdir(join(OUT, "systems"), { recursive: true });
  const files = [];
  const write = async (rel, data) => {
    const text = JSON.stringify(data);
    await writeFile(join(OUT, rel), text);
    files.push({ path: rel, bytes: Buffer.byteLength(text), sha256: createHash("sha256").update(text).digest("hex") });
  };

  const chunkMeta = [];
  for (let i = 0; i < chunks.length; i++) {
    const list = chunks[i];
    const min = [0, 1, 2].map((k) => Math.min(...list.map((o) => o.p[k])));
    const max = [0, 1, 2].map((k) => Math.max(...list.map((o) => o.p[k])));
    const rel = `chunks/c${String(i).padStart(3, "0")}.json`;
    for (const o of list) o.chunk = i;
    await write(rel, { chunk: i, count: list.length, bounds: { min, max }, objects: list.map(({ chunk, ...o }) => o) });
    chunkMeta.push({ i, path: rel, count: list.length, min: min.map((v) => round(v, 2)), max: max.map((v) => round(v, 2)) });
  }

  // Compact search index: [id, name, aliases, type, chunk, distance ly, magnitude, constellation]
  const search = placed.map((o) => [o.id, o.name || "", Object.values(o.ids || {}).join("|"), o.type, o.chunk, o.d ?? null, o.g ?? null, o.con ?? null]);
  await write("search.json", { columns: ["id", "name", "aliases", "type", "chunk", "distance_ly", "g_mag", "constellation"], rows: search });
  await write("sky-only.json", { note: "Objects without a defensible 3D position in this catalog (external galaxies, disputed IDs, Milky Way objects lacking a sourced distance). Shown by sky direction only; not counted.", objects: skyOnly });
  await write("featured.json", { note: "Curated featured stories (bounded research batches; every story cites sources).", items: featured });

  // System detail files (documented planets/components) on demand.
  for (const s of systems) {
    const name = s.name === "Solar System" ? "Sun" : s.name;
    const info = STAR_DATA[name];
    if (!info) continue;
    await write(`systems/${s.id.split(":").pop()}.json`, { id: s.id, name: s.name, content: "ACTUAL", ...info, components: s.components });
  }

  // Counts. Counted = distinct ACTUAL objects with an id, type, 3D position, and a detail card.
  // Not counted: system groupings whose components are Gaia sources, sky-only objects,
  // decorative dots, fictional systems.
  const counted = placed.filter((o) => o.counted !== false);
  const byType = {}, bySource = {};
  for (const o of counted) { byType[o.type] = (byType[o.type] || 0) + 1; bySource[o.src] = (bySource[o.src] || 0) + 1; }
  const approx = counted.filter((o) => o.src !== "gaia" && (o.de == null && o.dLo == null)).length;

  Object.assign(SOURCES, ENRICH_SOURCES);
  const manifest = {
    schema: "starlight.catalog/1",
    built: new Date().toISOString(),
    content: "ACTUAL",
    coordinates: { frame: "heliocentric galactic Cartesian", units: "light years", axes: { x: "toward the Galactic centre (l=0°, b=0°)", y: "l = 90° (direction of Galactic rotation)", z: "north Galactic pole" }, epoch: "Gaia DR3 positions are epoch J2016.0; research positions J2000 (sub-arcminute differences are invisible at map scale)" },
    sources: SOURCES,
    selection: SOURCES.gaia.selection,
    coverage: "This is a ~16,000-object sample, not a census or uniform map of the Milky Way: a complete-ish sphere ~100 ly around the Sun plus naked-eye-bright stars out to a few thousand light years, and Milky Way Messier objects. Positions are actual; nothing is redistributed. The faint galaxy glow in the map is procedural and illustrative.",
    counts: {
      countedActualObjects: counted.length,
      byType, bySource,
      gaiaRowsDownloaded: stats.gaiaRows, gaiaDuplicatesDropped: stats.gaiaDuplicates,
      hipparcosBrightStarsAdded: stats.hipAdded, hipparcosSkippedAsGaiaDuplicates: stats.hipSkippedAsDuplicate,
      nearbySystemsMatchedToGaia: matchLog.filter((m) => m.catalogComponents.length).length,
      nearbySystemsWithoutGaiaMatch: matchLog.filter((m) => !m.catalogComponents.length).map((m) => m.system),
      messierMilkyWayPlaced: messier.inGalaxy, messierExternalOrDisputed: messier.external, messierWithoutDistance: messier.noDistance,
      skyOnly: skyOnly.length, featured: featured.length, featuredUnmatched: featured.filter((f) => !f.found).map((f) => f.name),
    },
    quality: {
      parallaxOverErrorMin: 10,
      ruweAbove1_4: stats.ruweFlagged,
      missingRates: { name: round(1 - counted.filter((o) => o.name).length / counted.length, 4), gaia_bp_rp: round(stats.missingColour / stats.gaiaRows, 4), gaia_teff_gspphot: round(stats.missingTeff / stats.gaiaRows, 4) },
      approximatePositions: approx,
    },
    matching: { method: `Nearby researched systems matched to Gaia DR3 / Hipparcos sources within ${MATCH_DEG * 60}′ on the sky and ${MATCH_DIST * 100}% in distance; matched Gaia sources become the system's components (counted once, as stars); systems with no Gaia match (very bright stars Gaia doesn't measure well) are counted from the research data.`, log: matchLog },
    enrichment: { ...enrichStats, colourClasses: COLOUR_CLASSES, zodiac: ZODIAC,
      colourMethod: "Colour temperature from the measured Gaia BP−RP (or Hipparcos B−V) colour, interpolated on the Pecaut & Mamajek dwarf sequence (no extrapolation); displayed colour is a blackbody at that temperature (Charity 2001, CIE 1964 10°). Names follow conventional colour descriptions of the spectral classes.",
      massMethod: "Gaia DR3 FLAME mass; else the NASA Exoplanet Archive host-star mass; else researched masses for single-star nearby systems; otherwise unknown. No colour-based estimates.",
      compositionMethod: "Gaia DR3 GSP-Spec [M/H] with best-quality flags only (first 13 flags zero); else NASA Exoplanet Archive host metallicity; otherwise unknown." },
    chunks: chunkMeta,
    files,
    regenerate: "node catalog-build/build.mjs   (add --refetch to re-download; raw downloads are cached in catalog-build/cache/)",
  };
  await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ counted: counted.length, chunks: chunks.length, byType, messier: { placed: messier.inGalaxy, external: messier.external, noDistance: messier.noDistance }, featured: featured.length, unmatched: manifest.counts.featuredUnmatched, noGaia: manifest.counts.nearbySystemsWithoutGaiaMatch }, null, 2));
}

function angSep(ra1, d1, ra2, d2) {
  const r = Math.PI / 180;
  const c = Math.sin(d1 * r) * Math.sin(d2 * r) + Math.cos(d1 * r) * Math.cos(d2 * r) * Math.cos((ra1 - ra2) * r);
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
}

function hrName(openNgcName) {
  if (openNgcName === "Mel022") return "Melotte_22";
  return openNgcName.replace(/^NGC0*/, "NGC_").replace(/^IC0*/, "IC_");
}

function findFeatured(item, objects, skyOnly) {
  const all = [...objects, ...skyOnly];
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (item.messier) { const m = all.find((o) => o.ids?.messier && norm(o.ids.messier) === norm(item.messier)); if (m) return m; }
  // Names first (IAU names come from Gaia's own Hipparcos cross-match); research-supplied
  // HIP numbers were not all verified, so they are only a fallback.
  const byName = all.find((o) => o.type === "star system" && norm(o.name) === norm(item.name)) || all.find((o) => norm(o.name) === norm(item.name));
  if (byName) return byName;
  if (item.hip) { const h = all.find((o) => o.ids?.hip === `HIP ${String(item.hip).replace(/\D/g, "")}`); if (h) return h.system ? all.find((o) => o.id === h.system) || h : h; }
  return null;
}

main().catch((e) => { console.error(e); process.exit(1); });
