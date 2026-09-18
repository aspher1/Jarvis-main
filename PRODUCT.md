# Jarvis product scope

## Promise

Jarvis helps a trader see a plan, size the risk, and follow a consistent process. It can help take better trades and lose less. It cannot predict the market or guarantee profit.

## Companion MVP

1. Watch AAPL, TSLA, NVDA, SPY, or add another symbol.
2. Open the symbol cockpit.
3. Turn ESP Levels, Algo Radar, Copy Aura, Risk Calc, and Jarvis Chat on or off.
4. Ask Jarvis for a concrete plan with Entry, Stop, Target 1, Target 2, Shares, reason, and invalidation.
5. Apply the plan to dual-channel chart waypoints.
6. Pass hard risk gates before placing a Paper order.
7. Review positions, fills, P&L, win rate, average R, expectancy, and drawdown.

Beginner mode is the default. Expert diagnostics are progressive disclosure, not day-one clutter.

## Data and latency truth

- Alpaca IEX uses a server-proxied WebSocket for streaming quotes.
- Chart and last price consume the same client stream without a page refetch.
- Every quote carries a resolved feed status. LIVE broker authorization uses that actual status, not the configured provider name.
- Yahoo is delayed and never presented as live.
- Mock is for demonstration and never presented as market data.
- Network latency cannot be zero or guaranteed. Jarvis reports observed event age and broker acknowledgment time when available.

## Risk and survival

Orders are blocked when:

- plan quality is `Skip`;
- planned loss exceeds the configured maximum (server ceiling: 1% for LIVE);
- Target 1 offers less than the minimum reward:risk (server floor: 2R for LIVE);
- the daily loss kill switch is reached (server ceiling: 3% for LIVE);
- anti-tilt detects two consecutive losses;
- the stop is missing or invalid;
- LIVE mode resolves anything other than an actual LIVE quote.

LIVE checks run again on the server using Alpaca account equity and the latest resolved quote immediately before submission.

## Modes

### Practice money (Paper)

Default. Local, simulated fills against the latest streamed mid. Use this mode to learn, prove the process, and build a journal.

### Real money (Live)

Optional Alpaca adapter. Requires server enablement, server-held keys, actual live data, a typed risk acknowledgment, process proof, and all risk checks. Orders use stop/target brackets. No mode can become live silently.

## Later, separate track

- Browser visual overlay on third-party chart sites, subject to platform terms and a separate security review.
- Additional market-data providers after complete snapshot and stream verification.
- Authenticated, durable journal storage.
- Provider-backed LLM assistant through the existing `Assistant` interface.
- Real broker integrations beyond Alpaca, each with explicit OAuth/API authorization and independent risk controls.

Later work must never include cookie scraping, session hijacking, password capture, paywall bypass, guaranteed-profit claims, or silent third-party order placement.
