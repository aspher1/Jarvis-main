(() => {
  "use strict";

  const MESSAGE_TYPE = "JARVIS_DESK_PLAN_V1";
  const STALE_AFTER_MS = 3000;

  function isExactPrice(value) {
    return (
      ((typeof value === "string" &&
        /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) ||
        typeof value === "number") &&
      Number.isFinite(Number(value)) &&
      Number(value) > 0
    );
  }

  function levelValue(plan, field) {
    if (field === "t1") return plan.t1 ?? plan.target1;
    if (field === "t2") return plan.t2 ?? plan.target2;
    return plan[field];
  }

  function validateEnvelope(value, lastSequence = -1, now = Date.now()) {
    if (!value || typeof value !== "object") return null;
    const { plan, projection } = value;
    const feedStatus = String(value.quote?.feed ?? value.feedStatus).toLowerCase();
    const invalidation = plan?.why?.invalidation ?? plan?.invalidation;
    if (
      value.type !== MESSAGE_TYPE ||
      value.source !== "jarvis-free-local" ||
      !["live", "delayed"].includes(feedStatus) ||
      !Number.isSafeInteger(value.sequence) ||
      value.sequence <= lastSequence ||
      !Number.isFinite(value.observedAt) ||
      Math.abs(now - value.observedAt) > STALE_AFTER_MS ||
      !plan ||
      !projection ||
      plan.source !== "local-desk" ||
      !["Strong", "Okay", "Skip"].includes(plan.quality) ||
      typeof invalidation !== "string" ||
      !invalidation.trim()
    ) {
      return null;
    }

    if (
      feedStatus === "delayed" &&
      (!Number.isFinite(value.delayMinutes) || value.delayMinutes <= 0)
    ) {
      return null;
    }

    for (const field of ["entry", "stop", "t1"]) {
      const price = levelValue(plan, field);
      if (
        !isExactPrice(price) ||
        !Number.isFinite(projection[field]) ||
        projection[field] < 0 ||
        projection[field] > 1
      ) {
        return null;
      }
    }

    if (
      (plan.t1 !== undefined &&
        plan.target1 !== undefined &&
        Number(plan.t1) !== Number(plan.target1)) ||
      (plan.t2 !== undefined &&
        plan.target2 !== undefined &&
        Number(plan.t2) !== Number(plan.target2))
    ) {
      return null;
    }

    const t2 = levelValue(plan, "t2");
    if (
      t2 !== undefined &&
      (!isExactPrice(t2) ||
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
    levelValue,
    validateEnvelope,
  });
})();
