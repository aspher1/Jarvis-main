(() => {
  "use strict";

  const HOST_ID = "jarvis-multi-host-hud";
  const STORAGE_KEY = "jarvis-hud-preferences-v1";
  const LEVEL_CONFIG = [
    {
      id: "t2",
      field: "t2",
      short: "T2",
      name: "Target 2",
      plain: "Take some money off",
      hudLabel: "TAKE PROFIT",
      hudArrow: "↑",
      color: "#A6FF4D",
    },
    {
      id: "t1",
      field: "t1",
      short: "T1",
      name: "Target 1",
      plain: "Take some money off",
      hudLabel: "TAKE PROFIT",
      hudArrow: "↑",
      color: "#00D4AA",
    },
    {
      id: "entry",
      field: "entry",
      short: "ENTRY",
      name: "Entry",
      plain: "Buy here",
      hudLabel: "BUY ZONE",
      hudArrow: "→",
      color: "#00D4AA",
    },
    {
      id: "stop",
      field: "stop",
      short: "STOP",
      name: "Stop loss",
      plain: "Leave if price hits here",
      hudLabel: "GET OUT",
      hudArrow: "↓",
      color: "#FF4757",
    },
  ];
  const MOCK_PROJECTION = Object.freeze({
    entry: 0.5,
    stop: 0.68,
    t1: 0.34,
    t2: 0.22,
  });
  const LAST_PRICE_SELECTORS = [
    ".js-symbol-last",
    '[data-name="legend-source-item"]',
    '[data-name="legend"]',
    ".legend",
    '[data-testid="qsp-price"]',
    "fin-streamer[data-field='regularMarketPrice']",
  ];

  const defaultPreferences = {
    esp: true,
    waypoints: true,
    risk: true,
    chat: false,
    overlaysVisible: true,
    collapsed: false,
  };

  let preferences = loadPreferences();
  let jarvisVisible = true;
  let host;
  let shadow;
  let chartBounds;
  let activeAdapter;
  let activeEnvelope;
  let lastSequence = -1;
  let refreshTimer;
  let lastUrl = location.href;

  let lastMockAnchor;
  let mockPlan;

  function loadPreferences() {
    try {
      return {
        ...defaultPreferences,
        ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
      };
    } catch {
      return { ...defaultPreferences };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // The HUD still works if TradingView storage is unavailable.
    }
  }

  function levelsForPlan(plan, projection) {
    return LEVEL_CONFIG.filter(
      (level) =>
        globalThis.JarvisDeskPlan.levelValue(plan, level.field) !== undefined,
    ).map((level) => ({
      ...level,
      price: String(
        globalThis.JarvisDeskPlan.levelValue(plan, level.field),
      ),
      ratio: projection?.[level.field],
    }));
  }

  function extractPrices(text) {
    return String(text || "")
      .replace(/,/g, "")
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number)
      .filter((value) => Number.isFinite(value) && value > 1 && value < 1e7) || [];
  }

  function readVisibleLast(adapter) {
    const lastSelectors = [
      ...(adapter?.lastPriceSelectors || []),
      ...LAST_PRICE_SELECTORS,
    ];
    for (const selector of lastSelectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (element.closest("#jarvis-multi-host-hud")) continue;
        const prices = extractPrices(element.textContent);
        if (prices.length) return prices[0];
      }
    }

    const axisSelectors = adapter?.priceAxisSelectors || [];
    const axisPrices = [];
    for (const selector of axisSelectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (element.closest("#jarvis-multi-host-hud")) continue;
        axisPrices.push(...extractPrices(element.textContent));
      }
    }
    if (axisPrices.length >= 2) {
      return (Math.min(...axisPrices) + Math.max(...axisPrices)) / 2;
    }
    return undefined;
  }

  function buildMockPlan(last) {
    const entry = last;
    const stop = last * 0.992;
    const t1 = last * 1.006;
    const t2 = last * 1.012;
    return {
      id: "DEMO-LocalDesk",
      symbol: "DEMO",
      source: "local-desk",
      side: "BUY",
      entry,
      stop,
      t1,
      t2,
      target1: t1,
      target2: t2,
      rMultiple: 1,
      rewardRisk: 1,
      invalidation: "Mock only — no live signal is connected.",
      quality: "Okay",
      levelsUsed: ["VWAP", "OR", "ATR"],
      surface: {
        buyZone: { label: "BUY ZONE", price: entry, subtitle: "Buy here" },
        takeProfit: {
          label: "TAKE PROFIT",
          price: t1,
          subtitle: "Take some money off",
        },
        getOut: {
          label: "GET OUT",
          price: stop,
          subtitle: "Leave if price hits here",
        },
      },
      why: {
        bias: "Mock LocalDesk fixture scaled to the visible last price.",
        invalidation: "Mock only — no live signal is connected.",
        r: 1,
        setupName: "LocalDesk fixture",
      },
    };
  }

  function currentMockPlan(adapter) {
    const last = readVisibleLast(adapter);
    if (!Number.isFinite(last)) return mockPlan;
    if (lastMockAnchor === last && mockPlan) return mockPlan;
    lastMockAnchor = last;
    mockPlan = buildMockPlan(last);
    return mockPlan;
  }

  function currentLevels() {
    if (activeEnvelope) {
      return levelsForPlan(activeEnvelope.plan, activeEnvelope.projection);
    }
    const plan = currentMockPlan(activeAdapter);
    return plan ? levelsForPlan(plan, MOCK_PROJECTION) : [];
  }


  function setGapState(reason = "Waiting for an exact live DeskPlan") {
    activeEnvelope = undefined;
    if (!shadow) return;
    renderPlan();
    shadow.querySelector(".gap-copy").textContent = reason;
    updateLayout();
  }

  function handlePlanMessage(event) {
    if (event.source !== window) return;
    const envelope = globalThis.JarvisDeskPlan.validateEnvelope(
      event.data,
      lastSequence,
    );
    if (!envelope) return;

    lastSequence = envelope.sequence;
    activeEnvelope = envelope;
    renderPlan();
    updateLayout();
  }

  function isVisible(rect) {
    return (
      rect.width > 480 &&
      rect.height > 260 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < innerHeight &&
      rect.left < innerWidth
    );
  }

  function isAuthenticationPage() {
    return (
      /(?:^|\/)(?:login|log-in|signin|sign-in|signup|sign-up|auth)(?:\/|$)/i.test(
        location.pathname,
      ) || Boolean(document.querySelector('input[type="password"]'))
    );
  }

  function findChartBounds(adapter) {
    if (!adapter || adapter.id === "universal") return null;
    const candidates = [];

    for (const selector of adapter.chartSelectors) {
      document.querySelectorAll(selector).forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (isVisible(rect)) {
          candidates.push(rect);
        }
      });
    }

    candidates.sort((a, b) => b.width * b.height - a.width * a.height);
    const best = candidates[0];
    if (!best) return null;

    return {
      left: Math.max(0, best.left),
      top: Math.max(0, best.top),
      right: Math.min(innerWidth, best.right),
      bottom: Math.min(innerHeight, best.bottom),
      width: Math.min(innerWidth, best.right) - Math.max(0, best.left),
      height: Math.min(innerHeight, best.bottom) - Math.max(0, best.top),
    };
  }

  function ensureInvertixFonts() {
    if (document.getElementById("jarvis-invertix-fonts")) return;
    const link = document.createElement("link");
    link.id = "jarvis-invertix-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap";
    document.documentElement.appendChild(link);
  }

  function createHud() {
    if (document.getElementById(HOST_ID)) return;

    ensureInvertixFonts();
    host = document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("data-jarvis-extension", "true");
    shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
        color-scheme: dark;
        --jx-void: #050507;
        --jx-panel: #0A0A0C;
        --jx-text: #F2F2F4;
        --jx-mute: #8B8B93;
        --jx-ivory: var(--jx-text);
        --jx-ivory-muted: var(--jx-mute);
        --jx-hairline: rgba(255, 255, 255, 0.08);
        --jx-glass: rgba(255, 255, 255, 0.04);
        --jx-cta: #FF6A2C;
        --jx-system: #00D4AA;
        --jx-buy: #00D4AA;
        --jx-stop: #FF4757;
        --jx-risk: #FF4757;
        --jx-active: #A6FF4D;
        --jx-warning: #FFB800;
        --jx-warn: #FFB800;
        --jarvis-entry: var(--jx-buy);
        --jarvis-stop: var(--jx-stop);
        --jarvis-active: var(--jx-active);
        --jarvis-warning: var(--jx-warning);
        --jarvis-bg: var(--jx-void);
        --jarvis-panel: var(--jx-panel);
        --jarvis-border: var(--jx-hairline);
        --jarvis-label-bg: rgba(5, 5, 5, 0.92);
        --jarvis-label-border: rgba(255, 255, 255, 0.18);
        --jx-sans: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
        --jx-mono: "Roboto Mono", "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;
        font-family: var(--jx-sans);
        font-feature-settings: "ss01", "ss02";
      }

      *, *::before, *::after { box-sizing: border-box; }
      button { font: inherit; }

      .overlay {
        position: fixed;
        inset: 0;
        z-index: 798;
        pointer-events: none;
        overflow: hidden;
      }

      .chart-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      .chart-svg line,
      .chart-svg rect {
        vector-effect: non-scaling-stroke;
      }

      .entry-zone {
        fill: rgba(0, 212, 170, 0.07);
        stroke: rgba(0, 212, 170, 0.8);
        stroke-width: 1;
        stroke-dasharray: 5 4;
      }

      .tracer {
        fill: none;
        stroke-width: 1;
        stroke-dasharray: 4 5;
        opacity: 0.58;
      }

      .waypoint {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 7px;
        transform: translate(-10px, -50%);
        color: var(--waypoint-color);
        filter: drop-shadow(0 1px 2px #000) drop-shadow(0 0 1px #000);
        white-space: nowrap;
      }

      .beacon {
        position: relative;
        width: 17px;
        height: 17px;
        border: 1px solid currentColor;
        transform: rotate(45deg);
        background: rgba(5, 5, 5, 0.78);
      }

      .beacon::after {
        content: "";
        position: absolute;
        inset: 4px;
        background: currentColor;
      }

      .waypoint.entry .beacon {
        box-shadow: 0 0 0 4px rgba(0, 212, 170, .12), 0 0 13px rgba(0, 212, 170, .48);
      }

      .waypoint-label {
        display: grid;
        grid-template-columns: auto auto;
        gap: 1px 8px;
        min-width: 146px;
        padding: 5px 7px;
        color: var(--jx-ivory);
        background: var(--jarvis-label-bg);
        border: 1px solid var(--jx-hairline);
        border-left: 2px solid currentColor;
        font: 600 10px/1.25 var(--jx-sans);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      .waypoint-label strong { color: var(--waypoint-color); letter-spacing: .04em; }
      .waypoint-label .price {
        text-align: right;
        font-family: var(--jx-mono);
        font-variant-numeric: tabular-nums;
      }
      .waypoint-label small {
        grid-column: 1 / -1;
        color: var(--jx-ivory-muted);
        font: 500 9px/1.25 var(--jx-sans);
      }

      .dock {
        position: fixed;
        z-index: 799;
        width: 278px;
        color: var(--jx-ivory);
        background: rgba(10, 10, 12, 0.82);
        border: 1px solid var(--jx-hairline);
        box-shadow: 0 12px 40px rgba(0, 0, 0, .28);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        pointer-events: auto;
      }

      .dock.collapsed {
        width: 44px;
      }

      .dock-content {
        max-height: calc(100vh - 62px);
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      .dock.collapsed .dock-content,
      .dock.collapsed .brand-copy {
        display: none;
      }

      .dock-header {
        min-height: 43px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 7px 8px 7px 10px;
        border-bottom: 1px solid var(--jarvis-border);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .brand-mark {
        display: grid;
        place-items: center;
        width: 19px;
        height: 19px;
        flex: 0 0 auto;
        color: var(--jx-ivory);
        border: 1px solid var(--jx-hairline);
        font: 700 10px/1 var(--jx-mono);
      }

      .brand-copy strong {
        display: block;
        color: var(--jx-ivory);
        font: 650 11px/1.1 var(--jx-sans);
        letter-spacing: .12em;
      }

      .brand-copy span {
        display: block;
        margin-top: 2px;
        color: var(--jx-ivory-muted);
        font: 500 9px/1.1 var(--jx-sans);
      }

      .brand-copy .host-badge {
        color: var(--jarvis-active);
      }

      .icon-button {
        width: 27px;
        height: 27px;
        flex: 0 0 auto;
        padding: 0;
        color: var(--jx-ivory-muted);
        background: transparent;
        border: 1px solid var(--jx-hairline);
        cursor: pointer;
      }

      .icon-button:hover,
      .icon-button:focus-visible {
        color: var(--jx-ivory);
        border-color: rgba(255, 255, 255, 0.18);
        outline: none;
      }

      .status-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        padding: 8px;
        border-bottom: 1px solid var(--jarvis-border);
      }

      .badge {
        min-height: 31px;
        padding: 5px 6px;
        background: rgba(20, 20, 20, 0.55);
        border: 1px solid var(--jx-hairline);
      }

      .badge span {
        display: block;
        color: var(--jx-ivory-muted);
        font-size: 8px;
        line-height: 1.1;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .badge strong {
        display: block;
        margin-top: 3px;
        color: var(--jx-ivory);
        font: 650 9px/1.1 var(--jx-mono);
        font-variant-numeric: tabular-nums;
      }

      .badge.paper strong { color: var(--jarvis-entry); }
      .badge.delayed strong { color: var(--jarvis-warning); }
      .badge.mode {
        grid-column: 1 / -1;
        min-height: 27px;
      }
      .badge.mode strong { color: var(--jarvis-active); }

      .section-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 9px 5px;
        color: var(--jx-ivory-muted);
        font: 650 8px/1 var(--jx-sans);
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .demo-chip { color: var(--jarvis-warning); }

      .level-list {
        margin: 0 8px;
        border: 1px solid var(--jarvis-border);
      }

      .level {
        display: grid;
        grid-template-columns: 38px 1fr auto;
        align-items: center;
        gap: 7px;
        min-height: 43px;
        padding: 6px 7px;
        border-bottom: 1px solid var(--jarvis-border);
        font-variant-numeric: tabular-nums;
      }

      .level:last-child { border-bottom: 0; }
      .level-key {
        color: var(--level-color);
        font: 700 9px/1 var(--jx-mono);
        letter-spacing: .04em;
      }
      .level-copy strong {
        display: block;
        color: var(--jx-ivory);
        font-size: 10px;
        line-height: 1.15;
      }
      .level-copy span {
        display: block;
        margin-top: 2px;
        color: var(--jx-ivory-muted);
        font-size: 8px;
        line-height: 1.15;
      }
      .level-price {
        color: var(--jx-ivory);
        font: 650 10px/1 var(--jx-mono);
        font-variant-numeric: tabular-nums;
      }

      .gap-state {
        padding: 12px 9px;
        color: var(--jarvis-warning);
        font-size: 9px;
        line-height: 1.35;
      }

      .why-panel {
        margin: 7px 8px 0;
        color: var(--jx-ivory-muted);
        background: rgba(20, 20, 20, 0.45);
        border: 1px solid var(--jx-hairline);
        font-size: 9px;
        line-height: 1.4;
      }

      .why-panel summary {
        padding: 7px;
        color: var(--jx-ivory);
        cursor: pointer;
        font-family: var(--jx-sans);
      }

      .why-content {
        padding: 0 7px 7px;
        border-top: 1px solid var(--jx-hairline);
      }

      .why-content p { margin: 6px 0 0; }
      .why-content strong { color: var(--jx-ivory); }

      .modules {
        margin: 0 8px;
        border: 1px solid var(--jarvis-border);
      }

      .module {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 7px;
        min-height: 42px;
        padding: 6px 7px;
        border-bottom: 1px solid var(--jarvis-border);
        cursor: pointer;
      }

      .module:last-child { border-bottom: 0; }
      .module:hover { background: rgba(255, 255, 255, 0.03); }
      .module strong {
        display: block;
        color: var(--jx-ivory);
        font-size: 10px;
        line-height: 1.15;
      }
      .module span {
        display: block;
        margin-top: 3px;
        color: var(--jx-ivory-muted);
        font-size: 8px;
        line-height: 1.2;
      }

      .toggle {
        position: relative;
        width: 29px;
        height: 16px;
        margin-top: 3px;
        padding: 0;
        border: 1px solid var(--jx-hairline);
        background: rgba(20, 20, 20, 0.7);
        cursor: pointer;
      }
      .toggle::after {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: 8px;
        height: 8px;
        background: var(--jx-ivory-muted);
      }
      .toggle[aria-checked="true"] {
        border-color: var(--jarvis-active);
        background: rgba(166, 255, 77, .08);
        box-shadow: 0 0 8px rgba(166, 255, 77, .17);
      }
      .toggle[aria-checked="true"]::after {
        left: 16px;
        background: var(--jarvis-active);
      }
      .toggle:focus-visible { outline: 1px solid #FFF; outline-offset: 2px; }

      .risk-note {
        margin: 7px 8px 0;
        padding: 7px;
        color: var(--jx-ivory-muted);
        background: rgba(20, 20, 20, 0.45);
        border-left: 2px solid var(--jx-buy);
        font-size: 9px;
        line-height: 1.35;
      }

      .cta-button {
        display: block;
        width: calc(100% - 16px);
        min-height: 32px;
        margin: 8px 8px 0;
        color: #1A0A04;
        background: var(--jx-cta);
        border: 1px solid var(--jx-cta);
        font: 650 11px/1 var(--jx-sans);
        letter-spacing: .04em;
        cursor: pointer;
      }
      .cta-button:hover,
      .cta-button:focus-visible {
        filter: brightness(1.06);
        outline: 1px solid var(--jx-ivory);
        outline-offset: 2px;
      }

      .hide-button {
        width: calc(100% - 16px);
        min-height: 29px;
        margin: 7px 8px 0;
        color: var(--jx-ivory-muted);
        background: transparent;
        border: 1px solid var(--jx-hairline);
        font-size: 9px;
        cursor: pointer;
      }

      .control-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        margin: 7px 8px 0;
      }

      .control-row .hide-button {
        width: 100%;
        margin: 0;
      }
      .hide-button:hover,
      .hide-button:focus-visible {
        color: var(--jx-ivory);
        border-color: rgba(255, 255, 255, 0.18);
        outline: none;
      }

      .disclaimer {
        margin: 8px;
        color: var(--jx-ivory-muted);
        font-size: 8px;
        line-height: 1.35;
      }

      .delayed-warning {
        margin: 0 8px 8px;
        color: var(--jarvis-warning);
        font-size: 8px;
        line-height: 1.3;
      }

      .is-hidden { display: none !important; }

      @media (max-width: 900px), (max-height: 650px) {
        .dock:not(.collapsed) { width: 246px; }
        .risk-note, .delayed-warning { display: none; }
        .level { min-height: 37px; }
        .module { min-height: 37px; }
      }
    `;

    const root = document.createElement("div");
    root.innerHTML = `
      <div class="overlay" aria-hidden="true">
        <svg class="chart-svg" xmlns="http://www.w3.org/2000/svg">
          <rect class="entry-zone"></rect>
          <g class="tracers"></g>
        </svg>
        <div class="waypoints"></div>
      </div>

      <aside class="dock" aria-label="Jarvis paper-trading HUD" data-spec="O-P0-01 O-P0-02 O-P0-03">
        <header class="dock-header">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">J</div>
            <div class="brand-copy">
              <strong>JARVIS HUD</strong>
              <span class="host-badge">Universal dock</span>
            </div>
          </div>
          <button class="icon-button collapse-button" type="button" aria-label="Collapse Jarvis HUD" title="Collapse Jarvis HUD">−</button>
        </header>

        <div class="dock-content">
          <div class="status-row">
            <div class="badge paper">
              <span>Account</span>
              <strong>Practice money (Paper)</strong>
            </div>
            <div class="badge delayed">
              <span>Price feed</span>
              <strong class="feed-value">MOCK · demo prices</strong>
            </div>
            <div class="badge mode">
              <span>Analysis mode</span>
              <strong class="analysis-value">Live analysis on this chart (free)</strong>
            </div>
          </div>

          <div class="section-label">
            <span>Plan waypoints</span>
            <span class="demo-chip plan-state">Gap · no levels</span>
          </div>
          <div class="level-list"></div>

          <div class="section-label"><span>Beginner modules</span></div>
          <div class="modules">
            <label class="module">
              <span><strong>Chart Levels</strong><span>Show the exact plan prices and guide lines.</span></span>
              <button class="toggle" type="button" role="switch" data-module="esp" aria-label="Toggle ESP Levels"></button>
            </label>
            <label class="module">
              <span><strong>Waypoint Targets</strong><span>Mark where to buy, exit, and take profit.</span></span>
              <button class="toggle" type="button" role="switch" data-module="waypoints" aria-label="Toggle Waypoint Targets"></button>
            </label>
            <label class="module">
              <span><strong>Risk Calc</strong><span>Explain how much is at risk before a trade.</span></span>
              <button class="toggle" type="button" role="switch" data-module="risk" aria-label="Toggle Risk Calc"></button>
            </label>
            <label class="module">
              <span><strong>Jarvis Chat</strong><span>AI helper (paid · limited uses) · opt-in only.</span></span>
              <button class="toggle" type="button" role="switch" data-module="chat" aria-label="Toggle Jarvis Chat"></button>
            </label>
          </div>

          <details class="why-panel" data-spec="O-P0-06">
            <summary>Why <span aria-hidden="true">▸</span> <small>Pro desk</small></summary>
            <div class="why-content"></div>
          </details>
          <button class="cta-button apply-button" type="button" data-spec="O-P0-04">Apply Jarvis plan</button>
          <div class="control-row">
            <button class="hide-button overlay-button" type="button">Hide ESP</button>
            <button class="hide-button jarvis-button" type="button" title="Press the backtick key to show Jarvis again">Hide Jarvis · hotkey</button>
          </div>
          <p class="disclaimer">Not financial advice. Trading can lose money, including your full account.</p>
          <p class="delayed-warning">Mock dock only — chart ESP is off until an exact live stream arrives.</p>
        </div>
      </aside>
    `;

    shadow.append(style, root);
    document.documentElement.appendChild(host);

    renderPlan();
    bindControls();
    applyPreferences();
    updateLayout();
  }

  function renderPlan() {
    const list = shadow.querySelector(".level-list");
    const container = shadow.querySelector(".waypoints");
    const tracers = shadow.querySelector(".tracers");
    const feedValue = shadow.querySelector(".feed-value");
    const analysisValue = shadow.querySelector(".analysis-value");
    const planState = shadow.querySelector(".plan-state");
    const delayedWarning = shadow.querySelector(".delayed-warning");
    const whyPanel = shadow.querySelector(".why-panel");
    const whyContent = shadow.querySelector(".why-content");
    const whyWasOpen = Boolean(whyPanel.open);
    list.replaceChildren();
    whyPanel.classList.remove("is-hidden");
    whyPanel.open = false;
    container.replaceChildren();
    tracers.replaceChildren();
    whyContent.replaceChildren();

    const appendListRow = (level) => {
      const row = document.createElement("div");
      row.className = "level";
      row.style.setProperty("--level-color", level.color);

      const key = document.createElement("span");
      key.className = "level-key";
      key.textContent = level.hudArrow;

      const copy = document.createElement("span");
      copy.className = "level-copy";
      const title = document.createElement("strong");
      title.textContent = level.hudLabel;
      const listPlain = document.createElement("span");
      listPlain.textContent = level.plain;
      copy.append(title, listPlain);

      const listPrice = document.createElement("span");
      listPrice.className = "level-price";
      listPrice.textContent = level.price;
      row.append(key, copy, listPrice);
      list.appendChild(row);
    };

    const renderWhy = (plan) => {
      const whyFields = [
        ["Quality", plan.quality],
        ["Invalidation", plan.why?.invalidation ?? plan.invalidation],
        ["Bias", plan.why?.bias ?? plan.bias],
        ["Reward:risk", plan.why?.r ?? plan.rMultiple ?? plan.rewardRisk],
        ["Setup", plan.why?.setupName ?? plan.setupName],
      ];
      for (const [label, value] of whyFields) {
        if (!value) continue;
        const line = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = `${label}: `;
        line.append(strong, document.createTextNode(String(value)));
        whyContent.appendChild(line);
      }
    };

    const appendWaypoint = (level) => {
      const waypoint = document.createElement("div");
      waypoint.className = `waypoint ${level.id}`;
      waypoint.dataset.level = level.id;
      waypoint.style.setProperty("--waypoint-color", level.color);

      const beacon = document.createElement("span");
      beacon.className = "beacon";

      const label = document.createElement("span");
      label.className = "waypoint-label";
      const name = document.createElement("strong");
      name.textContent = `${level.hudArrow} ${level.hudLabel}`;
      const waypointPrice = document.createElement("span");
      waypointPrice.className = "price";
      waypointPrice.textContent = level.price;
      const waypointPlain = document.createElement("small");
      waypointPlain.textContent = level.plain;
      label.append(name, waypointPrice, waypointPlain);
      waypoint.append(beacon, label);
      container.appendChild(waypoint);

      const tracer = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      tracer.classList.add("tracer");
      tracer.dataset.level = level.id;
      tracer.setAttribute("stroke", level.color);
      tracers.appendChild(tracer);
    };

    if (!activeEnvelope) {
      const mock = currentMockPlan(activeAdapter);
      const gap = document.createElement("div");
      gap.className = "gap-state gap-copy";
      gap.textContent = mock
        ? "MOCK plan · scaled to the visible last price"
        : "MOCK plan · waiting for a visible last price";
      list.appendChild(gap);
      for (const level of currentLevels()) {
        appendListRow(level);
        appendWaypoint(level);
      }
      feedValue.textContent = "MOCK · demo prices";
      analysisValue.textContent = "Live analysis on this chart (free)";
      planState.textContent = `MOCK · Quality: ${mock?.quality || "Okay"}`;
      delayedWarning.textContent =
        "MOCK · demo prices. Chart labels are a visual fixture, not a live stream.";
      delayedWarning.classList.remove("is-hidden");
      whyPanel.open = whyWasOpen;
      if (mock) renderWhy(mock);
      return;
    }

    const levels = currentLevels();
    const lag = Math.max(0, Date.now() - activeEnvelope.observedAt);
    const feedStatus = String(
      activeEnvelope.quote?.feed ?? activeEnvelope.feedStatus,
    ).toLowerCase();
    feedValue.textContent =
      feedStatus === "mock" || feedStatus === "demo"
        ? "MOCK · demo prices"
        : feedStatus === "delayed"
        ? `Prices: Delayed · ~${activeEnvelope.delayMinutes}m`
        : `Prices: Live · ${lag}ms`;
    analysisValue.textContent = "Live analysis on this chart (free)";
    planState.textContent = `Quality: ${activeEnvelope.plan.quality}`;
    delayedWarning.textContent =
      "Provider reports delayed prices — do not use for live day trades.";
    delayedWarning.classList.toggle(
      "is-hidden",
      feedStatus !== "delayed",
    );
    whyPanel.open = whyWasOpen;

    renderWhy(activeEnvelope.plan);

    for (const level of levels) {
      appendListRow(level);
      appendWaypoint(level);
    }
  }

  function bindControls() {
    shadow.querySelector(".collapse-button").addEventListener("click", () => {
      preferences.collapsed = !preferences.collapsed;
      savePreferences();
      applyPreferences();
    });

    shadow.querySelectorAll(".toggle").forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const module = toggle.dataset.module;
        preferences[module] = !preferences[module];
        savePreferences();
        applyPreferences();
      });
    });

    shadow.querySelector(".overlay-button").addEventListener("click", () => {
      preferences.overlaysVisible = !preferences.overlaysVisible;
      savePreferences();
      applyPreferences();
    });

    shadow.querySelector(".jarvis-button").addEventListener("click", () => {
      setJarvisVisibility(false);
    });

    shadow.querySelector(".apply-button").addEventListener("click", () => {
      const button = shadow.querySelector(".apply-button");
      button.textContent = "Applied · PAPER only";
      shadow.querySelector(".level-list")?.scrollIntoView({ block: "nearest" });
    });
  }

  function setJarvisVisibility(visible) {
    jarvisVisible = visible;
    if (host) host.style.display = visible ? "" : "none";
    if (visible) updateLayout();
  }

  function isTypingTarget(target) {
    return (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    );
  }

  function handleHotkey(event) {
    if (
      event.key !== "`" ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      isTypingTarget(event.target)
    ) {
      return;
    }

    event.preventDefault();
    setJarvisVisibility(!jarvisVisible);
  }

  function applyHostAdapter(adapter) {
    activeAdapter = adapter;
    host.style.setProperty(
      "--jarvis-label-bg",
      adapter.contrast.labelBackground,
    );
    host.style.setProperty(
      "--jarvis-label-border",
      adapter.contrast.labelBorder,
    );
    shadow.querySelector(".host-badge").textContent = adapter.hostBadge;
  }

  function applyPreferences() {
    const dock = shadow.querySelector(".dock");
    const collapseButton = shadow.querySelector(".collapse-button");
    const overlay = shadow.querySelector(".overlay");

    dock.classList.toggle("collapsed", preferences.collapsed);
    collapseButton.textContent = preferences.collapsed ? "+" : "−";
    collapseButton.setAttribute(
      "aria-label",
      preferences.collapsed ? "Expand Jarvis HUD" : "Collapse Jarvis HUD",
    );
    collapseButton.title = collapseButton.getAttribute("aria-label");

    shadow.querySelectorAll(".toggle").forEach((toggle) => {
      toggle.setAttribute("aria-checked", String(Boolean(preferences[toggle.dataset.module])));
    });

    overlay.classList.toggle("is-hidden", !preferences.overlaysVisible);
    shadow
      .querySelector(".entry-zone")
      .classList.toggle("is-hidden", !preferences.esp);
    shadow
      .querySelector(".tracers")
      .classList.toggle("is-hidden", !preferences.esp);
    shadow
      .querySelector(".waypoints")
      .classList.toggle("is-hidden", !preferences.waypoints);
    shadow.querySelector(".why-panel").classList.remove("is-hidden");

    const hideButton = shadow.querySelector(".overlay-button");
    hideButton.textContent = preferences.overlaysVisible
      ? "Hide ESP"
      : "Show ESP";

    updateLayout();
  }

  function updateLayout() {
    if (!shadow) return;
    if (
      activeEnvelope &&
      !["mock", "demo"].includes(
        String(activeEnvelope.quote?.feed ?? activeEnvelope.feedStatus).toLowerCase(),
      ) &&
      Date.now() - activeEnvelope.observedAt >
        globalThis.JarvisDeskPlan.STALE_AFTER_MS
    ) {
      setGapState("Live stream became stale — exact levels cleared");
      return;
    }

    const requestedAdapter =
      globalThis.JarvisHostAdapters.adapterForLocation(location);
    chartBounds = findChartBounds(requestedAdapter);
    const resolvedAdapter = chartBounds
      ? requestedAdapter
      : globalThis.JarvisHostAdapters.universal;
    if (resolvedAdapter !== activeAdapter) applyHostAdapter(resolvedAdapter);

    if (!activeEnvelope) {
      const previous = lastMockAnchor;
      currentMockPlan(resolvedAdapter);
      if (lastMockAnchor !== previous) {
        renderPlan();
        return;
      }
    }

    if (!chartBounds) {
      shadow.querySelector(".overlay").classList.add("is-hidden");
      const dock = shadow.querySelector(".dock");
      const dockWidth = preferences.collapsed
        ? 44
        : Math.min(278, innerWidth - 24);
      dock.style.right = `${Math.max(8, Math.min(16, innerWidth - dockWidth - 8))}px`;
      dock.style.top = `${Math.max(72, Math.min(96, innerHeight - dock.offsetHeight - 24))}px`;
      return;
    }

    shadow
      .querySelector(".overlay")
      .classList.toggle("is-hidden", !preferences.overlaysVisible);

    const dock = shadow.querySelector(".dock");
    const dockWidth = preferences.collapsed ? 44 : Math.min(278, innerWidth - 24);
    const rightGap = Math.max(58, innerWidth - chartBounds.right + 12);
    const desiredTop = Math.max(86, chartBounds.top + 18);
    const availableTop = Math.max(10, innerHeight - dock.offsetHeight - 42);
    dock.style.right = `${Math.min(rightGap, innerWidth - dockWidth - 8)}px`;
    dock.style.top = `${Math.min(desiredTop, availableTop)}px`;

    const markerX = Math.min(
      chartBounds.left + chartBounds.width * 0.58,
      chartBounds.right - dockWidth - 170,
    );
    const levels = currentLevels();
    const zone = shadow.querySelector(".entry-zone");
    const entry = levels.find((level) => level.id === "entry");
    if (!entry || !Number.isFinite(entry.ratio)) {
      shadow.querySelector(".overlay").classList.add("is-hidden");
      return;
    }
    const entryY =
      chartBounds.top + chartBounds.height * entry.ratio;

    zone.setAttribute("x", String(chartBounds.left + 35));
    zone.setAttribute("y", String(entryY - 4));
    zone.setAttribute("width", String(Math.max(80, chartBounds.width - 75)));
    zone.setAttribute("height", "8");

    for (const level of levels) {
      const y = chartBounds.top + chartBounds.height * level.ratio;
      const waypoint = shadow.querySelector(`[data-level="${level.id}"].waypoint`);
      waypoint.style.left = `${markerX}px`;
      waypoint.style.top = `${y}px`;

      const tracer = shadow.querySelector(`line[data-level="${level.id}"]`);
      tracer.setAttribute("x1", String(chartBounds.left + 35));
      tracer.setAttribute("y1", String(y));
      tracer.setAttribute("x2", String(markerX));
      tracer.setAttribute("y2", String(y));
    }
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (location.href !== lastUrl) lastUrl = location.href;
      if (isAuthenticationPage()) {
        host?.remove();
        host = undefined;
        shadow = undefined;
        return;
      }
      if (!host) createHud();
      updateLayout();
    }, 120);
  }

  if (!isAuthenticationPage()) createHud();

  window.addEventListener("resize", scheduleRefresh, { passive: true });
  window.addEventListener("scroll", scheduleRefresh, { passive: true });
  window.addEventListener("message", handlePlanMessage);
  document.addEventListener("keydown", handleHotkey, true);

  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  setInterval(scheduleRefresh, 1500);
})();
