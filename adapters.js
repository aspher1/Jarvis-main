(() => {
  "use strict";

  const registry = [
    {
      id: "tradingview",
      hostBadge: "on TradingView",
      hostnames: ["tradingview.com"],
      chartSelectors: [
        '[data-name="chart-container"]',
        '[class*="chart-container"]',
        ".chart-container",
        "#chart-container",
        "canvas",
      ],
      lastPriceSelectors: [
        ".js-symbol-last",
        '[data-name="legend-source-item"]',
        '[data-name="legend"]',
        ".legend",
      ],
      priceAxisSelectors: [
        '[data-name="price-axis"]',
        '[class*="priceAxis"]',
        '[class*="price-axis"]',
      ],
      contrast: {
        labelBackground: "rgba(5, 5, 5, 0.92)",
        labelBorder: "rgba(255, 255, 255, 0.18)",
      },
    },
    {
      id: "webull",
      hostBadge: "on Webull",
      hostnames: ["webull.com"],
      chartSelectors: [
        '[class*="chart-container"]',
        '[class*="chartContainer"]',
        '[class*="kline"]',
        '[class*="chart"] canvas',
        "canvas",
      ],
      lastPriceSelectors: [
        '[class*="last"]',
        '[class*="price"]',
      ],
      priceAxisSelectors: [
        '[class*="price-axis"]',
        '[class*="yAxis"]',
      ],
      contrast: {
        labelBackground: "rgba(5, 5, 5, 0.94)",
        labelBorder: "rgba(255, 255, 255, 0.22)",
      },
    },
    {
      id: "yahoo",
      hostBadge: "on Yahoo Finance",
      hostnames: ["finance.yahoo.com"],
      chartSelectors: [
        "fin-chart",
        '[data-testid="chart-container"]',
        '[data-testid*="chart-container"]',
        'section[data-testid*="chart"]',
        "#chart-container",
        'section[data-testid*="quote"] canvas',
        "canvas",
      ],
      lastPriceSelectors: [
        '[data-testid="qsp-price"]',
        '[data-field="regularMarketPrice"]',
        "fin-streamer[data-field='regularMarketPrice']",
      ],
      priceAxisSelectors: [
        '[class*="price-axis"]',
        "fin-chart",
      ],
      contrast: {
        labelBackground: "rgba(5, 5, 5, 0.97)",
        labelBorder: "rgba(255, 255, 255, 0.55)",
      },
    },
  ];

  const universal = {
    id: "universal",
    hostBadge: "Universal dock",
    hostnames: [],
    chartSelectors: [],
    contrast: {
      labelBackground: "rgba(5, 5, 5, 0.94)",
      labelBorder: "rgba(255, 255, 255, 0.18)",
    },
  };

  function hostnameMatches(hostname, suffix) {
    return hostname === suffix || hostname.endsWith(`.${suffix}`);
  }

  function adapterForLocation(location) {
    const demoHost =
      globalThis.document?.documentElement?.getAttribute("data-jarvis-demo-host");
    if (demoHost) {
      return registry.find((adapter) => adapter.id === demoHost) || universal;
    }
    return (
      registry.find((adapter) =>
        adapter.hostnames.some((hostname) =>
          hostnameMatches(location.hostname, hostname),
        ),
      ) || universal
    );
  }

  globalThis.JarvisHostAdapters = Object.freeze({
    all: Object.freeze([...registry, universal]),
    universal,
    adapterForLocation,
  });
})();
