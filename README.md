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

## HostAdapter registry

`adapters.js` is the v1 registry. Host-specific configuration is limited to chart mount selectors, label contrast tokens, and the host badge.

| Adapter | Matched pages | Behavior |
|---|---|---|
| TradingView | `tradingview.com` and subdomains | Exact plan waypoints when both a known chart mount and fresh live DeskPlan projection exist |
| Webull | `webull.com` and subdomains | Shared exact plan HUD, positioned against the detected chart to avoid the order area |
| Yahoo Finance | `finance.yahoo.com` | Shared exact plan HUD with a stronger label outline for light pages |
| Universal | Any other `http` or `https` page, a missing chart mount, or an unavailable/stale stream | Edge dock only; never draws fake ESP or invented levels |

The Universal adapter is intentionally the fallback until both the host chart and fresh plan projection are valid.

## DeskPlan stream contract

Risk/Algos owns `plan.entry`, `plan.stop`, `plan.t1`, optional `plan.t2`, `plan.invalidation`, and `plan.quality`. The HUD accepts exact decimal strings over the free local stream and renders them unchanged. Platform supplies matching normalized chart projections in the same atomic message. See [`docs/DESKPLAN.md`](docs/DESKPLAN.md).

There is no LLM-per-tick path or timer batching. Missing, malformed, out-of-order, or older-than-three-seconds messages clear chart ESP and return to the honest `MOCK · demo prices` gap state. `Delayed` is used only when a real quote provider explicitly reports a delayed feed.

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

## Files

- `manifest.json` — MV3 entry point and content-script registration
- `adapters.js` — TradingView, Webull, Yahoo Finance, and Universal registry
- `desk-plan.js` — testable exact-price and freshness contract validation
- `content.js` — shared shadow-DOM dock, ESP, waypoints, modules, and layout
- `docs/DESIGN.md` — locked Design SoT v0.2.4
- `docs/DESKPLAN.md` — canonical Risk/Algos-to-HUD rendering contract
- `docs/DEMO.md` — multi-host screenshot and interaction checklist

Run `node tests/validate.mjs` for manifest order, host routing, exact string preservation, gap-safety, freshness, sequence, and quality validation.

## Current spike limits

- This repository contains the HUD consumer, not the Algos/Platform stream producer. With no valid producer message, it deliberately remains in the gap state and draws no chart levels.
- DOM selectors can change when host sites ship updates. A failed mount safely degrades to the Universal edge dock.
- This spike has no trade execution, authentication, background service worker, or external network requests.