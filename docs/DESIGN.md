# Jarvis — Design Spec v0.2.7 (SoT)

**Owner:** VP of Design · **Report to:** COO only · **Do not merge**
**Repo:** https://github.com/aspher1/Jarvis-main
**Comps:** `/workspace/jarvis-design/INVERTIX-COMPS.md` (UI Research live tokens), `/workspace/jarvis-design/invertix-shots/`, `/workspace/jarvis-design/RESEARCH-HUD-COMPS.md`, `/workspace/jarvis-design/COMPS.md`
**Craft bar:** Invertix-grade premium dark AI-agent OS (https://www.invertix.ai/) — Randy/COO lock

---

## 0. Surface priority (PIVOT — locked 2026-09-18)

| Priority | Surface | Role |
|----------|---------|------|
| **P0 primary** | **Chrome MV3 multi-host overlay** | Same ESP / waypoints / modules on **TradingView · Webull · Yahoo Finance** (+ **Universal** edge-dock fallback) |
| **P1 secondary** | Standalone Next.js cockpit | Same visual language for paper/live order path, settings, blotter, how-it-works when not on a host |

**World** = the host chart page. **Jarvis** = Minecraft-mod–style client overlay on that world.

### Hosts (locked)

| Host | Mount notes | Contrast notes |
|------|-------------|----------------|
| **TradingView** | Chart canvas + right/bottom-right edge dock | Dark + light TV themes; scrim/outline on candles |
| **Webull** | Chart region; avoid colliding with Webull order ticket | Dark terminal-ish base; keep coral STOP punchy |
| **Yahoo Finance** | Chart module; watch light/white page backgrounds | Prefer stronger scrim / darker label plate on light hosts |
| **Universal** | Edge-dock only when chart mount unknown | Modules + badges + plan card; no fake ESP on wrong DOM |

**Same modules everywhere.** Host-specific code = mount selectors + contrast tokens only — not forked feature sets.

**Engineering shape (Design-accepted):** `HostAdapter` registry (TV / Webull / Yahoo / Universal). Adapters may differ on mount + contrast only; ESP/waypoint/module UX must stay Spec-identical. Universal = edge-dock fallback when chart mount fails — **v1 required**, not best-effort.

Still forbidden: scraping broker cookies, injecting into Robinhood/ToS/TV *auth*, credential theft, guaranteed-profit claims. Overlay is first-party UI on the host DOM — not a login bypass.

PAPER default. LIVE Alpaca only with explicit typed confirm + keys.

Beginner should feel: **“I turned on the hacks and now I can SEE what to do.”**

### Kid-clear overlay copy (P0 — locked)

Waypoint / ESP labels on the chart must be readable by a **middle schooler**. Prefer these exact primary strings:

| Level | On-chart label (primary) | Optional plain subtitle |
|-------|--------------------------|-------------------------|
| Entry zone | **BUY ZONE** | “Buy here” |
| Take profit | **TAKE PROFIT** | “Take some money off” |
| Stop / invalidation | **GET OUT** | “Leave if price hits here” |

- **Finger / arrow cues:** each active waypoint shows a simple ▶ / 👆-style pointer (or chevron) aimed at the price level — not cryptic T1/T2/STOP alone. Pro mode may show `T1` / `STOP` as secondary micro-text under the kid-clear label.
- Default Beginner view hides jargon (`R-multiple`, `VWAP`, `ESP`) unless expanded in Details.
- Still pair color + word (never color alone).

### Dual-layer plan UX (P0 — locked)

| Layer | What shows | Rules |
|-------|------------|-------|
| **Surface (default)** | **BUY ZONE / TAKE PROFIT / GET OUT** + finger/arrow cues + exact prices on the chart | Middle-school readable; no bias/R jargon on the surface |
| **Pro desk (“Why”)** | Behind a **Why** expander only: bias, invalidation, R (reward:risk), optional setup name | Collapsed by default in Beginner; never replaces surface labels |

**Exact level placement (P0):** BUY ZONE / TAKE PROFIT / GET OUT must sit on the **precise chart price** from the plan (algo/template/LLM) — not rounded decorative bands that miss the number. Band/ESP fill may be thin around the level; the **label + tip of the arrow/finger points at the exact price**. Show the numeric price next to the kid-clear label (mono/`tnum`).

Algos / copy / LLM planners output both layers: surface labels + optional Why fields. UI must not dump Why onto the chart by default.

### Analysis tiers (product + copy)

| Tier | Default? | What the UI says |
|------|----------|------------------|
| **FREE local realtime** | **Yes** | “Live analysis on this chart (free)” — algos + templates on the stream |
| **Paid LLM assistant** | Opt-in | “AI helper (paid · limited uses)” — throttle remaining uses in plain English |

Never imply the free tier is “dumb” or the paid tier “guarantees wins.”
Always: **Not financial advice. Trading can lose money including your full account.**
Forbidden: guaranteed profit, get rich, always wins, risk-free.

---

## 0a. Overlay-on-host readability (P0 — extension, all hosts)

Host page owns chrome. Jarvis must **not** fight the host. Rules apply on TV, Webull, Yahoo, and Universal.

| Rule | Spec |
|------|------|
| **High contrast** | Labels: dark scrim / hard outline + mono numbers; never thin cyan-only on candles |
| **Non-blocking** | Chart drag / scroll / crosshair / drawings remain usable; overlay `pointer-events: none` on ESP canvas; interactive modules use explicit hit targets only |
| **Toggle hide** | Global **Hide Jarvis** (toolbar + hotkey, e.g. `` ` `` or `J`) — instant full clear; per-module toggles remain |
| **Edge dock** | Module panel docks right or bottom-right; never center modal over chart by default |
| **Max footprint** | ≤1 compact panel + ≤8 waypoint labels; no full-bleed dimming of the chart |
| **z-index** | Above chart canvas, below TV critical dialogs (order ticket / login) when those appear |
| **Safe from host theme** | Pass contrast on TV dark/light, Webull dark, Yahoo light/white |
| **Collision** | If host toolbar/ticket overlaps dock, auto-shift dock inward 8–16px |
| **Host badge** | Tiny chip: `on TradingView` / `on Webull` / `on Yahoo` / `Universal dock` — plain English |
| **No host restyle** | Never override host CSS globally; inject only Jarvis nodes |

Coach / first-run: floating tip, dismissible, **never** blocks the chart.

---

## 0b. HUD principles (still locked)

1. **World first, chrome on edges**
2. **ESP / waypoints = dual channel** (on-chart beacon + list/pin)
3. **Layer hierarchy, not rainbow soup**
4. **Beginner dock → expert hub** (4–5 modules)
5. **Linked context** (symbol/plan updates related chips)
6. **Conceal complexity** + one-tap hide overlays
7. **Film HUD = inspiration only**

---

## 0c. Invertix craft tokens (P0 — locked)

Live bar is invertix.ai (void field, ivory type, Instrument Sans, sparse glass, hairline white/5, orange reserved for the money click). Overlay dock, badges, and waypoint plates use these tokens. **Do not** restyle the host page.

### Shared `--jx-*` tokens (C-P0-01)

| Token | Value | Use |
|-------|-------|-----|
| `--jx-void` | `#050505` | Dock field / deepest plate |
| `--jx-panel` | `#141414` | Raised rows, badge wells |
| `--jx-ivory` | `#F5EFE6` | Primary type |
| `--jx-ivory-muted` | `#EBDCB3` | Secondary type |
| `--jx-hairline` | `rgba(255,255,255,0.05)` | 1px borders (white/5) |
| `--jx-glass` | `rgba(5,5,5,0.64)` + `blur(14px)` | Sparse dock glass (12–16px) |
| `--jx-cta` | `#FF6A2C` | **Apply Jarvis plan** / **Place** only |
| `--jx-buy` | `#00D4AA` | BUY ZONE / entry / ice cyan |
| `--jx-stop` | `#FF4757` | GET OUT / stop / coral |
| `--jx-active` | `#A6FF4D` | Sparse module-ON pulse |
| `--jx-warning` | `#FFB800` | Delayed / weak plan |

**Type:** Instrument Sans for labels / plain English. Roboto Mono (JetBrains Mono fallback) + `tnum` for prices, qty, lag. `font-feature-settings: "ss01", "ss02"` on editorial type.

**CTA rule:** `--jx-cta` is the money click. Hide / collapse / toggles stay ivory-on-void hairline. Never paint BUY ZONE, TAKE PROFIT, GET OUT, or module-ON in orange.

**Anti-goals (still locked):** purple SaaS · Inter-on-#0D0D0D terminal leftovers · neon glass soup · opaque full-bleed HUD · orange waypoint soup.

### Overlay dock IDs (from INVERTIX-GAP-P0 — O-P0 this spike)

| ID | Surface | Requirement |
|----|---------|-------------|
| **C-P0-01** | Shared tokens | Overlay and cockpit speak `--jx-*`; void / ivory / Instrument Sans / mono |
| **O-P0-01** | Overlay dock | Void field + ivory type + Instrument Sans on brand, badges, modules, copy |
| **O-P0-02** | Overlay dock / plates | Hairline `white/5` only — no `#2A2A2A` SaaS hairline |
| **O-P0-03** | Overlay dock | Sparse glass (`blur` 12–16px, ≤64% void). Not frosted soup, not opaque slab |
| **O-P0-04** | Overlay CTA | `--jx-cta #FF6A2C` on **Apply Jarvis plan** (and **Place** if present). No other chrome |
| **O-P0-05** | Waypoints / ESP | BUY ZONE ice cyan `#00D4AA`; GET OUT coral `#FF4757`; TAKE PROFIT cyan/lime. Orange never |
| **O-P0-06** | Why / R | **Why** expander present and **collapsed** in Beginner. R, bias, setup name off the surface |
| **O-P0-07** | Yahoo / light hosts | Stronger void scrim + hairline plate on waypoint labels (adapter contrast only) |

Cockpit C-P0 rows beyond shared tokens are owned by the standalone app, not this overlay spike.

---

## 1. Visual system

### 1a. Host pages — do not restyle

Leave host chrome alone (TV / Webull / Yahoo). Jarvis draws *on top* via extension nodes only.

### 1b. Standalone cockpit base (secondary)

- Invertix void `#050505` / panel `#141414`, hairline `white/5`, square corners
- Chart hero; sparse glass on chrome only; desktop 1280+
- Same `--jx-*` tokens as the overlay dock

### 1c. Mod overlay (both surfaces)

- Cyan/teal `#00D4AA` = buy / BUY ZONE / T1
- Lime `#A6FF4D` = active module / beacon pulse (sparse)
- Coral `#FF4757` = GET OUT / STOP / loss / live armed
- Amber `#FFB800` = warning / delayed / weak plan
- Orange `#FF6A2C` = Apply / Place **only**
- ESP box ≤8% fill; waypoint beacons with outline/scrim; tracer lines price → levels
- Module row: ON glow + **plain-English subtitle**

**Anti-goals:** purple SaaS · soft shadcn defaults · dirt-block parody · neon glass soup · blocking overlays · opaque full-screen HUD · profit confetti

---

## 2. Typography

| Use | Face | Notes |
|-----|------|-------|
| Prices, qty, levels, lag | Roboto Mono / JetBrains Mono / IBM Plex Mono + `tnum` | Numbers only |
| Labels / plain English | Instrument Sans | Micro labels 10–12px OK; `ss01` / `ss02` |
| Beginner decision card | Larger Instrument Sans | **BUY ZONE · TAKE PROFIT · GET OUT** · Shares |

Color never alone — pair with BUY/SELL or ▲/▼.

---

## 3. Plain English string table (P0 — matches kid-clear overlay)

| Role | Primary (on-chart / UI) | Secondary / subtitle |
|------|-------------------------|----------------------|
| Entry | **BUY ZONE** | Buy here |
| Take profit | **TAKE PROFIT** | Take some money off |
| Stop / exit | **GET OUT** | Leave if price hits here |
| Analysis default | Live analysis on this chart (free) | FREE local algos + templates on stream |
| Paid LLM | AI helper (paid · limited uses) | Opt-in; show remaining uses |
| Paper | Practice money (Paper) | — |
| Live | Real money (Live) | Typed confirm required |
| Feed | Prices: Live · Xms / Delayed · ~15m / POLLING (slower) | MOCK · demo prices when no live stream |

Finger/arrow cues on every active BUY ZONE / TAKE PROFIT / GET OUT.
Jargon (`T1`, `STOP`, `R-multiple`) = secondary micro-text in Pro only, or Details.
Signals: **“In plain English: …”**
Plan checklist: (1) Check BUY ZONE (2) Set GET OUT (3) Place order
**Why** expander (optional): bias · invalidation · R — exact prices still on surface

---

## 4. Surfaces & CTAs

| Surface | Primary CTA | Notes |
|---------|-------------|-------|
| **Host extension** (TV / Webull / Yahoo / Universal) | **Apply Jarvis plan** (`--jx-cta`) → order path in panel or deep-link standalone | Hide Jarvis hotkey; host badge visible |
| Standalone `/trade/[symbol]` | Apply plan → Place PAPER/LIVE (`--jx-cta` on Apply/Place only) | Secondary; same tokens |
| Blotter / Settings / How it works | as before | Prefer standalone for dense settings |

Beginner modules default ON: ESP Levels · Waypoint Targets · Risk Calc · Jarvis Chat. Algo Radar / Copy Aura quieter.

---

## 5. Risk / truth chrome

- **Not financial advice. Trading can lose money including your full account.**
- Plan quality: Strong / Okay / Skip
- Forbidden: “guaranteed”, “get rich”, “always wins”, “risk-free”
- R / bias never on the default surface — **Why** only, collapsed

---

## 6. Screenshot acceptance (visual bar)

**Primary pack must include ≥2 hosts (TV + one of Webull/Yahoo) + Universal dock shot:**

PASS if a non-trader answers in <10s on a **host page with overlay:**

1. **BUY ZONE / TAKE PROFIT / GET OUT** visible on chart (finger/arrow cues)
2. Paper vs Live
3. Live vs Delayed prices (MOCK ≠ Delayed)
4. Can hide Jarvis in one click/hotkey without reloading the host
5. Chart still pan/zoomable (non-blocking)
6. Correct host badge; Universal dock still usable if chart mount fails
7. Dock reads Invertix: void/ivory/Instrument Sans, hairline white/5, sparse glass, orange **Apply** only

Secondary: standalone cockpit shots matching the same language.

---

## 7. Review gates

| Gate | Owner |
|------|-------|
| Visual bar / Spec SoT | Design → COO |
| Extension HUD build | Lead Jarvis Frontend → Design |
| Comps | UI Research & Audit |
| Trust copy | Design + Trust |
| Merge | COO / VPE — Design does **not** merge |

---

## 8. Comps P0 locks (carry forward)

1. World-first; hover/focus reveals secondary waypoint detail
2. Callout: `Icon · Plain name · Distance/R · Status` · max ~8
3. Color + word; CVD later
4. Corner Paper|Live + feed + risk; one Jarvis bar
5. Plain-English dictionary
6. Paper→Live confirm + $-loss language
7. Alert states Active / Triggered / Paused / Expired
8. No fill confetti
9. Invertix dock craft (void / ivory / glass / `--jx-cta`) on overlay + cockpit

---

*Jarvis Design Spec v0.2.7 · 2026-09-18 · VP of Design · Invertix §0c overlay tokens + Why collapsed; exact level placement*
