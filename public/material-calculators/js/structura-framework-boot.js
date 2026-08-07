/**
 * STRUCTURA framework bootstrap for Stage-1 calculator HTML pages.
 * Call StructuraFramework.boot({ meta, getAssumptions?, getCalculationSteps? })
 * after calculator()/updateDiagram()/calculate() exist in page scope.
 */
(function (global) {
  "use strict";

  const FRAMEWORK_CONTROLS_HTML = `
<section class="panel project-panel structura-framework-panel">
  <h2 data-i18n="ui.projectInfo">Project information</h2>
  <div class="project-grid">
    <div class="field"><label for="projectName">Project name</label><input data-project-field="projectName" id="projectName" type="text" placeholder="e.g. Residence — Block A"/></div>
    <div class="field"><label for="projectId">Project ID</label><input data-project-field="projectId" id="projectId" type="text" placeholder="Optional"/></div>
    <div class="field"><label for="client">Client</label><input data-project-field="client" id="client" type="text"/></div>
    <div class="field"><label for="location">Location</label><input data-project-field="location" id="location" type="text"/></div>
    <div class="field"><label for="preparedBy">Prepared by</label><input data-project-field="preparedBy" id="preparedBy" type="text"/></div>
    <div class="field"><label for="date">Date</label><input data-project-field="date" id="date" type="date"/></div>
  </div>
</section>
<div class="controls structura-framework-controls">
  <div class="field"><label for="countrySelect" data-i18n="ui.country">Country / specification profile</label><select id="countrySelect"></select></div>
  <div class="field"><label for="languageSelect" data-i18n="ui.language">Language</label><select id="languageSelect"></select></div>
</div>`.trim();

  const FRAMEWORK_CSS = `
.structura-framework-controls{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.structura-framework-controls .field label{display:block;font-size:11px;font-weight:760;margin-bottom:4px}
.structura-framework-controls select{width:100%;min-height:42px;border:1px solid #cbd5da;border-radius:7px;padding:8px 10px;background:#fff}
.structura-framework-panel{margin-bottom:12px}
.structura-framework-panel .project-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
html.in-frame .notice,html.in-frame .header,html.in-frame .crumb{display:none}
@media(max-width:820px){.structura-framework-panel .project-grid{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.structura-framework-controls,.structura-framework-panel .project-grid{grid-template-columns:1fr}}
`.trim();

  function ensureStyle() {
    if (document.getElementById("structura-framework-style")) return;
    const style = document.createElement("style");
    style.id = "structura-framework-style";
    style.textContent = FRAMEWORK_CSS;
    document.head.appendChild(style);
  }

  function ensureControls() {
    if (document.getElementById("countrySelect")) return;
    const profile = document.querySelector(".profile");
    const grid = document.querySelector("main .grid");
    const host = document.createElement("div");
    host.className = "structura-framework-host";
    host.innerHTML = FRAMEWORK_CONTROLS_HTML;
    if (profile && profile.parentNode) {
      profile.parentNode.insertBefore(host, profile);
    } else if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(host, grid);
    } else {
      document.querySelector("main .wrap")?.prepend(host);
    }
  }

  function collectInputMeta() {
    return [...document.querySelectorAll("[data-field]")].map((el) => {
      const unitEl = el
        .closest(".field")
        ?.querySelector(".unit");
      return {
        id: el.id,
        label: el.dataset.label || el.id,
        unit: unitEl ? unitEl.textContent.trim() : "",
      };
    });
  }

  function readAssumptionsFromDom() {
    const assumption = document.querySelector(".assumption");
    const text = assumption ? assumption.textContent.replace(/\s+/g, " ").trim() : "";
    const list = [];
    if (text) list.push(text);
    if (global.StructuraCountry?.getActive) {
      list.push(global.StructuraCountry.getActive().specificationProfile);
    }
    return list;
  }

  function populateSelectors() {
    const country = document.getElementById("countrySelect");
    const lang = document.getElementById("languageSelect");
    if (country && global.StructuraCountry) {
      country.innerHTML = global.StructuraCountry.listCountries()
        .map(
          (c) =>
            `<option value="${c.countryCode}">${c.flag} ${c.countryName}</option>`,
        )
        .join("");
      country.value = global.StructuraCountry.getActive().countryCode;
    }
    if (lang && global.StructuraI18n) {
      lang.innerHTML = global.StructuraI18n.listLanguages()
        .map((l) => `<option value="${l.code}">${l.label}</option>`)
        .join("");
      lang.value = global.StructuraI18n.getLanguage();
    }
  }

  function refreshProfileBanner() {
    const banner = document.getElementById("profileBanner") || document.querySelector(".profile");
    if (banner && global.StructuraCountry) {
      banner.id = "profileBanner";
      banner.textContent = global.StructuraCountry.profileSummary();
    }
  }

  function wireChrome(options) {
    ensureStyle();
    ensureControls();
    if (global.StructuraCore?.markEmbeddedChrome) {
      global.StructuraCore.markEmbeddedChrome();
    }
    if (global.StructuraProject?.bindAutoSave) {
      global.StructuraProject.bindAutoSave();
    }
    populateSelectors();
    refreshProfileBanner();
    if (global.StructuraI18n?.applyDom) global.StructuraI18n.applyDom();

    const country = document.getElementById("countrySelect");
    const language = document.getElementById("languageSelect");
    if (country) {
      country.addEventListener("change", (e) => {
        global.StructuraCountry.setCountry(e.target.value);
        refreshProfileBanner();
        if (typeof options.onCountryChange === "function") {
          options.onCountryChange(global.StructuraCountry.getActive());
        } else if (typeof global.calculate === "function") {
          global.calculate();
        }
      });
    }
    if (language) {
      language.addEventListener("change", (e) => {
        global.StructuraI18n.setLanguage(e.target.value);
      });
    }

    // Translate action button labels when i18n keys exist.
    const map = [
      ["calculate", "ui.calculate"],
      ["mobileCalc", "ui.calculate"],
      ["reset", "ui.reset"],
      ["mobileReset", "ui.reset"],
      ["print", "ui.print"],
    ];
    map.forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && !el.hasAttribute("data-i18n")) el.setAttribute("data-i18n", key);
    });
    if (global.StructuraI18n?.applyDom) global.StructuraI18n.applyDom();
  }

  function buildAdapter(options) {
    const meta = {
      version: "1.0",
      printOrientation: "portrait",
      category: "Foundations",
      ...(options.meta || {}),
    };
    if (!meta.id) {
      meta.id = document.body?.dataset?.calculatorId || "unknown";
    }
    if (!meta.title) {
      meta.title =
        document.querySelector("h1")?.textContent?.trim() || meta.id;
    }

    const inputMeta = collectInputMeta();

    return {
      meta,
      getProjectData() {
        return global.StructuraProject?.getProjectData?.() || {};
      },
      getInputs() {
        const valuesFn =
          typeof options.getInputs === "function"
            ? options.getInputs
            : typeof global.values === "function"
              ? global.values
              : () => global.StructuraCore.readFields();
        const v = valuesFn();
        return inputMeta.map((row) => {
          const raw = v[row.id];
          const el = document.getElementById(row.id);
          let display = raw;
          if (el?.tagName === "SELECT") {
            display = el.options[el.selectedIndex]?.text || raw;
          } else if (row.unit) {
            display = `${raw} ${row.unit}`;
          }
          return {
            id: row.id,
            label: row.label,
            value: raw,
            unit: row.unit,
            display,
          };
        });
      },
      calculate(opts) {
        if (typeof options.calculate === "function") return options.calculate(opts);
        if (typeof global.calculate === "function") return global.calculate(opts);
        return null;
      },
      getResults() {
        if (global.__lastResult) return global.__lastResult;
        this.calculate({ silent: true });
        return global.__lastResult || { metrics: [], materials: [], notes: [] };
      },
      getCalculationSteps() {
        if (typeof options.getCalculationSteps === "function") {
          return options.getCalculationSteps();
        }
        return (
          this.getResults()?.metrics || []
        ).map((m) => ({
          label: m.label,
          value: m.value,
          unit: m.unit,
        }));
      },
      getMaterialSchedule() {
        return this.getResults()?.materials || [];
      },
      getAssumptions() {
        if (typeof options.getAssumptions === "function") {
          return options.getAssumptions();
        }
        return readAssumptionsFromDom();
      },
      getWarnings() {
        if (typeof options.getWarnings === "function") {
          return options.getWarnings();
        }
        return global.__lastWarnings || [];
      },
      getSVG() {
        if (typeof options.getSVG === "function") return options.getSVG();
        return document.getElementById("diagramSvg");
      },
      reset() {
        if (typeof options.reset === "function") return options.reset();
        if (typeof global.resetForm === "function") return global.resetForm();
      },
    };
  }

  function defaultRender(out) {
    const byId = (id) => document.getElementById(id);
    const fmt = global.StructuraCore?.fmt || String;
    const metrics = byId("metricGrid");
    const body = byId("materialBody");
    const notes = byId("notes");
    const result = byId("result");
    if (metrics) {
      metrics.innerHTML = (out.metrics || [])
        .map(
          (x) =>
            `<div class="metric"><span>${x.label}</span><strong>${fmt(x.value)} <small>${x.unit}</small></strong></div>`,
        )
        .join("");
    }
    if (body) {
      body.innerHTML = (out.materials || [])
        .map(
          (x) =>
            `<tr><td>${x.label}</td><td>${fmt(x.exact)} ${x.unit}</td><td><strong>${fmt(x.order)} ${x.unit}</strong></td></tr>`,
        )
        .join("");
    }
    if (notes) {
      notes.innerHTML = (out.notes || []).map((n) => `<div>${n}</div>`).join("");
    }
    if (result) result.hidden = false;
    global.__lastResult = out;
    if (typeof global.updateQA === "function") global.updateQA();
    else {
      const qa = byId("qaStatus");
      if (qa) qa.textContent = "Server calculation successful.";
      document.body.dataset.qaStatus = "pass";
    }
  }

  function showError(items) {
    const box = document.getElementById("error");
    if (!box) return;
    box.innerHTML = (items || []).join("<br>");
    box.classList.toggle("show", !!(items && items.length));
    if (items && items.length) document.body.dataset.qaStatus = "fail";
  }

  function installServerCalculate(meta) {
    let calcSeq = 0;
    async function serverCalculate(options) {
      const silent = options && options.silent;
      const seq = ++calcSeq;
      try {
        if (typeof global.updateDiagram === "function") global.updateDiagram();
        const v =
          typeof global.values === "function"
            ? global.values()
            : global.StructuraCore.readFields();
        const errors =
          typeof global.validate === "function"
            ? global.validate(v)
            : global.StructuraValidation?.validateRequiredFields?.() || [];
        global.__lastWarnings = errors;
        if (errors.length) {
          if (!silent) showError(errors);
          return null;
        }
        if (!global.StructuraApi?.compute) {
          throw new Error("StructuraApi.compute is unavailable.");
        }
        const qa = document.getElementById("qaStatus");
        if (!silent && qa) qa.textContent = "Calculating on server…";
        const payload = await global.StructuraApi.compute(meta.id, v, {
          adapter: global.STRUCTURA_CALCULATOR,
        });
        if (seq !== calcSeq) return null;
        const out = payload.results;
        global.StructuraValidation?.assertFiniteResult?.(out);
        global.__lastResult = out;
        global.__lastSteps = payload.steps || [];
        global.__lastAssumptions = payload.assumptions || [];
        global.__lastWarnings = [];
        if (!silent) {
          showError([]);
          if (typeof global.render === "function") global.render(out);
          else defaultRender(out);
        }
        return out;
      } catch (err) {
        if (seq !== calcSeq) return null;
        const msg = err?.message || String(err);
        const offline = /Failed to fetch|NetworkError|Load failed/i.test(msg)
          ? "Server calculation unavailable. This calculator requires an online connection — formulas are not run in the browser."
          : msg;
        if (!silent) {
          showError([offline]);
          console.error(err);
        }
        const qa = document.getElementById("qaStatus");
        if (qa) qa.textContent = "Server calculation failed.";
        document.body.dataset.qaStatus = "fail";
        return null;
      }
    }

    global.__structureServerCalculate = serverCalculate;
    global.calculate = serverCalculate;

    ["calculate", "mobileCalc"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      clone.addEventListener("click", () => serverCalculate());
    });

    ["reset", "mobileReset"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      clone.addEventListener("click", () => {
        if (typeof global.resetForm === "function") global.resetForm();
        else {
          global.StructuraCore?.resetFields?.();
          serverCalculate();
        }
      });
    });

    document.querySelectorAll("[data-field]").forEach((el) => {
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, () => {
        if (typeof global.updateDiagram === "function") global.updateDiagram();
        const live = document.getElementById("live");
        if (!live || live.checked) serverCalculate();
      });
    });

    return serverCalculate;
  }

  function rewirePrint() {
    const printBtn = document.getElementById("print");
    if (!printBtn || !global.StructuraReport) return;
    const clone = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(clone, printBtn);
    clone.addEventListener("click", () => {
      global.StructuraReport.print(global.STRUCTURA_CALCULATOR);
    });
  }

  function normalizeMeta(meta) {
    const next = {
      version: "1.0",
      printOrientation: "portrait",
      execution: "server",
      ...(meta || {}),
    };
    if (!next.report) {
      next.report = {
        style: "minimal",
        includeSvg: false,
        includeInputs: false,
        includeSteps: false,
        includeCost: false,
        includeCountry: false,
        includeValidation: false,
      };
    }
    return next;
  }

  function boot(options) {
    const opts = options || {};
    opts.meta = normalizeMeta(opts.meta);
    wireChrome(opts);

    if (opts.meta.execution === "server") {
      installServerCalculate(opts.meta);
    }

    global.STRUCTURA_CALCULATOR = buildAdapter({
      ...opts,
      getCalculationSteps() {
        if (global.__lastSteps?.length) return global.__lastSteps;
        return (global.__lastResult?.metrics || []).map((m) => ({
          label: m.label,
          value: m.value,
          unit: m.unit,
        }));
      },
      getAssumptions() {
        if (typeof opts.getAssumptions === "function") return opts.getAssumptions();
        if (global.__lastAssumptions?.length) return global.__lastAssumptions;
        return readAssumptionsFromDom();
      },
      getRawInputs() {
        return typeof global.values === "function"
          ? global.values()
          : global.StructuraCore.readFields();
      },
    });

    rewirePrint();

    if (typeof global.calculate === "function") {
      try {
        Promise.resolve(global.calculate()).catch(() => {});
      } catch (_) {
        /* ignore boot-time calc errors */
      }
    }
    return global.STRUCTURA_CALCULATOR;
  }

  global.StructuraFramework = {
    boot,
    buildAdapter,
    ensureControls,
    installServerCalculate,
  };
})(typeof window !== "undefined" ? window : globalThis);
