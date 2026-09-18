import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const load = (path) => vm.runInThisContext(fs.readFileSync(path, "utf8"));

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
assert.deepEqual(manifest.content_scripts[0].js, [
  "adapters.js",
  "desk-plan.js",
  "content.js",
]);

load("adapters.js");
load("desk-plan.js");

for (const [hostname, id] of [
  ["www.tradingview.com", "tradingview"],
  ["app.webull.com", "webull"],
  ["finance.yahoo.com", "yahoo"],
  ["example.com", "universal"],
]) {
  assert.equal(
    globalThis.JarvisHostAdapters.adapterForLocation({ hostname }).id,
    id,
  );
}

const now = Date.now();
const envelope = {
  type: "JARVIS_DESK_PLAN_V1",
  source: "jarvis-free-local",
  sequence: 42,
  observedAt: now,
  feedStatus: "live",
  plan: {
    entry: "188.037500",
    stop: "186.912500",
    t1: "189.162500",
    t2: "190.287500",
    invalidation: "Leave if price closes below the plan stop.",
    quality: "Okay",
  },
  projection: {
    entry: 0.56,
    stop: 0.73,
    t1: 0.39,
    t2: 0.24,
  },
};

assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(envelope, 41, now),
  envelope,
);
assert.equal(envelope.plan.entry, "188.037500");
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(
    { ...envelope, sequence: 41 },
    41,
    now,
  ),
  null,
);
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(
    { ...envelope, observedAt: now - 3001 },
    41,
    now,
  ),
  null,
);
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(
    { ...envelope, plan: { ...envelope.plan, entry: 188.0375 } },
    41,
    now,
  ),
  null,
);
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(
    { ...envelope, plan: { ...envelope.plan, quality: "Great" } },
    41,
    now,
  ),
  null,
);

const withoutT2 = {
  ...envelope,
  plan: { ...envelope.plan, t2: undefined },
  projection: { ...envelope.projection, t2: undefined },
};
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(withoutT2, 41, now),
  withoutT2,
);

const content = fs.readFileSync("content.js", "utf8");
assert.equal(content.includes("MOCK · demo prices"), true);
assert.equal(content.includes("Delayed / MOCK"), false);
assert.equal(content.includes("Delayed · ~15m"), false);

console.log("Manifest, adapters, DeskPlan validation, and gap safety pass");
