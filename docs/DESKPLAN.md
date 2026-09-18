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
    entry: "188.0375",
    stop: "186.9125",
    t1: "189.1625",
    t2: "190.2875",
    invalidation: "Leave if price closes below the plan stop.",
    quality: "Okay",
    bias: "Price is holding above the local trend.",
    rewardRisk: "1:1",
    setupName: "Optional setup name"
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
- Prices are positive decimal **strings** so trailing precision survives JSON transport unchanged.
- `projection` is an atomic, normalized top-to-bottom chart coordinate produced from the same host-scale revision as the plan. It controls placement only; it never supplies display prices.

Optional `bias`, `rewardRisk`, and `setupName` values appear only inside the collapsed **Why** expander.

## Freshness and gap behavior

- Messages are applied immediately; there is no timer batch and no LLM-per-tick path.
- A sequence must increase, and `observedAt` must be within three seconds.
- Missing entry, stop, T1, invalidation, quality, or matching projections rejects the entire envelope.
- T2 is omitted unless both its exact price and projection are present.
- When the stream is absent or stale, the HUD clears every chart label and tracer, switches to the Universal dock, and shows `MOCK · demo prices`. `Delayed` is reserved for a real provider that explicitly reports a delayed feed.
- `Skip` remains visible as quality chrome. This extension exposes no executable order action.

The message example documents shape only. The extension does not emit synthetic envelopes or use those example values at runtime.
