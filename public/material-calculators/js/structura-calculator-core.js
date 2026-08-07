/**
 * STRUCTURA calculator core utilities.
 * Shared UI helpers used by framework calculators.
 */
(function (global) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function fmt(x) {
    if (!Number.isFinite(Number(x))) return "—";
    const n = Number(x);
    if (Math.abs(n) >= 1000) {
      return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
    if (Math.abs(n) >= 100) {
      return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
    if (Math.abs(n) >= 10) {
      return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }

  function roundTo(x, inc) {
    if (!Number.isFinite(x) || x <= 0) return 0;
    return Math.ceil((x - 1e-10) / inc) * inc;
  }

  function m(label, value, unit) {
    return { label, value: Number(value), unit };
  }

  function q(label, exact, unit, increment) {
    return {
      label,
      exact: Number(exact),
      order: roundTo(Number(exact), increment),
      unit,
    };
  }

  function result(metrics, materials, notes) {
    return { metrics, materials, notes };
  }

  function readFields(root) {
    const scope = root || document;
    const o = {};
    scope.querySelectorAll("[data-field]").forEach((el) => {
      const key = el.id || el.getAttribute("data-field");
      if (!key) return;
      o[key] = el.type === "number" ? Number(el.value) : el.value;
    });
    return o;
  }

  function resetFields(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-field]").forEach((el) => {
      if (el.dataset.default !== undefined) el.value = el.dataset.default;
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
    );
  }

  function bindLiveRecalc(handler, options) {
    const opts = options || {};
    const liveId = opts.liveCheckboxId || "live";
    document.querySelectorAll("[data-field]").forEach((el) => {
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, () => {
        const live = byId(liveId);
        if (!live || live.checked) handler();
        else if (typeof opts.onInputOnly === "function") opts.onInputOnly();
      });
    });
  }

  function markEmbeddedChrome() {
    try {
      if (window.self !== window.top) {
        document.documentElement.classList.add("in-frame");
      }
    } catch (_) {
      document.documentElement.classList.add("in-frame");
    }
  }

  global.StructuraCore = {
    byId,
    fmt,
    roundTo,
    m,
    q,
    result,
    readFields,
    resetFields,
    escapeHtml,
    bindLiveRecalc,
    markEmbeddedChrome,
  };
})(typeof window !== "undefined" ? window : globalThis);
