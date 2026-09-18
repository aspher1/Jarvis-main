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
      contrast: {
        labelBackground: "rgba(13, 13, 13, 0.94)",
        labelBorder: "#59606B",
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
      contrast: {
        labelBackground: "rgba(10, 17, 24, 0.96)",
        labelBorder: "#65717D",
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
      contrast: {
        labelBackground: "rgba(13, 13, 13, 0.97)",
        labelBorder: "#FFFFFF",
      },
    },
  ];

  const universal = {
    id: "universal",
    hostBadge: "Universal dock",
    hostnames: [],
    chartSelectors: [],
    contrast: {
      labelBackground: "rgba(13, 13, 13, 0.97)",
      labelBorder: "#59606B",
    },
  };

  function hostnameMatches(hostname, suffix) {
    return hostname === suffix || hostname.endsWith(`.${suffix}`);
  }

  function adapterForLocation(location) {
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
