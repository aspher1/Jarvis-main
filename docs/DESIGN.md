# Jarvis — Design Spec v0.2.1 (SoT)

**Owner:** VP of Design · **Report to:** COO only · **Do not merge**  
**Repo:** https://github.com/aspher1/Jarvis-main  
**Comps:** `/workspace/jarvis-design/RESEARCH-HUD-COMPS.md`, `/workspace/jarvis-design/COMPS.md`

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

## 1. Visual system

### 1a. Host pages — do not restyle

Leave host chrome alone (TV / Webull / Yahoo). Jarvis draws *on top* via extension nodes only.

### 1b. Standalone cockpit base (secondary)

- Dark-only: `#0D0D0D` / `#141414`, hairline `#2A2A2A`, square corners, shared borders
- Chart hero; flat fills; desktop 1280+

### 1c. Mod overlay (both surfaces)

- Cyan/teal `#00D4AA` = buy / ENTRY / T1–T2
- Lime `#A6FF4D` = active module / beacon pulse (sparse)
- Coral `#FF4757` = STOP / loss / live armed
- Amber `#FFB800` = warning / delayed / weak plan
- ESP box ≤8% fill; waypoint beacons with outline/scrim; tracer lines price → levels
- Module row: ON glow + **plain-English subtitle**

**Anti-goals:** purple SaaS · soft shadcn defaults · dirt-block parody · neon glass soup · blocking overlays · opaque full-screen HUD · profit confetti

---

## 2. Typography

| Use | Face | Notes |
|-----|------|-------|
| Prices, qty, levels, lag | JetBrains Mono / IBM Plex Mono + `tnum` | Numbers only |
| Labels / plain English | Inter | Micro labels 10–12px OK |
| Beginner decision card | Larger | Entry · Stop · Target · Shares |

Color never alone — pair with BUY/SELL or ▲/▼.

---

## 3. Plain English (P0)

“Buy here” · “Stop loss (get out if wrong)” · “Target 1 (take some profit)”  
Jargon → one-line definition. Beginner default.  
Signals: **“In plain English: …”**  
Plan checklist: (1) Check entry (2) Set stop (3) Place order  

Badges: `Practice money (Paper)` · `Real money (Live)` · `Prices: Live · 42ms` · `Prices: Delayed · ~15m`

---

## 4. Surfaces & CTAs

| Surface | Primary CTA | Notes |
|---------|-------------|-------|
| **Host extension** (TV / Webull / Yahoo / Universal) | **Apply Jarvis plan** → order path in panel or deep-link standalone | Hide Jarvis hotkey; host badge visible |
| Standalone `/trade/[symbol]` | Apply plan → Place PAPER/LIVE | Secondary; same tokens |
| Blotter / Settings / How it works | as before | Prefer standalone for dense settings |

Beginner modules default ON: ESP Levels · Waypoint Targets · Risk Calc · Jarvis Chat. Algo Radar / Copy Aura quieter.

---

## 5. Risk / truth chrome

- **Not financial advice. Trading can lose money including your full account.**
- Plan quality: Strong / Okay / Skip
- Forbidden: “guaranteed”, “get rich”, “always wins”, “risk-free”

---

## 6. Screenshot acceptance (visual bar)

**Primary pack must include ≥2 hosts (TV + one of Webull/Yahoo) + Universal dock shot:**

PASS if a non-trader answers in <10s on a **host page with overlay:**

1. ENTRY / STOP / T1–T2 visible on chart
2. Paper vs Live
3. Live vs Delayed prices
4. Can hide Jarvis in one click/hotkey without reloading the host
5. Chart still pan/zoomable (non-blocking)
6. Correct host badge; Universal dock still usable if chart mount fails

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

---

*Jarvis Design Spec v0.2.1 · 2026-09-18 · VP of Design · multi-host overlay (TV + Webull + Yahoo + Universal)*
