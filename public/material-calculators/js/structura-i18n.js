/**
 * STRUCTURA translation engine.
 * Language is independent of country / profile selection.
 */
(function (global) {
  "use strict";

  const STRINGS = {
    en: {
      "ui.projectInputs": "Project inputs",
      "ui.calculate": "Calculate materials",
      "ui.reset": "Reset",
      "ui.print": "Print / PDF",
      "ui.liveRecalc": "Recalculate when an input changes",
      "ui.results": "Calculated quantities",
      "ui.diagram": "Live SVG quantity diagram",
      "ui.country": "Country / specification profile",
      "ui.language": "Language",
      "ui.projectInfo": "Project information",
      "report.docTitle": "Material Quantity Calculation",
      "report.projectInformation": "Project Information",
      "report.calculationSummary": "Calculation Summary",
      "report.liveSvg": "Live Vector SVG Quantity Model",
      "report.inputData": "Input Data",
      "report.calculationDetails": "Calculation Details",
      "report.materialSchedule": "Material Quantity Schedule",
      "report.costSummary": "Optional Cost Summary",
      "report.assumptions": "Assumptions and Allowances",
      "report.validation": "Validation Notes",
      "report.countryProfile": "Country / Specification Profile",
      "report.disclaimer": "Disclaimer",
      "report.disclaimerText":
        "Educational quantity calculator. Technical design, specification, and procurement remain the user’s responsibility. Verify project product data before ordering materials.",
    },
    si: {
      "ui.projectInputs": "ව්‍යාපෘති ආදාන",
      "ui.calculate": "ද්‍රව්‍ය ගණනය කරන්න",
      "ui.reset": "යළි පිහිටුවන්න",
      "ui.print": "මුද්‍රණය / PDF",
      "ui.liveRecalc": "ආදානය වෙනස් වූ විට යළි ගණනය කරන්න",
      "ui.results": "ගණනය කළ ප්‍රමාණ",
      "ui.diagram": "සජීවී SVG ප්‍රමාණ රූප සටහන",
      "ui.country": "රට / පිරිවිතර පැතිකඩ",
      "ui.language": "භාෂාව",
      "ui.projectInfo": "ව්‍යාපෘති තොරතුරු",
      "report.docTitle": "ද්‍රව්‍ය ප්‍රමාණ ගණනය",
      "report.projectInformation": "ව්‍යාපෘති තොරතුරු",
      "report.calculationSummary": "ගණනය සාරාංශය",
      "report.liveSvg": "සජීවී දෛශික SVG ප්‍රමාණ ආකෘතිය",
      "report.inputData": "ආදාන දත්ත",
      "report.calculationDetails": "ගණනය විස්තර",
      "report.materialSchedule": "ද්‍රව්‍ය ප්‍රමාණ ලැයිස්තුව",
      "report.costSummary": "විකල්ප පිරිවැය සාරාංශය",
      "report.assumptions": "උපකල්පන සහ ඉඩ",
      "report.validation": "වලංගුකරණ සටහන්",
      "report.countryProfile": "රට / පිරිවිතර පැතිකඩ",
      "report.disclaimer": "වගකීම් ඉවත් කිරීම",
      "report.disclaimerText":
        "අධ්‍යාපනික ප්‍රමාණ ගණකයකි. තාක්ෂණික නිර්මාණය, පිරිවිතර සහ මිලදී ගැනීම් පරිශීලකයාගේ වගකීමකි.",
    },
  };

  const STORAGE_KEY = "structura.language";
  let language = "en";

  function t(key, fallback) {
    const pack = STRINGS[language] || STRINGS.en;
    return pack[key] || STRINGS.en[key] || fallback || key;
  }

  function getLanguage() {
    return language;
  }

  function setLanguage(code, options) {
    language = STRINGS[code] ? code : "en";
    const opts = options || {};
    if (opts.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch (_) {
        /* ignore */
      }
    }
    applyDom();
    global.dispatchEvent(
      new CustomEvent("structura:languagechange", {
        detail: { language },
      }),
    );
    return language;
  }

  function restore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && STRINGS[saved]) language = saved;
    } catch (_) {
      /* ignore */
    }
    return language;
  }

  function applyDom(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
  }

  function listLanguages() {
    return [
      { code: "en", label: "English" },
      { code: "si", label: "Sinhala" },
    ];
  }

  restore();

  global.StructuraI18n = {
    t,
    getLanguage,
    setLanguage,
    restore,
    applyDom,
    listLanguages,
    STRINGS,
  };
})(typeof window !== "undefined" ? window : globalThis);
