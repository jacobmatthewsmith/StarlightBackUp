#!/usr/bin/env node
// starlight MCP server (stdio, JSON-RPC 2.0, newline-delimited). Zero dependencies.
// Exposes the same bounded tools the game's tutor uses:
//   search_universe, get_object, list_region_objects, plan_nearby_journey
// Register with Claude Code:  claude mcp add starlight -- node starlight/server/mcp.js
// Read-only: opens the player database read-only and never returns private data.

import { createInterface } from "node:readline";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./catalog.js";
import { makeTools, TOOL_SCHEMAS } from "./tools.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const dataDir = process.env.STARLIGHT_DATA || join(ROOT, "data");
let db;
try { db = new DatabaseSync(join(dataDir, "starlight.db"), { readOnly: true }); }
catch { db = new DatabaseSync(":memory:"); db.exec("CREATE TABLE systems (id TEXT, name TEXT, version INT, published INT, published_name TEXT, map_x REAL, map_y REAL, map_z REAL, updated_at TEXT)"); }

const ctx = { db, dataDir, catalog: await loadCatalog(join(ROOT, "public")) };
const tools = makeTools(ctx);

const NUMERIC = new Set(["x", "y", "z", "radius_ly", "limit", "offset", "speed_c", "target_ship_years"]);
const toolList = Object.entries(TOOL_SCHEMAS).map(([name, s]) => ({
  name,
  description: s.description,
  inputSchema: {
    type: "object",
    properties: Object.fromEntries(Object.entries(s.params).map(([k, d]) => [k, { type: NUMERIC.has(k) ? "number" : "string", description: d }])),
  },
}));

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

async function handle(req) {
  const { id, method, params } = req;
  if (method === "initialize") {
    return { protocolVersion: params?.protocolVersion || "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "starlight", version: "1.0.0" } };
  }
  if (method === "tools/list") return { tools: toolList };
  if (method === "tools/call") {
    const fn = tools[params?.name];
    if (!fn) return { content: [{ type: "text", text: `Unknown tool: ${params?.name}` }], isError: true };
    try {
      const out = await fn(params.arguments || {});
      return { content: [{ type: "text", text: JSON.stringify(out) }] };
    } catch (e) {
      return { content: [{ type: "text", text: e.message }], isError: true };
    }
  }
  if (method === "ping") return {};
  throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
}

const rl = createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  if (!line.trim()) return;
  let req;
  try { req = JSON.parse(line); } catch { send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); return; }
  if (req.id === undefined) return; // notifications (e.g. notifications/initialized)
  try { send({ jsonrpc: "2.0", id: req.id, result: await handle(req) }); }
  catch (e) { send({ jsonrpc: "2.0", id: req.id, error: { code: e.code || -32603, message: e.message } }); }
});
