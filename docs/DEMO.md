# Multi-host demo and screenshot notes

Use a desktop viewport at least 1280px wide. Current screenshots exercise the schema-matching fixture and must visibly include `MOCK · demo prices`. They demonstrate layout and interaction, not a Design PASS for live host-axis accuracy.

## Required capture set

### 1. TradingView

- Open a public TradingView Superchart.
- Confirm the badge reads **on TradingView**.
- Capture the right-edge dock plus → BUY ZONE, ↑ TAKE PROFIT, and ↓ GET OUT chart labels with the fixture’s unrounded numeric values in mono type.
- Expand **Why** once to capture invalidation/quality, then collapse it for the Beginner-default shot.
- Drag/pan the chart starting beneath a tracer or label to demonstrate that the graphics layer does not receive pointer events.
- Click **Hide ESP**, then restore it. Press backtick to hide and restore all Jarvis UI.

### 2. Yahoo Finance or Webull

- Open a public quote chart on Yahoo Finance or a public Webull chart.
- Confirm the badge names the correct host.
- Capture the same kid-clear labels, MOCK badge, fixture prices, and unchanged module set.
- On Yahoo’s light theme, verify the dark label plate and hard border remain legible.
- On Webull, verify the dock sits against the chart edge without covering an order ticket.

### 3. Universal

- Open any ordinary `http` or `https` page without a recognized chart mount.
- Confirm the badge reads **Universal dock**.
- Capture the edge dock with a mock-only plan list, Paper badge, `MOCK · demo prices` feed badge, modules, and disclaimer. The word `Delayed` must not appear for mock data.
- Confirm mock prices remain honestly labeled in the side list, with no chart beacons, tracers, entry-zone rectangles, or other ESP on unknown DOM.
- Press backtick to hide and restore the dock without reloading.

## Acceptance notes

- One compact panel and four labels are rendered, below the eight-label maximum.
- The overlay has no full-page dim or host CSS overrides.
- Only buttons inside the shadow-DOM dock accept pointer input.
- Host selection does not change module behavior or plan copy; adapters only supply mount selectors, contrast tokens, and host badge copy.
- No authenticated account data is accessed. Testing should use public pages.
- When the real stream bridge is available, stop it and confirm live chrome clears within three seconds and the HUD returns to the MOCK fixture state.
