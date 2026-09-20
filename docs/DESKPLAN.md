# DeskPlan rendering contract

The HUD is a renderer, not a level generator. Risk/Algos owns the canonical plan and Platform owns the fresh host projection. The extension never rounds, prettifies, interpolates, or invents a plan price.

## Atomic stream envelope

The free local stream posts one atomic message to the page for every plan/projection update:

```js
window.postMessage({
  type: "JARVIS_DESK_PLAN_V1",
  source: "jarvis-free-local",
  sequence: 1842,
  observedAt: Date.now(),
  feedStatus: "live",
  plan: {
    id: "AAPL-LocalDesk",
    symbol: "AAPL",
    source: "local-desk",
    side: "BUY",
    entry: 188.0375,
    stop: 186.9125,
    t1: 189.1625,
    t2: 190.2875,
    target1: 189.1625,
    target2: 190.2875,
    rMultiple: 1,
    rewardRisk: 1,
    invalidation: "Leave if price closes below the plan stop.",
    quality: "Okay",
    levelsUsed: ["VWAP", "OR", "ATR"],
    why: {
      bias: "Price is holding above session VWAP.",
      invalidation: "Leave if price closes below the plan stop.",
      r: 1,
      setupName: "LocalDesk"
    }
  },
  projection: {
    entry: 0.56,
    stop: 0.73,
    t1: 0.39,
    t2: 0.24
  }
}, location.origin);
```

### Canonical fields

- BUY ZONE reads only `plan.entry`.
- GET OUT reads only `plan.stop`.
- Primary TAKE PROFIT reads only `plan.t1`; `plan.t2` is optional and secondary.
- Why/invalidation reads only `plan.invalidation`.
- Quality chrome accepts only `Strong`, `Okay`, or `Skip`.
- Prices use the canonical numeric values from LocalDesk. The HUD calls no rounding or formatting helper; it renders JavaScript’s direct string form of the received number. Decimal strings are also accepted for transports that preserve lexical precision.
- `target1` is an alias of `t1`, `target2` is an alias of `t2`, and mismatched alias pairs reject the whole envelope.
- `source` must be `local-desk`; `levelsUsed` may include `VWAP`, `OR`, `PRIOR_H`, `PRIOR_L`, and `ATR`.
- `projection` is an atomic, normalized top-to-bottom chart coordinate produced from the same host-scale revision as the plan. It controls placement only; it never supplies display prices.

`why.invalidation`, `why.bias`, `why.r` (T1 only), and optional `why.setupName` appear only inside the collapsed **Why** expander.

## Freshness and gap behavior

- Messages are applied immediately; there is no timer batch and no LLM-per-tick path.
- A sequence must increase, and `observedAt` must be within three seconds.
- Missing entry, stop, T1, invalidation, quality, or matching projections rejects the entire envelope.
- T2 is omitted unless both its exact price and projection are present.
- When the stream is absent or stale, the HUD clears every chart label and tracer, switches to the Universal dock, and shows `MOCK · demo prices`. `Delayed` is reserved for a real provider that explicitly reports a delayed feed.
- `Skip` remains visible as quality chrome. This extension exposes no executable order action.

The message example documents the live envelope shape. The extension does not emit synthetic live envelopes.

## Mock fixture and axis-snap status

Until a live LocalDesk producer is wired, the HUD builds a MOCK DeskPlan from the **visible last price** (legend) or the mid of visible price-axis labels. It never uses a hardcoded 188-era fixture. The feed chip stays `MOCK · demo prices`.


The integration step is to send LocalDesk’s unmodified `entry`, `stop`, `t1`, and optional `t2` together with host-axis projections from the same chart-scale revision. The HUD already snaps each line, beacon center, arrow row, and mono number to those projection coordinates without price re-rounding. Missing prices or projections reject the live envelope and preserve honest mock chrome.
