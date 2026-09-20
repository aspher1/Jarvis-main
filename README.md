# Jarvis Multi-Host HUD Spike

A dependency-free Chrome Manifest V3 extension that renders a canonical live `DeskPlan` on supported chart hosts. It does not read credentials, broker cookies, positions, or orders, and it never generates or rounds level prices.

## Load unpacked in Chrome

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose this repository’s root folder (the folder containing `manifest.json`).
6. Open or reload a supported host page.

Chrome warns that the extension can read page content because the required Universal adapter uses `<all_urls>`. The extension only looks for public chart mount elements and injects its own shadow-DOM UI; it does not scrape authentication or account data.

### COO preview path

1. After **Load unpacked**, open a public `https://www.tradingview.com/chart/` chart and reload once.
2. Expect one right-edge Jarvis dock plus arrowed **BUY ZONE**, **TAKE PROFIT**, and **GET OUT** labels with mono prices.
3. Confirm **Practice money (Paper)** and **MOCK · demo prices** are both visible. This is the fixture path, not live Algos output.
4. Open **Why** (collapsed by default) to see quality, invalidation, bias, and reward:risk; close it to restore Beginner view. R never appears on the surface.
5. Press backtick to hide/restore Jarvis, then drag the chart through a label to confirm the chart still receives pointer input.
6. Open an ordinary page with no recognized chart mount to verify the **Universal dock** appears without chart ESP.

Preview stills (MOCK fixture, not live TV.com): [`docs/demo/tradingview_overlay.png`](docs/demo/tradingview_overlay.png) and [`docs/demo/universal_dock.png`](docs/demo/universal_dock.png). Replay via `python3 -m http.server` then `demo/tradingview.html` / `demo/universal.html`.


## HostAdapter registry

`adapters.js` is the v1 registry. Host-specific configuration is limited to chart mount selectors, label contrast tokens, and the host badge.

| Adapter | Matched pages | Behavior |
|---|---|---|
| TradingView | `tradingview.com` and subdomains | Shared DeskPlan waypoints; MOCK fixture until the live LocalDesk envelope is wired |
| Webull | `webull.com` and subdomains | Shared DeskPlan HUD, positioned against the detected chart to avoid the order area |
| Yahoo Finance | `finance.yahoo.com` | Shared DeskPlan HUD with a stronger label outline for light pages |
| Universal | Any other `http` or `https` page, a missing chart mount, or an unavailable/stale stream | Edge dock only; never draws fake ESP or invented levels |

The Universal adapter is intentionally the fallback when a host chart mount is unknown. It never draws ESP against an unknown DOM region.

## DeskPlan stream contract

Risk/Algos owns `plan.entry`, `plan.stop`, `plan.t1`, optional `plan.t2`, aliases `target1`/`target2`, `plan.why`, and `plan.quality`. The HUD accepts PR #4’s LocalDesk numeric schema and renders values without `toFixed`, pretty-rounding, or client recomputation. Platform supplies matching normalized chart projections in the same atomic message. See [`docs/DESKPLAN.md`](docs/DESKPLAN.md).

There is no LLM-per-tick path or timer batching. Until the stream bridge lands, the schema-matching fixture is always labeled `MOCK · demo prices`. `Delayed` is used only when a real quote provider explicitly reports a delayed feed.

## Controls and safety

- **Backtick (`)**: instantly hide or restore all Jarvis UI. The shortcut is ignored while typing in a field.
- **Hide Jarvis (`)**: clears the full HUD; use backtick to restore it.
- **Hide ESP**: keeps the dock but removes all chart graphics.
- Module toggles separately control the entry zone/tracers, waypoints, risk explanation, and chat state.
- The full-screen graphics layer uses `pointer-events: none`. Only explicit dock controls accept pointer input, so host pan, zoom, crosshair, and drawing interactions remain available.
- The dock can be collapsed and stays off the top/left host toolbars.
- Paper mode and delayed-data warnings are always visible in the expanded dock.
- **Live analysis on this chart (free)** is the default analysis badge; this spike has no cloud dependency.
- The optional Jarvis Chat toggle is off by default and identified as **AI helper (paid · limited uses)**. This spike does not connect to a paid service.
- On-chart labels lead with kid-clear actions: **→ BUY ZONE** (“Buy here”), **↑ TAKE PROFIT** (“Take some money off”), and **↓ GET OUT** (“Leave if price hits here”), each paired with the exact mono plan price.
- Optional bias, invalidation, reward:risk, and setup name are confined to a collapsed **Why** expander. Quality is always shown as Strong, Okay, or Skip when a plan is active.
- Overlay dock craft follows Invertix §0c: void/ivory/Instrument Sans/mono, hairline `white/5`, sparse glass, and `--jx-cta #FF6A2C` on **Apply Jarvis plan** only. BUY ZONE stays cyan; GET OUT stays coral.

## Files

- `manifest.json` — MV3 entry point and content-script registration
- `adapters.js` — TradingView, Webull, Yahoo Finance, and Universal registry
- `desk-plan.js` — testable exact-price and freshness contract validation
- `content.js` — shared shadow-DOM dock, ESP, waypoints, modules, and layout
- `docs/DESIGN.md` — locked Design SoT v0.2.7
- `docs/DESKPLAN.md` — canonical Risk/Algos-to-HUD rendering contract
- `docs/DEMO.md` — multi-host screenshot and interaction checklist

Run `node tests/validate.mjs` for manifest order, host routing, canonical values/aliases, gap-safety, freshness, sequence, and quality validation.

## Current spike limits

- This repository contains the HUD consumer and a schema-matching mock fixture, not the Algos/Platform stream producer. Mock projections are for layout review and are not claimed as a Design PASS for exact host-axis placement.
- DOM selectors can change when host sites ship updates. A failed mount safely degrades to the Universal edge dock.
- This spike has no trade execution, authentication, background service worker, or external network requests.