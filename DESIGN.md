# Jarvis interface system

Jarvis is a professional trading terminal with a Minecraft-client-mod metaphor. The chart is the world. Jarvis is the legitimate overlay that makes decision levels visible: ESP boxes mark entry zones, waypoint beacons mark targets and stops, tracer lines connect current price to the next objective, and a module GUI turns helpers on and off. It runs only on Jarvis’s own chart. It never injects into broker or charting sites.

## Product analysis

- Bloomberg Terminal proves that dense financial tools become scannable through rigid tiled regions, tabular alignment, high contrast, and stable color semantics—not whitespace or decoration.
- TradingView makes the chart the largest, quietest surface and keeps watchlist, ticket, and account management in subordinate panes.
- Modern terminals connect symbol selection, chart, positions, and order entry rather than making each panel its own workflow.
- Game mod clients make optional powers obvious through named ON/OFF modules and visible world-space markers. Jarvis borrows that legibility, not cheating, pixel blocks, or childish game art.

References: [Bloomberg customer-centric design](https://www.bloomberg.com/company/stories/bloombergs-customer-centric-design-ethos/), [Bloomberg color accessibility](https://www.bloomberg.com/ux/2021/10/14/designing-the-terminal-for-color-accessibility/), [TradingView trading platform](https://www.tradingview.com/charting-library-docs/latest/trading_terminal/), and [OpenCharts](https://github.com/dylanpersonguy/OpenCharts).

## Tokens

| Role | Token |
| --- | --- |
| Canvas | `#0D0D0D` |
| Panel | `#141414` |
| Raised control | `#181818` |
| Hairline | `#2A2A2A`, 1px |
| Primary text | `#EDEDED` |
| Muted text | `#858585` |
| Gain / BUY / entry | `#00D4AA` plus `BUY` or `▲` |
| Loss / SELL / stop | `#FF4757` plus `SELL`, `STOP`, or `▼` |
| Warning | `#FFB800` plus explanatory text |
| Target beacon | `#A6FF4D` plus `T1` / `T2` |

- Prices, quantities, P&L, timestamps, and IDs use JetBrains Mono (IBM Plex Mono fallback) with tabular numerals.
- Labels use Inter. Micro labels are 10–12px, uppercase, and tracked.
- Square corners only. Panels share borders. Desktop-first at 1280px and above.

## Hierarchy and clarity

Beginner mode is the default. The four decision numbers—Entry, Stop, Target, Shares—are the largest type in the side panel. Dense indicators stay behind **Why this plan?**. Every plan uses short sentences and ends with:

1. Check entry
2. Set stop
3. Place order

Plain labels can pair a mod name with an explanation: **ESP Levels — Shows where to buy, take profit, and get out.** Never rely on color alone. Status text says **Practice money (Paper)**, **Real money (Live)**, or **Prices: Delayed · ~15m**.

## HUD grammar

- Entry: thin cyan ESP rectangle spanning the actionable price zone.
- Targets: lime/cyan horizontal waypoint lines with large `T1` and `T2` labels.
- Stop: coral horizontal waypoint labeled `STOP · GET OUT IF WRONG`.
- Tracer: one restrained dashed line from current price to the first target.
- `LOCK TARGET` is an amber tactical callout, used once.
- Module toggles resemble a sleek client-mod GUI: compact rows, sharp checkbox, explicit ON/OFF.

## Edge-anchored chrome

The chart remains the world, so controls attach to its edges rather than floating over the center. Symbol and stream status lock to the top edge. Modules and Jarvis lock to the right edge. Plan quality and risk state lock near the order action. The chart center is reserved for price, one entry box, and the active waypoint path.

Waypoints use two channels at once:

1. A thin spatial marker at the exact chart level.
2. A stable HUD label at the chart edge with the same name and number.

This keeps `ENTRY`, `T1`, `T2`, and `STOP` readable when candles, volume, or crosshairs are visually busy. It also prevents color from carrying meaning by itself.

## Progressive disclosure

- **Beginner (default):** four decision numbers, plan quality, three-step checklist, and plain-English reason.
- **Why this plan?:** algo name, invalidation, congestion, confidence, and reward:risk definition.
- **Expert hub:** module tuning and detailed diagnostics. It is opt-in and never the default first-run surface.

Jarvis should feel powerful because it removes uncertainty, not because it fills every pixel. Avoid film-HUD density, rainbow ESP soup, duplicate reticles, decorative telemetry, and day-one terminal overload.

## Competitive wedge

Jarvis does not attempt to out-chart TradingView. The MVP wins on:

- spatial decision guidance that remains legible under chart load;
- enforced risk checks that block bad size, weak reward:risk, daily-loss breaches, anti-tilt states, and `Skip` plans before the click;
- one clear transition from a proposed plan to a protected order.

Warnings without enforcement are insufficient for risk failures. When an order is blocked, disable the primary action and place the plain-English reason next to it.

## Do

- Keep the chart at least half the cockpit width.
- Make the next action obvious; one primary CTA at a time.
- Explain risk before potential profit.
- Pair every semantic color with a word, icon, or arrow.
- Show source and latency continuously.
- Use flat fills and 1px shared borders.

## Do not

- No purple SaaS palette, rounded shadcn defaults, gradients, glass, bloom, shadows, or giant marketing hero.
- No literal Minecraft blocks, pixel fonts, meme language, fake code rain, or excessive neon.
- No guaranteed-profit language, pump language, or implied certainty.
- No hidden live mode, hidden feed delay, broker-site injection, cookie scraping, or credential capture.
- No dense indicator internals in Beginner mode.
