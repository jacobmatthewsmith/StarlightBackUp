# starlight — course demonstration (≈10 minutes)

Start: `node starlight/server/server.js`, open http://localhost:8100.

1. **Intro → account.** Click "starlight", watch the galaxy form, click through the three lines and
   the zoom into our neighbourhood. Find the closest star (Proxima Centauri). "create account" →
   Game mode opens on Level 1.
2. **Level 1 (gravity & motion).** E = mc² slider; red gravity dots in 3D (drag/scroll); launch a
   planet until it orbits; build a two-planet system (masses, distances, orbital-plane tilt), save;
   run the stability trial — the *server* re-runs the N-body integration and decides; publish it to
   Explore; human-scale gravity table → Level 2 unlocks.
3. **Level 2 (gravity & time).** Two held clocks, tick strips, contours labelled as illustration;
   Earth example (~9 ns/day per km); fictional compact-object lab and the near clock's local view;
   supported vs falling; orbit as free fall; challenge: place the clock for 9 s vs 10 s (hint ladder
   available; deterministic check on the server).
4. **Level 3 (journey to a star).** Choose Sun → Proxima (or a published FICTIONAL system); the cruise
   with outside vs ship time; Jacob's light clock in two frames (yellow photons); length contraction
   table; calibration (10 s outside → 6 s aboard, checked by the server); plan a trip under a
   ship-time target; structured explanation.
5. **Explore.** Search "Vega", "HIP 91262" or a Gaia DR3 id; filters; "whole catalog" (17,657 ACTUAL
   objects); tours; Betelgeuse (sky-direction only, with its parallax shortfall explained); the
   published system with its FICTIONAL — PLAYER CREATED badge and 3D view; "ask the tutor" on a card.
6. **Engineering evidence.**
   - `node --test "starlight/eval/*.test.mjs"` — 23 checks: level physics and mastery, accounts,
     CSRF, compare-and-swap progress, ownership/publish/unpublish/sanitization, ≥10,000 unique
     catalog objects with provenance, checksums, coordinates, Messier membership, compact tools.
   - `public/catalog/manifest.json` — sources, selection, coverage, counts, missing-data rates, chunks.
   - MCP: `claude mcp add starlight -- node starlight/server/mcp.js`, then ask Claude Code to
     "use search_universe to find Vega" or "plan_nearby_journey to Proxima Centauri at 0.8c".
   - Token tracking: GET /api/usage (tutor, delegation, explore) + research_manifest.json totals.
