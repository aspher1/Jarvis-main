# Multi-host demo and screenshot notes

Use a desktop viewport at least 1280px wide. Host-overlay captures require the FREE local stream producer to emit a fresh canonical `DeskPlan` and matching projection; do not substitute hand-entered prices.

## Required capture set

### 1. TradingView

- Open a public TradingView Superchart.
- Confirm the badge reads **on TradingView**.
- Capture the right-edge dock plus → BUY ZONE, ↑ TAKE PROFIT, and ↓ GET OUT chart labels. Each arrow tip must sit on its projected exact plan price, and each exact decimal string must be visible in mono type.
- Expand **Why** once to capture invalidation/quality, then collapse it for the Beginner-default shot.
- Drag/pan the chart starting beneath a tracer or label to demonstrate that the graphics layer does not receive pointer events.
- Click **Hide ESP**, then restore it. Press backtick to hide and restore all Jarvis UI.

### 2. Yahoo Finance or Webull

- Open a public quote chart on Yahoo Finance or a public Webull chart.
- Confirm the badge names the correct host.
- Capture the same kid-clear labels, exact producer prices, and unchanged module set.
- On Yahoo’s light theme, verify the dark label plate and hard border remain legible.
- On Webull, verify the dock sits against the chart edge without covering an order ticket.

### 3. Universal

- Open any ordinary `http` or `https` page without a recognized chart mount.
- Confirm the badge reads **Universal dock**.
- Capture the edge dock with a mock-only plan list, Paper badge, `MOCK · demo prices` feed badge, modules, and disclaimer. The word `Delayed` must not appear for mock data.
- Confirm there are no prices, chart beacons, tracers, entry-zone rectangles, or other fake ESP.
- Press backtick to hide and restore the dock without reloading.

## Acceptance notes

- One compact panel and four labels are rendered, below the eight-label maximum.
- The overlay has no full-page dim or host CSS overrides.
- Only buttons inside the shadow-DOM dock accept pointer input.
- Host selection does not change module behavior or plan copy; adapters only supply mount selectors, contrast tokens, and host badge copy.
- No authenticated account data is accessed. Testing should use public pages.
- Stop the local stream and confirm all precise labels clear within three seconds rather than becoming stale.
