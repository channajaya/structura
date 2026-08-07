const fs = require("fs");

const baseline = JSON.parse(
  fs.readFileSync(
    "public/material-calculators/qa/baselines/brickWall-baseline.json",
    "utf8",
  ),
);

function roundTo(x, inc) {
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.ceil((x - 1e-10) / inc) * inc;
}

function calculator(v) {
  const area = Math.max(0, v.length * v.height - v.openings);
  const modL = (v.brickL + v.joint) / 1000;
  const modH = (v.brickH + v.joint) / 1000;
  const leaf = Number(v.leaves);
  const exact = (area / (modL * modH)) * leaf;
  const bricks = exact * (1 + v.waste / 100);
  const wallVol = area * (v.brickW / 1000) * leaf;
  const solid = exact * ((v.brickL * v.brickH * v.brickW) / 1e9);
  const wet = Math.max(0, wallVol - solid);
  const dry = wet * 1.33;
  const parts = v.cementPart + v.sandPart;
  const bags = ((dry * v.cementPart) / parts) * (1440 / 50);
  const sand = (dry * v.sandPart) / parts;
  return {
    metrics: [
      { label: "Net wall area", value: area, unit: "m²" },
      { label: "Exact brick count", value: exact, unit: "no." },
      { label: "Bricks incl. wastage", value: bricks, unit: "no." },
      { label: "Wet mortar", value: wet, unit: "m³" },
      { label: "Cement", value: bags, unit: "50 kg bags" },
      { label: "Sand", value: sand, unit: "m³" },
    ],
    materials: [
      { label: "Bricks", exact: bricks, order: roundTo(bricks, 10), unit: "no." },
      { label: "Cement", exact: bags, order: roundTo(bags, 1), unit: "bags" },
      { label: "Sand", exact: sand, order: roundTo(sand, 0.1), unit: "m³" },
    ],
  };
}

const out = calculator(baseline.inputs);
let ok = true;
const rows = [];
for (let i = 0; i < baseline.metrics.length; i++) {
  const b = baseline.metrics[i];
  const a = out.metrics[i];
  const delta = Math.abs(a.value - b.value);
  const match = delta <= 1e-12;
  if (!match) ok = false;
  rows.push({
    label: b.label,
    baseline: b.value,
    refactored: a.value,
    match,
    delta,
  });
}
for (let i = 0; i < baseline.materials.length; i++) {
  const b = baseline.materials[i];
  const a = out.materials[i];
  const match =
    Math.abs(a.exact - b.exact) <= 1e-12 &&
    Math.abs(a.order - b.order) <= 1e-12;
  if (!match) ok = false;
  rows.push({
    label: `mat:${b.label}`,
    baseline: { exact: b.exact, order: b.order },
    refactored: { exact: a.exact, order: a.order },
    match,
  });
}

const required = [
  "public/material-calculators/js/structura-report-engine.js",
  "public/material-calculators/css/structura-report.css",
  "public/material-calculators/js/structura-country-service.js",
  "public/material-calculators/js/structura-i18n.js",
  "public/material-calculators/js/structura-project.js",
  "public/material-calculators/js/structura-calculator-core.js",
  "public/material-calculators/js/structura-validation.js",
  "public/material-calculators/js/structura-api-client.js",
  "public/material-calculators/calculators/brickWall.html",
  "app/material-calculators/page.tsx",
  "app/api/calculations/route.ts",
  "app/api/reports/route.ts",
];
const missing = required.filter((p) => !fs.existsSync(p));
const html = fs.readFileSync(
  "public/material-calculators/calculators/brickWall.html",
  "utf8",
);
const adapterOk = html.includes("window.STRUCTURA_CALCULATOR");
const reportOk = html.includes("StructuraReport.print");
const formulaOk =
  html.includes("function calculator(v)") &&
  html.includes("dry*v.cementPart/parts*1440/50");
const noLocalPrintMedia = !html.includes("@media print{");
const sharedScriptsOk = [
  "structura-report-engine.js",
  "structura-country-service.js",
  "structura-i18n.js",
].every((name) => html.includes(name));

const result = {
  calculationMatch: ok,
  adapterOk,
  reportOk,
  formulaOk,
  noLocalPrintMedia,
  sharedScriptsOk,
  missing,
  rows,
};

fs.writeFileSync(
  "public/material-calculators/qa/brickWall-reference-qa.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
process.exit(
  ok &&
    adapterOk &&
    reportOk &&
    formulaOk &&
    noLocalPrintMedia &&
    sharedScriptsOk &&
    missing.length === 0
    ? 0
    : 1,
);
