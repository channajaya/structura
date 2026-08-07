/**
 * STRUCTURA country / specification profile service.
 * Language remains independent of country (see structura-i18n.js).
 */
(function (global) {
  "use strict";

  const PROFILES = {
    LK: {
      countryCode: "LK",
      countryName: "Sri Lanka",
      flag: "🇱🇰",
      currency: { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
      measurement: "metric",
      unitSystemLabel: "Metric inputs",
      cementBagKg: 50,
      cementDensityKgPerM3: 1440,
      mortarDryFactor: 1.33,
      defaults: {
        brickL: 215,
        brickH: 65,
        brickW: 102.5,
        joint: 10,
        waste: 5,
        cementPart: 1,
        sandPart: 6,
      },
      specificationProfile:
        "Metric product data with editable brick and mortar assumptions.",
      procurementDefaults:
        "Order quantities use rounded procurement increments; confirm supplier pack sizes.",
    },
    GB: {
      countryCode: "GB",
      countryName: "United Kingdom",
      flag: "🇬🇧",
      currency: { code: "GBP", symbol: "£", name: "Pound Sterling" },
      measurement: "metric",
      unitSystemLabel: "Metric inputs",
      cementBagKg: 25,
      cementDensityKgPerM3: 1440,
      mortarDryFactor: 1.33,
      defaults: {
        brickL: 215,
        brickH: 65,
        brickW: 102.5,
        joint: 10,
        waste: 5,
        cementPart: 1,
        sandPart: 6,
      },
      specificationProfile:
        "UK metric brick modules; confirm manufacturer brick and bag sizes.",
      procurementDefaults:
        "Prefer supplier pack multiples; cement often supplied in 25 kg bags.",
    },
    AU: {
      countryCode: "AU",
      countryName: "Australia",
      flag: "🇦🇺",
      currency: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
      measurement: "metric",
      unitSystemLabel: "Metric inputs",
      cementBagKg: 20,
      cementDensityKgPerM3: 1440,
      mortarDryFactor: 1.33,
      defaults: {
        brickL: 230,
        brickH: 76,
        brickW: 110,
        joint: 10,
        waste: 5,
        cementPart: 1,
        sandPart: 6,
      },
      specificationProfile:
        "Australasian metric brick modules; edit for project product data.",
      procurementDefaults:
        "Confirm brick modular size and cement bag mass with local suppliers.",
    },
    US: {
      countryCode: "US",
      countryName: "United States",
      flag: "🇺🇸",
      currency: { code: "USD", symbol: "$", name: "US Dollar" },
      measurement: "metric",
      unitSystemLabel: "Metric inputs (project override)",
      cementBagKg: 42.6,
      cementDensityKgPerM3: 1505,
      mortarDryFactor: 1.33,
      defaults: {
        brickL: 203,
        brickH: 68,
        brickW: 102,
        joint: 10,
        waste: 5,
        cementPart: 1,
        sandPart: 6,
      },
      specificationProfile:
        "Metric modelling profile for US projects; convert imperial product data as required.",
      procurementDefaults:
        "Convert supplier pack units before ordering; values remain indicative.",
    },
  };

  const STORAGE_KEY = "structura.countryCode";
  let activeCode = "LK";

  function listCountries() {
    return Object.values(PROFILES).map((p) => ({
      countryCode: p.countryCode,
      countryName: p.countryName,
      flag: p.flag,
      currency: p.currency.code,
      measurement: p.measurement,
    }));
  }

  function getProfile(code) {
    return PROFILES[code] || PROFILES.LK;
  }

  function getActive() {
    return getProfile(activeCode);
  }

  function setCountry(code, options) {
    const next = getProfile(code);
    activeCode = next.countryCode;
    const opts = options || {};
    if (opts.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, activeCode);
      } catch (_) {
        /* ignore */
      }
    }
    global.dispatchEvent(
      new CustomEvent("structura:countrychange", {
        detail: { profile: next },
      }),
    );
    return next;
  }

  function restore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && PROFILES[saved]) activeCode = saved;
    } catch (_) {
      /* ignore */
    }
    return getActive();
  }

  function profileSummary(profile) {
    const p = profile || getActive();
    return `${p.flag} ${p.countryName} · ${p.unitSystemLabel} · Editable assumptions · Framework calculator`;
  }

  function toReportBlock(profile) {
    const p = profile || getActive();
    return {
      countryCode: p.countryCode,
      countryName: p.countryName,
      currency: `${p.currency.name} (${p.currency.code})`,
      measurement: p.unitSystemLabel,
      specificationProfile: p.specificationProfile,
      procurementDefaults: p.procurementDefaults,
      materialAssumptions: {
        cementBagKg: p.cementBagKg,
        cementDensityKgPerM3: p.cementDensityKgPerM3,
        mortarDryFactor: p.mortarDryFactor,
        productDefaults: p.defaults,
      },
    };
  }

  restore();

  global.StructuraCountry = {
    listCountries,
    getProfile,
    getActive,
    setCountry,
    restore,
    profileSummary,
    toReportBlock,
    PROFILES,
  };
})(typeof window !== "undefined" ? window : globalThis);
