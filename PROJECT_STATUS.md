# starlight — project status

Short, living record of what's done, decisions, open dependencies, and how to verify.
Read this first when resuming; it should save re-reading the whole repo.

## Latest changes (2026-10-15) — supersede older lines below where they conflict

- Publishing removed: no publish/unpublish, no /api/public/*, no fictional systems in Explore,
  Level 3 destinations are real stars only. Player systems still save privately (Level 1).
- Game tutor removed. The AI guide lives only in Explore: POST /api/guide {mode:"explore"},
  policy in server/harness/explore-guide.md (topics: stars, space, finding things on the map;
  ≤80 words; 4 tools incl. show_on_map; ≤3 tool calls; 220 output tokens; 25/day; ≤100 ly).
- Catalog enrichment (catalog-build/enrich.mjs): constellation (Roman 1987), colour from measured
  BP−RP/B−V → 12 colour classes + blackbody hex (map dots drawn in it), mass (Gaia FLAME / NASA
  Exoplanet Archive / research, else unknown), composition ([M/H] from clean Gaia GSP-Spec or
  archive, else unknown), confirmed planets (NASA pscomppars) and possible planets (TESS PC/APC +
  research). 22,138 counted objects; 10,158 within 100 ly shown in Explore.
- Explore card in plain language (distance to 0.1 ly, colour swatch, × the Sun with hover notes,
  planets / possible planets, main elements, constellation; ids under "more"). Zodiac toggle.
- Tests: 23/23 (`node --test "eval/*.test.mjs"`).
- Next: Game redesign stages 1–5 (approved plan).

## Run / verify

```
node starlight/server/server.js            # → http://localhost:8100
node --test "starlight/eval/*.test.mjs"    # 23 checks (physics, server, catalog, tools)
node starlight/catalog-build/build.mjs     # rebuild public/catalog from cached downloads (--refetch to re-download)
claude mcp add starlight -- node starlight/server/mcp.js   # the 6 bounded tools over MCP
```

## Layout

```
starlight/
  public/            frontend (static). No private data. catalog/ is generated.
    shared/          physics.js (all levels, browser + server), view3d.js, lightclock.js, systemview.js
    app/             app shell (accounts, Game/Explore), levels/level{1,2,3}.js, explore/
    starlight.js, neighborhood.js   intro + shared map renderer (Explore draws into it)
  server/            Node 24, zero npm deps: app.js, auth.js, db.js, progress.js, systems.js,
                     catalog.js, tools.js, tutor.js, mcp.js, errors.js
  data/              PRIVATE: starlight.db + systems/<uuid>/v<n>.json. Never served.
  catalog-build/     build.mjs + cache/ (raw downloads, gitignored)
  research/          bounded research batches (JSON) + research_manifest.json + build scripts
  eval/              harness: physics, server, catalog/tools tests
  .env               symlink → AI Foundations/.env (PORTKEY_API_KEY); never copied, gitignored
```

## Decisions

- Accounts gate Game and Explore; the intro is open. scrypt hashes, hashed session tokens,
  HttpOnly SameSite=Lax cookie, JSON + `X-Starlight: 1` header on every mutation.
- Mastery is server-decided: the server re-runs physics.js (stability trial, clock ratio,
  cruise times) — clients can't set `passed`. Calibration for Level 3 comes from the server's record.
- Player systems: one versioned JSON document per version (`v1.json`, `v2.json`, …), compare-and-swap
  on `version`, owner-only, publish only after a server-run stability trial, editing unpublishes,
  public view sanitized (no email, owner id, progress, or tutor chats). Fictional map positions are
  deterministic from the id and kept ≥ 2 ly from any actual object.
- Coordinates everywhere: heliocentric galactic Cartesian, light years. Camera-relative rendering
  (the map subtracts the focus before projecting); planets in AU relative to their host.
- Catalog (pinned): Gaia DR3 (parallax > 40 mas OR G < 6.5, parallax/error > 10), Hipparcos 2007 for
  bright stars Gaia lacks, OpenNGC + Baumgardt & Vasiliev 2021 + Hunt & Reffert 2023 for Messier,
  bounded research for nebula distances and 30 featured stories. IDs as strings. No LLM touched the
  bulk data.
- Colours: white objects, red = gravity, yellow = photons, lilac dashed outline = FICTIONAL.
- Tutor (optional, explicit): Portkey gateway, gpt-5.6-sol, ≤3 tool calls, ≤450 output tokens,
  40 requests/player/day; every call logged in `usage` (kinds: tutor, delegation, explore).

## Work packages

1. [x] Level sequence + shared mode navigation (accounts, Game/Explore, progress kept on switch)
2. [x] Level 1: account → mass & energy → 3D gravity (red dots) → Newtonian motion → build (masses,
       distances, orbital planes) → server stability trial → save/publish → human-gravity transition
3. [x] Level 2 clock lab: Schwarzschild stationary clocks, valid-domain checks, Earth weak-field
       example, fictional compact-object lab, local vs comparison view, free fall + orbit, mastery
       (predict, place for 9 s vs 10 s within ±0.02 s, predict, explain) with hint ladder
4. [x] Level 3: reuses ../light-clock physics (shared/lightclock.js); catalog/fictional destinations,
       cruise with external vs ship time, light clock in two frames, length contraction,
       10 s → 6 s calibration (server), trip planning, structured explanation mastery
5. [x] Explore prototype → full: search, filters (type, ACTUAL/FICTIONAL), jump, featured, 3 tours,
       detail cards, system views (nearby actual systems, published fictional systems), pan/rotate/zoom/focus
6. [x] Bulk ingestion: 17,657 counted ACTUAL objects, 32 chunks, manifest + checksums
7. [x] Published fictional systems: secure storage, publish/unpublish, sanitized public API
8. [x] Featured + Messier layer, tours, tools (HTTP + MCP), tutor, token tracking, eval harness

## Catalog numbers (build of 2026-10-07)

- Counted ACTUAL objects: **17,631** — stars (Gaia DR3 16,567; Hipparcos 989; Sun 1),
  star systems without a catalog counterpart 5, globular clusters 30, open clusters 27, nebulae 12.
- Not counted: 44 researched nearby systems (their stars are counted once, as catalog components),
  46 sky-direction-only objects (39 external galaxies + disputed M102, M24/M40/M73, Betelgeuse,
  Antares, Deneb — parallaxes below the 10σ cut), fictional systems, the procedural galaxy.
- Missing data: no common name 97.9% (normal: most stars have only catalog ids); Gaia BP−RP 0.95%;
  Gaia Teff 53%. RUWE > 1.4 flagged on 4,304 Gaia sources. Approximate positions (no stated
  uncertainty): 6.
- Hipparcos rows merged into Gaia duplicates (by HIP, else within 5′ allowing for proper motion, 5% distance, 1.5 mag): 439 — their HIP ids and IAU names are kept on the Gaia star.
- Explore shows only objects within 100 ly of the Sun (5,665 of the catalog); `MAX_LY` in public/app/explore/explore.js. The catalog files keep the full sample.

## Measured (2026-10-07, MacBook, Chrome via preview)

- Frame time (map + catalog layer): 3.6 ms median at neighbourhood zoom (1,630 objects drawn);
  7.1 ms median / 7.8 ms p95 for the whole catalog (13,171 drawn).
- Chunk cache bounded at 24 of 32 chunks (~13k objects); 51 loads / 27 evictions in a session;
  ~3 ms per chunk from localhost; JS heap ~39 MB. Total catalog payload 6.5 MB uncompressed.
- Tutor: one question with one catalog lookup ≈ 2,000 tokens.
- Research batches: 10 batches, 151 objects, 563,416 tokens (research/research_manifest.json).

## Outstanding / caveats

- The galaxy intro's 10,000 dots are procedural (illustrative); the catalog is a local sample, not a
  census — the manifest's `coverage` says so.
- Some featured-story ids were supplied from memory by the research agent; matching uses IAU names
  and SIMBAD-resolved ids instead, so no story attaches to the wrong object.
- M76's distance is cited via Wikipedia to Phillips 2005 (paper not opened); M43 shares the ONC distance.
- Dev database contains a test account (test.pilot@example.com) and one published test system.

## Verification log

- 2026-10-07: `node --test` → 23/23 pass. Browser: sign-up, Level 1 end-to-end (trial passed by server,
  publish), Level 2 mastery (wrong placement rejected, hinted radius 3.69 r_s accepted), Level 3
  server checks, Explore search/card/tour/sky-only/fictional view, mode switch keeps progress,
  MCP stdio smoke test, live tutor call with tool use and usage recorded.
