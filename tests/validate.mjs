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
    source: "local-desk",
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
const numericPlan = {
  ...envelope,
  plan: {
    ...envelope.plan,
    entry: 188.0375,
    t1: 189.1625,
    target1: 189.1625,
  },
};
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(numericPlan, 41, now),
  numericPlan,
);
assert.equal(
  globalThis.JarvisDeskPlan.levelValue(
    { target1: 189.1625 },
    "t1",
  ),
  189.1625,
);
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(
    {
      ...numericPlan,
      plan: { ...numericPlan.plan, target1: 999 },
    },
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

const delayed = {
  ...envelope,
  feedStatus: "delayed",
  delayMinutes: 15,
};
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(delayed, 41, now),
  delayed,
);
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(
    { ...delayed, delayMinutes: undefined },
    41,
    now,
  ),
  null,
);

const content = fs.readFileSync("content.js", "utf8");
assert.equal(content.includes("MOCK · demo prices"), true);
assert.equal(content.includes("Delayed / MOCK"), false);
assert.equal(content.includes("Delayed · ~15m"), false);
assert.equal(content.includes("--jx-cta: #FF6A2C"), true);
assert.equal(content.includes("Instrument Sans"), true);
assert.equal(content.includes("Apply Jarvis plan"), true);
assert.equal(content.includes('details class="why-panel"'), true);
assert.equal(content.includes("why-panel is-hidden"), false);
assert.equal(content.includes("<details class=\"why-panel\" open"), false);
assert.equal(content.includes("R-multiple"), false);
assert.equal(content.includes("--jx-buy: #00D4AA"), true);
assert.equal(content.includes("--jx-stop: #FF4757"), true);
assert.match(content, /hudLabel: "BUY ZONE"[\s\S]*color: "#00D4AA"/);
assert.match(content, /hudLabel: "GET OUT"[\s\S]*color: "#FF4757"/);

const adapters = fs.readFileSync("adapters.js", "utf8");
assert.equal(adapters.includes("rgba(5, 5, 5, 0.97)"), true);

const design = fs.readFileSync("docs/DESIGN.md", "utf8");
assert.equal(design.includes("Design Spec v0.2.6"), true);
assert.equal(design.includes("## 0c. Invertix-grade craft"), true);
assert.equal(design.includes("--jx-void"), true);
assert.equal(content.includes("--jx-void: #050507"), true);
assert.equal(content.includes("blur(16px)"), true);

assert.equal(content.includes("188.0375"), false);
assert.equal(content.includes("readVisibleLast"), true);

const mockEnvelope = {
  ...envelope,
  source: "mock-demo",
  feedStatus: "mock",
  observedAt: now - 10_000,
  sequence: 99,
  plan: { ...envelope.plan, entry: 336.12, stop: 333.43104, t1: 338.13672, target1: 338.13672, t2: undefined },
  projection: { entry: 0.5, stop: 0.68, t1: 0.34 },
};
assert.equal(
  globalThis.JarvisDeskPlan.validateEnvelope(mockEnvelope, 41, now),
  mockEnvelope,
);

console.log("Manifest, adapters, DeskPlan validation, Invertix craft, and gap safety pass");
