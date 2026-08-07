/**
 * STRUCTURA frontend API client (optional).
 * Basic client-side calculations do not require the backend.
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

  function buildPayload(adapter) {
    const calc = adapter || global.STRUCTURA_CALCULATOR;
    if (!calc) throw new Error("STRUCTURA_CALCULATOR adapter is not registered.");
    const meta = calc.meta || {};
    const project = calc.getProjectData ? calc.getProjectData() : {};
    const country =
      global.StructuraCountry?.getActive?.()?.countryCode || "LK";
    const language = global.StructuraI18n?.getLanguage?.() || "en";
    if (typeof calc.calculate === "function") calc.calculate();
    return {
      calculatorId: meta.id,
      calculatorVersion: meta.version || "1.0",
      projectId: project.projectId || null,
      country,
      language,
      inputs: calc.getInputs ? calc.getInputs() : {},
      results: calc.getResults ? calc.getResults() : null,
      assumptions: calc.getAssumptions ? calc.getAssumptions() : [],
      warnings: calc.getWarnings ? calc.getWarnings() : [],
      timestamp: new Date().toISOString(),
    };
  }

  function saveCalculation(adapter) {
    return request("/calculations", {
      method: "POST",
      body: JSON.stringify(buildPayload(adapter)),
    });
  }

  function getCalculation(id) {
    return request(`/calculations/${encodeURIComponent(id)}`);
  }

  function createReport(adapter) {
    return request("/reports", {
      method: "POST",
      body: JSON.stringify(buildPayload(adapter)),
    });
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
    buildPayload,
    saveCalculation,
    getCalculation,
    createReport,
    getProject,
    getRegion,
    getMaterialData,
  };
})(typeof window !== "undefined" ? window : globalThis);
