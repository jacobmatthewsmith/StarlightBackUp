// HTTP app: static frontend from public/, JSON API under /api. No npm dependencies.
// createApp() is used by server.js and by the evaluation harness (with a temp data dir).

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { openDb } from "./db.js";
import { hashPassword, verifyPassword, createSession, sessionUser, endSession, newUserId, validateSignup, SESSION_DAYS } from "./auth.js";
import { systemRoutes } from "./systems.js";
import { progressRoutes, defaultProgress } from "./progress.js";
import { toolRoutes } from "./tools.js";
import { tutorRoutes, recordUsage } from "./tutor.js";
import { loadCatalog } from "./catalog.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const PUBLIC_DIR = join(ROOT, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
};

import { HttpError } from "./errors.js";
export { HttpError };

export function createApp({ dataDir = join(ROOT, "data"), secureCookies = false } = {}) {
  const db = openDb(dataDir === ":memory:" ? ":memory:" : join(dataDir, "starlight.db"));
  const ctx = { db, dataDir, catalog: null };
  // The catalog loads in the background; tools report 503 until it's ready.
  ctx.ready = loadCatalog(PUBLIC_DIR).then((c) => { ctx.catalog = c; });
  // Fictional systems never sit on top of an actual object (min 2 ly away).
  ctx.avoidActual = (p) => (ctx.catalog ? ctx.catalog.nearestDistance(p) < 2 : false);
  ctx.recordUsage = (userId, kind, extra) => recordUsage(db, userId, kind, extra);
  const authAttempts = new Map(); // ip -> { count, resetAt }: basic brute-force brake

  const routes = [];
  const route = (method, pattern, handler, opts = {}) => routes.push({ method, pattern, handler, opts });

  // ---------- auth ----------
  route("POST", "/api/auth/signup", async (req, res, { body }) => {
    throttle(req);
    const errors = validateSignup(body);
    if (errors.length) throw new HttpError(400, errors[0], { errors });
    const email = body.email.trim().toLowerCase();
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) throw new HttpError(409, "An account with that email already exists.");
    const id = newUserId();
    const now = new Date().toISOString();
    db.prepare("INSERT INTO users (id, email, display_name, pass_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(id, email, body.displayName.trim(), hashPassword(body.password), now);
    db.prepare("INSERT INTO progress (user_id, version, json, updated_at) VALUES (?, 1, ?, ?)").run(id, JSON.stringify(defaultProgress()), now);
    startSession(res, id);
    return { user: { id, displayName: body.displayName.trim() } };
  });

  route("POST", "/api/auth/login", async (req, res, { body }) => {
    throttle(req);
    const email = String(body.email || "").trim().toLowerCase();
    const row = db.prepare("SELECT id, display_name, pass_hash FROM users WHERE email = ?").get(email);
    if (!row || !verifyPassword(String(body.password || ""), row.pass_hash)) throw new HttpError(401, "Email or password is incorrect.");
    startSession(res, row.id);
    return { user: { id: row.id, displayName: row.display_name } };
  });

  route("POST", "/api/auth/logout", async (req, res) => {
    endSession(db, cookie(req, "sl_session"));
    res.setHeader("Set-Cookie", sessionCookie("", 0));
    return { ok: true };
  });

  route("GET", "/api/me", async (req, res, { user }) => {
    if (!user) return { user: null };
    return { user: { id: user.id, displayName: user.displayName } };
  });

  progressRoutes(route, ctx);
  systemRoutes(route, ctx);
  toolRoutes(route, ctx);
  tutorRoutes(route, ctx);

  // ---------- plumbing ----------
  function startSession(res, userId) {
    const { token } = createSession(db, userId);
    res.setHeader("Set-Cookie", sessionCookie(token, SESSION_DAYS * 86400));
  }

  function sessionCookie(value, maxAge) {
    return `sl_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookies ? "; Secure" : ""}`;
  }

  function throttle(req) {
    const ip = req.socket.remoteAddress || "?";
    const now = Date.now();
    const a = authAttempts.get(ip) || { count: 0, resetAt: now + 60e3 };
    if (now > a.resetAt) { a.count = 0; a.resetAt = now + 60e3; }
    a.count++;
    authAttempts.set(ip, a);
    if (a.count > 20) throw new HttpError(429, "Too many attempts; wait a minute and try again.");
  }

  async function handleApi(req, res, url) {
    const match = routes.find((r) => r.method === req.method && matchPath(r.pattern, url.pathname));
    if (!match) throw new HttpError(404, "Not found.");
    const params = matchPath(match.pattern, url.pathname);
    const user = sessionUser(db, cookie(req, "sl_session"));
    const open = match.pattern === "/api/me" || match.pattern.startsWith("/api/auth/");
    if (!open && !user) {
      throw new HttpError(401, "Sign in first.");
    }
    let body = {};
    if (req.method !== "GET" && req.method !== "HEAD") {
      // CSRF guard: state changes need our JSON + custom header (not sendable cross-site without CORS).
      if (req.headers["x-starlight"] !== "1" || !String(req.headers["content-type"] || "").startsWith("application/json")) {
        throw new HttpError(403, "Missing request headers.");
      }
      body = await readJson(req);
    }
    return match.handler(req, res, { body, params, user, query: url.searchParams });
  }

  async function serveStatic(req, res, url) {
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(PUBLIC_DIR, path));
    if (!file.startsWith(PUBLIC_DIR + sep) && file !== PUBLIC_DIR) throw new HttpError(404, "Not found.");
    let info;
    try { info = await stat(file); } catch { throw new HttpError(404, "Not found."); }
    if (!info.isFile()) throw new HttpError(404, "Not found.");
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME[extname(file)] || "application/octet-stream",
      // Catalog files are versioned by checksum in their URLs; the manifest is not.
      "Cache-Control": file.includes(`${sep}catalog${sep}`) && !file.endsWith("manifest.json") ? "public, max-age=86400" : "no-cache",
      ...SECURITY_HEADERS,
    });
    res.end(req.method === "HEAD" ? undefined : data);
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname.startsWith("/api/")) {
        const out = await handleApi(req, res, url);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SECURITY_HEADERS });
        res.end(JSON.stringify(out));
      } else {
        await serveStatic(req, res, url);
      }
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SECURITY_HEADERS });
      res.end(JSON.stringify({ error: status === 500 ? "Something went wrong." : err.message, ...(err.extra || {}) }));
    }
  });

  return { server, db, ctx, ready: ctx.ready };
}

export function matchPath(pattern, path) {
  const p = pattern.split("/"), a = path.split("/");
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

function cookie(req, name) {
  const m = String(req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? m[1] : null;
}

function readJson(req, limit = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, "Request too large.")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); }
      catch { reject(new HttpError(400, "Invalid JSON.")); }
    });
    req.on("error", reject);
  });
}
