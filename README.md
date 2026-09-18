# Jarvis

Jarvis is a risk-first trading decision cockpit. It places a sparse, mod-style HUD over its own chart so a trader can see the entry zone, stop, targets, and position size before acting.

Paper trading is the default. A guarded Alpaca LIVE path exists, but it remains disabled unless every server and user safety gate passes.

> **Not financial advice. Trading can lose money, including your full account. You are responsible for every order.**

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The default demo uses a clearly labeled mock stream, so the cockpit looks alive without credentials.

## Market-data modes

Jarvis uses one `MarketData` contract for snapshots, candles, and subscriptions:

- **Alpaca IEX:** low-lag WebSocket stream when `ALPACA_API_KEY` and `ALPACA_API_SECRET` are present.
- **Yahoo:** public HTTP fallback only when `MARKET_DATA_MODE=yahoo`; always labeled `DELAYED · ~15m`.
- **Mock:** deterministic development stream; always labeled `MOCK`.
- **Polygon/Finnhub:** intentionally disabled until complete snapshot and stream adapters are verified. Merely having a key cannot mark these feeds LIVE.

Free delayed data is not suitable for live day trading. For a low-lag path, configure Alpaca data credentials and verify the persistent feed badge says **Prices: Live** with measured event age.

## Environment

Copy these values into `.env.local` (never commit that file):

```bash
# mock (default) or yahoo
MARKET_DATA_MODE=mock

# Alpaca market data and broker
ALPACA_API_KEY=
ALPACA_API_SECRET=

# The server refuses LIVE routing unless this is exactly live
BROKER_MODE=paper
```

To enable the real-money path intentionally:

1. Configure Alpaca credentials on the server.
2. Set `BROKER_MODE=live`.
3. Confirm the resolved feed badge is LIVE. Provider configuration alone is insufficient.
4. Complete the stopped Paper-trade process gate.
5. In Settings, type `I understand this can lose real money`.
6. Keep “LIVE prices required” enabled. The server enforces this regardless of the client.

Before any Alpaca request, the server fetches the current quote and account, then re-checks plan quality, size, Target-1 reward:risk, daily loss, and anti-tilt state. Accepted orders use stop/target brackets.

## Structure

- `app/` — App Router pages and server-only market/broker routes
- `components/hud/` — chart and waypoint overlay
- `lib/market/` — market-data contract, snapshots, and stream adapters
- `lib/algos/` — pure OHLCV signal functions
- `lib/copytrade/` — simulated leaders only
- `lib/assistant/` — structured local planner interface
- `lib/paper/` — broker types, risk checks, positions, and expectancy
- `DESIGN.md` — terminal/HUD design rules
- `PRODUCT.md` — product boundaries and roadmap

## Safety boundaries

Jarvis does not scrape cookies, capture passwords, bypass authentication, reverse-engineer private APIs, inject into broker logins, or silently place host-site orders. Simulated leaders are not real copied accounts. No result or plan is a guarantee.