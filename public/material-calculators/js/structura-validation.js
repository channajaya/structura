/**
 * STRUCTURA shared validation helpers.
 */
(function (global) {
  "use strict";

  function validateRequiredFields(root) {
    const scope = root || document;
    const errors = [];
    scope.querySelectorAll('[data-field][data-required="1"]').forEach((el) => {
      if (el.type === "number" && !(Number(el.value) > 0)) {
        errors.push(`${el.dataset.label || el.id} must be greater than zero.`);
      }
    });
    scope.querySelectorAll('input[type="number"]').forEach((el) => {
      const val = Number(el.value);
      const label = el.dataset.label || el.id;
      if (el.min !== "" && val < Number(el.min || 0)) {
        errors.push(`${label} cannot be below ${el.min}.`);
      }
      if (el.max !== "" && val > Number(el.max)) {
        errors.push(`${label} cannot exceed ${el.max}.`);
      }
    });
    return [...new Set(errors)];
  }

  function assertFiniteResult(out) {
    const metrics = out?.metrics || [];
    const materials = out?.materials || [];
    const bad =
      metrics.some((x) => !Number.isFinite(x.value)) ||
      materials.some(
        (x) => !Number.isFinite(x.exact) || !Number.isFinite(x.order),
      );
    if (bad) throw new Error("A calculation returned a non-finite result.");
  }

  function compareBaseline(actual, baseline, tolerance) {
    const tol = tolerance == null ? 1e-9 : tolerance;
    const rows = [];
    const aMetrics = actual?.metrics || [];
    const bMetrics = baseline?.metrics || [];
    const n = Math.max(aMetrics.length, bMetrics.length);
    for (let i = 0; i < n; i++) {
      const a = aMetrics[i];
      const b = bMetrics[i];
      const delta =
        a && b ? Math.abs(Number(a.value) - Number(b.value)) : Infinity;
      rows.push({
        label: a?.label || b?.label || `metric[${i}]`,
        actual: a?.value,
        baseline: b?.value,
        match: Number.isFinite(delta) && delta <= tol,
        delta,
      });
    }
    return {
      ok: rows.every((r) => r.match),
      rows,
    };
  }

  global.StructuraValidation = {
    validateRequiredFields,
    assertFiniteResult,
    compareBaseline,
  };
})(typeof window !== "undefined" ? window : globalThis);
