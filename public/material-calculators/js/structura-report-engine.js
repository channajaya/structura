/**
 * STRUCTURA common report / print engine.
 *
 * StructuraReport.generate(window.STRUCTURA_CALCULATOR)
 * StructuraReport.print(window.STRUCTURA_CALCULATOR)
 *
 * Calculator pages must not independently construct a complete STRUCTURA PDF.
 */
(function (global) {
  "use strict";

  const ROOT_ID = "structura-report-root";

  function t(key, fallback) {
    return global.StructuraI18n?.t?.(key, fallback) || fallback || key;
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
    );
  }

  function fmt(x) {
    if (global.StructuraCore?.fmt) return global.StructuraCore.fmt(x);
    if (!Number.isFinite(Number(x))) return "—";
    return String(x);
  }

  function ensureAdapter(adapter) {
    const calc = adapter || global.STRUCTURA_CALCULATOR;
    if (!calc || !calc.meta) {
      throw new Error("STRUCTURA_CALCULATOR adapter is not registered.");
    }
    return calc;
  }

  function ensureFresh(calc) {
    // Prefer already-fetched server results. Callers should await
    // STRUCTURA_CALCULATOR.calculate() before print when using server engines.
    const existing = typeof calc.getResults === "function" ? calc.getResults() : null;
    if (existing?.metrics?.length) return;
    if (typeof calc.calculate === "function") {
      calc.calculate({ silent: true });
    }
  }

  function cloneLiveSvg(calc) {
    let source = null;
    if (typeof calc.getSVG === "function") source = calc.getSVG();
    if (!source) source = document.getElementById("diagramSvg");
    if (!source) return "";

    const clone = source.cloneNode(true);
    clone.removeAttribute("id");
    clone.setAttribute("preserveAspectRatio", "xMidYMid meet");

    clone.querySelectorAll("filter, feDropShadow, feGaussianBlur").forEach((n) => {
      n.remove();
    });
    clone.querySelectorAll("[filter]").forEach((el) => {
      el.removeAttribute("filter");
    });
    clone.querySelectorAll("[style]").forEach((el) => {
      const style = el.getAttribute("style") || "";
      if (/filter\s*:/i.test(style)) {
        el.setAttribute(
          "style",
          style
            .split(";")
            .filter((part) => part && !/filter\s*:/i.test(part))
            .join(";"),
        );
      }
    });

    return clone.outerHTML;
  }

  function rowsFromObject(obj) {
    if (!obj || typeof obj !== "object") return [];
    return Object.entries(obj).map(([k, v]) => ({
      label: k,
      value: v == null ? "—" : String(v),
    }));
  }

  function renderKv(rows) {
    if (!rows?.length) return "<p>—</p>";
    return `<table class="sr-kv"><tbody>${rows
      .map(
        (r) =>
          `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`,
      )
      .join("")}</tbody></table>`;
  }

  function renderMetrics(metrics) {
    return renderKv(
      (metrics || []).map((m) => ({
        label: m.label,
        value: `${fmt(m.value)} ${m.unit || ""}`.trim(),
      })),
    );
  }

  function renderInputs(inputs) {
    if (Array.isArray(inputs)) {
      return renderKv(
        inputs.map((row) => ({
          label: row.label || row.id,
          value:
            row.display != null
              ? row.display
              : `${row.value}${row.unit ? ` ${row.unit}` : ""}`,
        })),
      );
    }
    return renderKv(rowsFromObject(inputs));
  }

  function renderSteps(steps) {
    const list = steps || [];
    if (!list.length) return "<p>No calculation steps were provided.</p>";
    return `<ol class="sr-list">${list
      .map((s) => {
        if (typeof s === "string") return `<li>${esc(s)}</li>`;
        const expr = s.expression ? ` — ${s.expression}` : "";
        const val =
          s.value != null ? ` = ${fmt(s.value)}${s.unit ? ` ${s.unit}` : ""}` : "";
        return `<li><strong>${esc(s.label || "Step")}</strong>${esc(expr)}${esc(val)}</li>`;
      })
      .join("")}</ol>`;
  }

  function renderSchedule(materials) {
    const rows = materials || [];
    if (!rows.length) return "<p>—</p>";
    return `<table class="sr-table"><thead><tr><th>Material / item</th><th>Exact quantity</th><th>Recommended order</th></tr></thead><tbody>${rows
      .map((x) => {
        const exact = x.exact != null ? `${fmt(x.exact)} ${x.unit || ""}` : "—";
        const order = x.order != null ? `${fmt(x.order)} ${x.unit || ""}` : exact;
        return `<tr><td>${esc(x.label)}</td><td>${esc(exact.trim())}</td><td><strong>${esc(order.trim())}</strong></td></tr>`;
      })
      .join("")}</tbody></table>`;
  }

  function renderCost(cost) {
    if (!cost) {
      return "<p>No optional cost rates were entered for this run.</p>";
    }
    if (Array.isArray(cost)) {
      return `<table class="sr-table"><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>${cost
        .map(
          (c) =>
            `<tr><td>${esc(c.label)}</td><td>${esc(c.display || fmt(c.value))}</td></tr>`,
        )
        .join("")}</tbody></table>`;
    }
    return renderKv(rowsFromObject(cost));
  }

  function renderList(items) {
    const list = items || [];
    if (!list.length) return "<p>None recorded.</p>";
    return `<ul class="sr-list">${list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
  }

  function renderCountry(block) {
    if (!block) return "<p>—</p>";
    return renderKv([
      { label: "Country", value: `${block.countryName} (${block.countryCode})` },
      { label: "Currency", value: block.currency },
      { label: "Measurement", value: block.measurement },
      { label: "Specification profile", value: block.specificationProfile },
      { label: "Procurement defaults", value: block.procurementDefaults },
      {
        label: "Cement bag",
        value: `${block.materialAssumptions?.cementBagKg} kg`,
      },
      {
        label: "Cement density",
        value: `${block.materialAssumptions?.cementDensityKgPerM3} kg/m³`,
      },
      {
        label: "Mortar dry factor",
        value: String(block.materialAssumptions?.mortarDryFactor),
      },
    ]);
  }

  function buildHtml(calc) {
    ensureFresh(calc);
    const meta = calc.meta || {};
    const project = calc.getProjectData ? calc.getProjectData() : {};
    const inputs = calc.getInputs ? calc.getInputs() : {};
    const results = calc.getResults ? calc.getResults() : { metrics: [], materials: [], notes: [] };
    const steps = calc.getCalculationSteps ? calc.getCalculationSteps() : [];
    const schedule = calc.getMaterialSchedule
      ? calc.getMaterialSchedule()
      : results.materials || [];
    const assumptions = calc.getAssumptions ? calc.getAssumptions() : [];
    const warnings = calc.getWarnings ? calc.getWarnings() : [];
    const cost = calc.getCostSummary ? calc.getCostSummary() : null;
    const country =
      global.StructuraCountry?.toReportBlock?.() ||
      (calc.getCountryProfile ? calc.getCountryProfile() : null);
    const svg = cloneLiveSvg(calc);
    const generatedAt = new Date().toISOString();

    return `
      <header class="sr-cover">
        <div class="sr-brand">STRUCTURA<small>DIGITAL ENGINEERING OFFICE</small></div>
        <h1 class="sr-doc-title">${esc(t("report.docTitle", "Material Quantity Calculation"))}</h1>
        <p class="sr-doc-sub">${esc(meta.title || meta.id || "Calculator")}</p>
        <p class="sr-meta-line">${esc(meta.category || "")} · Version ${esc(meta.version || "1.0")} · Generated ${esc(generatedAt)}</p>
      </header>

      <section class="sr-section">
        <h2>${esc(t("report.projectInformation", "Project Information"))}</h2>
        ${renderKv([
          { label: "Project ID", value: project.projectId || "—" },
          { label: "Project name", value: project.projectName || "—" },
          { label: "Client", value: project.client || "—" },
          { label: "Location", value: project.location || "—" },
          { label: "Prepared by", value: project.preparedBy || "—" },
          { label: "Checked by", value: project.checkedBy || "—" },
          { label: "Date", value: project.date || "—" },
          { label: "Notes", value: project.notes || "—" },
        ])}
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.calculationSummary", "Calculation Summary"))}</h2>
        ${renderMetrics(results.metrics)}
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.liveSvg", "Live Vector SVG Quantity Model"))}</h2>
        <div class="sr-svg-wrap">${svg || "<p>No live SVG was available.</p>"}</div>
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.inputData", "Input Data"))}</h2>
        ${renderInputs(inputs)}
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.calculationDetails", "Calculation Details"))}</h2>
        ${renderSteps(steps)}
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.materialSchedule", "Material Quantity Schedule"))}</h2>
        ${renderSchedule(schedule)}
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.costSummary", "Optional Cost Summary"))}</h2>
        ${renderCost(cost)}
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.assumptions", "Assumptions and Allowances"))}</h2>
        ${renderList(assumptions)}
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.validation", "Validation Notes"))}</h2>
        ${
          warnings.length
            ? `<ul class="sr-list sr-warn">${warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`
            : "<p>No validation warnings for the current inputs.</p>"
        }
        ${
          Array.isArray(results.notes) && results.notes.length
            ? renderList(results.notes)
            : ""
        }
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.countryProfile", "Country / Specification Profile"))}</h2>
        ${renderCountry(country)}
      </section>

      <section class="sr-section">
        <h2>${esc(t("report.disclaimer", "Disclaimer"))}</h2>
        <p class="sr-disclaimer">${esc(
          t(
            "report.disclaimerText",
            "Educational quantity calculator. Technical design, specification, and procurement remain the user’s responsibility. Verify project product data before ordering materials.",
          ),
        )}</p>
      </section>

      <footer class="sr-footer">
        <span>STRUCTURA — Digital Engineering Office</span>
        <span>${esc(meta.id || "")} · ${esc(meta.version || "1.0")}</span>
      </footer>
    `;
  }

  function mount(html, orientation) {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.setAttribute("aria-hidden", "true");
      document.body.appendChild(root);
    }
    root.innerHTML = html;
    document.documentElement.classList.toggle(
      "structura-print-landscape",
      orientation === "landscape",
    );
    return root;
  }

  function generate(adapter) {
    const calc = ensureAdapter(adapter);
    const orientation = calc.meta?.printOrientation === "landscape" ? "landscape" : "portrait";
    const html = buildHtml(calc);
    const root = mount(html, orientation);
    return {
      html,
      root,
      orientation,
      meta: calc.meta,
      generatedAt: new Date().toISOString(),
    };
  }

  async function print(adapter) {
    const calc = ensureAdapter(adapter);
    if (typeof calc.calculate === "function") {
      await calc.calculate();
    }
    const report = generate(calc);
    const cleanup = () => {
      document.body.classList.remove("structura-printing");
      window.removeEventListener("afterprint", cleanup);
    };
    document.body.classList.add("structura-printing");
    window.addEventListener("afterprint", cleanup);
    // Allow DOM paint before invoking the print dialog.
    setTimeout(() => {
      try {
        window.print();
      } finally {
        setTimeout(cleanup, 500);
      }
    }, 50);
    return report;
  }

  function preview(adapter) {
    const report = generate(adapter);
    document.body.classList.add("structura-report-preview");
    return report;
  }

  global.StructuraReport = {
    generate,
    print,
    preview,
    cloneLiveSvg,
  };
})(typeof window !== "undefined" ? window : globalThis);
