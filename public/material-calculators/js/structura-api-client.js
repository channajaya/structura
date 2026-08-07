/**
 * STRUCTURA frontend API client.
 * Quantity calculations for protected engines must run via /api/calculations/compute.
 */
(function (global) {
  "use strict";

  const DEFAULT_BASE = "/api";

  async function request(path, options) {
    const opts = options || {};
    const res = await fetch(`${opts.baseUrl || DEFAULT_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
      ...opts,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = { raw: text };
    }
    if (!res.ok) {
      const err = new Error(data?.error || `API ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function contextFromAdapter(adapter) {
    const calc = adapter || global.STRUCTURA_CALCULATOR;
    if (!calc) throw new Error("STRUCTURA_CALCULATOR adapter is not registered.");
    const meta = calc.meta || {};
    const project = calc.getProjectData ? calc.getProjectData() : {};
    return {
      calculatorId: meta.id,
      calculatorVersion: meta.version || "1.0",
      projectId: project.projectId || null,
      country: global.StructuraCountry?.getActive?.()?.countryCode || "LK",
      language: global.StructuraI18n?.getLanguage?.() || "en",
    };
  }

  function inputsFromAdapter(adapter) {
    const calc = adapter || global.STRUCTURA_CALCULATOR;
    if (typeof calc.getRawInputs === "function") return calc.getRawInputs();
    if (typeof calc.getInputs === "function") {
      const rows = calc.getInputs();
      if (Array.isArray(rows)) {
        const o = {};
        rows.forEach((row) => {
          o[row.id] = row.value;
        });
        return o;
      }
      return rows;
    }
    return global.StructuraCore?.readFields?.() || {};
  }

  /**
   * Server-side compute. No client-side formula fallback.
   */
  function compute(calculatorId, inputs, options) {
    const opts = options || {};
    const calc = opts.adapter || global.STRUCTURA_CALCULATOR;
    const ctx = calc ? contextFromAdapter(calc) : {};
    return request("/calculations/compute", {
      method: "POST",
      body: JSON.stringify({
        calculatorId: calculatorId || ctx.calculatorId,
        calculatorVersion: ctx.calculatorVersion,
        projectId: ctx.projectId,
        country: opts.country || ctx.country,
        language: opts.language || ctx.language,
        inputs: inputs || inputsFromAdapter(calc),
        timestamp: new Date().toISOString(),
      }),
    });
  }

  async function buildPayload(adapter) {
    const calc = adapter || global.STRUCTURA_CALCULATOR;
    const ctx = contextFromAdapter(calc);
    if (typeof calc.calculate === "function") {
      await calc.calculate();
    }
    return {
      ...ctx,
      inputs: inputsFromAdapter(calc),
      results: calc.getResults ? calc.getResults() : null,
      assumptions: calc.getAssumptions ? calc.getAssumptions() : [],
      warnings: calc.getWarnings ? calc.getWarnings() : [],
      timestamp: new Date().toISOString(),
    };
  }

  function saveCalculation(adapter) {
    return buildPayload(adapter).then((payload) =>
      request("/calculations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  }

  function getCalculation(id) {
    return request(`/calculations/${encodeURIComponent(id)}`);
  }

  function createReport(adapter) {
    return buildPayload(adapter).then((payload) =>
      request("/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  }

  function getProject(projectId) {
    return request(`/projects/${encodeURIComponent(projectId)}`);
  }

  function getRegion(countryCode) {
    return request(`/regions/${encodeURIComponent(countryCode)}`);
  }

  function getMaterialData(countryCode) {
    return request(`/material-data/${encodeURIComponent(countryCode)}`);
  }

  global.StructuraApi = {
    compute,
    buildPayload,
    saveCalculation,
    getCalculation,
    createReport,
    getProject,
    getRegion,
    getMaterialData,
  };
})(typeof window !== "undefined" ? window : globalThis);
