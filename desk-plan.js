(() => {
  "use strict";

  const MESSAGE_TYPE = "JARVIS_DESK_PLAN_V1";
  const STALE_AFTER_MS = 3000;

  function isExactPrice(value) {
    return (
      typeof value === "string" &&
      /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) &&
      Number.isFinite(Number(value)) &&
      Number(value) > 0
    );
  }

  function validateEnvelope(value, lastSequence = -1, now = Date.now()) {
    if (!value || typeof value !== "object") return null;
    const { plan, projection } = value;
    if (
      value.type !== MESSAGE_TYPE ||
      value.source !== "jarvis-free-local" ||
      value.feedStatus !== "live" ||
      !Number.isSafeInteger(value.sequence) ||
      value.sequence <= lastSequence ||
      !Number.isFinite(value.observedAt) ||
      Math.abs(now - value.observedAt) > STALE_AFTER_MS ||
      !plan ||
      !projection ||
      !["Strong", "Okay", "Skip"].includes(plan.quality) ||
      typeof plan.invalidation !== "string" ||
      !plan.invalidation.trim()
    ) {
      return null;
    }

    for (const field of ["entry", "stop", "t1"]) {
      if (
        !isExactPrice(plan[field]) ||
        !Number.isFinite(projection[field]) ||
        projection[field] < 0 ||
        projection[field] > 1
      ) {
        return null;
      }
    }

    if (
      plan.t2 !== undefined &&
      (!isExactPrice(plan.t2) ||
        !Number.isFinite(projection.t2) ||
        projection.t2 < 0 ||
        projection.t2 > 1)
    ) {
      return null;
    }

    return value;
  }

  globalThis.JarvisDeskPlan = Object.freeze({
    MESSAGE_TYPE,
    STALE_AFTER_MS,
    isExactPrice,
    validateEnvelope,
  });
})();
