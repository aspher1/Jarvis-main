# Jarvis Multi-Host HUD Spike

A dependency-free Chrome Manifest V3 extension that adds the same paper-trading HUD to supported chart hosts. It does not read credentials, broker cookies, positions, or orders. The displayed plan and prices are mock data.

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
| TradingView | `tradingview.com` and subdomains | Chart ESP, waypoints, tracers, and edge dock when a known chart mount exists |
| Webull | `webull.com` and subdomains | Shared chart HUD, positioned against the detected chart to avoid the order area |
| Yahoo Finance | `finance.yahoo.com` | Shared chart HUD with a stronger label outline for light pages |
| Universal | Any other `http` or `https` page, or a supported host whose chart mount is unknown | Edge dock only; never draws fake ESP against an unknown DOM region |

The Universal adapter is intentionally the fallback even on a recognized host until one of that host’s chart selectors resolves to a visible chart-sized region.

## Controls and safety

- **Backtick (`)**: instantly hide or restore all Jarvis UI. The shortcut is ignored while typing in a field.
- **Hide Jarvis (`)**: clears the full HUD; use backtick to restore it.
- **Hide ESP**: keeps the dock but removes all chart graphics.
- Module toggles separately control the entry zone/tracers, waypoints, risk explanation, and chat state.
- The full-screen graphics layer uses `pointer-events: none`. Only explicit dock controls accept pointer input, so host pan, zoom, crosshair, and drawing interactions remain available.
- The dock can be collapsed and stays off the top/left host toolbars.
- Paper mode and delayed-data warnings are always visible in the expanded dock.
- **FREE local analysis** is the default mode; this spike has no cloud or paid-service dependency.
- On-chart labels lead with kid-clear actions: **→ BUY ZONE**, **↑ TAKE PROFIT**, and **↓ GET OUT**. ENTRY, T1/T2, and STOP remain secondary context.

## Files

- `manifest.json` — MV3 entry point and content-script registration
- `adapters.js` — TradingView, Webull, Yahoo Finance, and Universal registry
- `content.js` — shared shadow-DOM dock, ESP, waypoints, modules, and layout
- `docs/DESIGN.md` — locked Design SoT v0.2.1
- `docs/DEMO.md` — multi-host screenshot and interaction checklist

## Current spike limits

- Levels are fixed mock values; they are not mapped to a live price scale.
- DOM selectors can change when host sites ship updates. A failed mount safely degrades to the Universal edge dock.
- This spike has no trade execution, authentication, background service worker, or external network requests.