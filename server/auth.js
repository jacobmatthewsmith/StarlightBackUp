// Password hashing (scrypt) and session tokens. Tokens are random; only their
// SHA-256 hash is stored, so a leaked database doesn't leak live sessions.

import { scryptSync, randomBytes, timingSafeEqual, createHash, randomUUID } from "node:crypto";

const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;
export const SESSION_DAYS = 30;

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, SCRYPT);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored).split("$");
  if (scheme !== "scrypt") return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, SCRYPT);
  return timingSafeEqual(actual, expected);
}

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

export function createSession(db, userId) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 86400e3;
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha256(token), userId, expires);
  return { token, expires };
}

export function sessionUser(db, token) {
  if (!token) return null;
  const row = db
    .prepare("SELECT u.id, u.email, u.display_name, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?")
    .get(sha256(token));
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
    return null;
  }
  return { id: row.id, email: row.email, displayName: row.display_name };
}

export function endSession(db, token) {
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
}

export const newUserId = () => `user:${randomUUID()}`;

// Light validation; the rules are shown to the player on the sign-up form too.
export function validateSignup({ email, password, displayName }) {
  const errors = [];
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.push("Enter a valid email address.");
  if (typeof password !== "string" || password.length < 10 || password.length > 200) errors.push("Password must be 10–200 characters.");
  if (typeof displayName !== "string" || !/^[\p{L}\p{N} _.'-]{2,32}$/u.test(displayName.trim())) errors.push("Display name: 2–32 letters, numbers, spaces, or _ . ' -");
  return errors;
}
