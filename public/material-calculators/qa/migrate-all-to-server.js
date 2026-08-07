/**
 * Bulk-migrate remaining Material Calculators:
 * - extract calculator(v) into server engines under lib/
 * - strip formulas from public HTML
 * - wire StructuraFramework.boot with execution:server + minimal report
 *
 * Usage: node public/material-calculators/qa/migrate-all-to-server.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../..");
const CALC_DIR = path.join(ROOT, "public/material-calculators/calculators");
const ENGINE_DIR = path.join(ROOT, "lib/material-calculators/engines");
const REGISTRY_PATH = path.join(ROOT, "lib/material-calculators/registry.ts");

const SHARED_SCRIPTS = [
  "structura-calculator-core.js",
  "structura-country-service.js",
  "structura-i18n.js",
  "structura-project.js",
  "structura-validation.js",
  "structura-api-client.js",
  "structura-report-engine.js",
  "structura-framework-boot.js",
];

const CATEGORY_BY_ID = {
  foundationExcavation: "Foundations",
  randomRubble: "Foundations",
  stripFooting: "Foundations",
  padFooting: "Foundations",
  groundBeam: "Foundations",
  foundationRebar: "Foundations",
  brickWall: "Masonry",
  blockWall: "Masonry",
  stoneMasonry: "Masonry",
  mortar: "Masonry",
  wallTies: "Masonry",
  lintels: "Masonry",
  generalConcrete: "Reinforced Concrete",
  columns: "Reinforced Concrete",
  beams: "Reinforced Concrete",
  slabs: "Reinforced Concrete",
  stairs: "Reinforced Concrete",
  reinforcement: "Reinforced Concrete",
  internalPlaster: "Finishes",
  externalRender: "Finishes",
  floorScreed: "Finishes",
  floorTiles: "Finishes",
  painting: "Finishes",
  waterproofing: "Finishes",
  roofGeometry: "Roofing",
  timberRoof: "Roofing",
  steelRoof: "Roofing",
  roofTiles: "Roofing",
  roofSheets: "Roofing",
  gutters: "Roofing",
  timberDoors: "Doors and Windows",
  aluminiumDoors: "Doors and Windows",
  timberWindows: "Doors and Windows",
  aluminiumWindows: "Doors and Windows",
  glazing: "Doors and Windows",
  ironmongery: "Doors and Windows",
};

function extractFunction(html, name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) return null;
  const brace = html.indexOf("{", start);
  let depth = 0;
  for (let end = brace; end < html.length; end++) {
    const ch = html[end];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start, end: end + 1, source: html.slice(start, end + 1) };
    }
  }
  return null;
}

function stripPrintMedia(html) {
  return html.replace(/@media\s+print\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, "");
}

function ensureReportCss(html) {
  if (html.includes("structura-report.css")) return html;
  return html.replace(
    /<\/title>/i,
    '</title>\n<link rel="stylesheet" href="../css/structura-report.css"/>',
  );
}

function ensureScripts(html) {
  if (html.includes("structura-framework-boot.js")) return html;
  const tags = SHARED_SCRIPTS.map((n) => `<script src="../js/${n}"></script>`).join(
    "\n",
  );
  return html.replace(/<script>/i, `${tags}\n<script>`);
}

function markBody(html) {
  return html.replace(/<body([^>]*)>/i, (full, attrs) => {
    let next = attrs;
    if (!/data-framework=/.test(next)) next += ' data-framework="structura-v1"';
    if (!/data-execution=/.test(next)) next += ' data-execution="server"';
    return `<body${next}>`;
  });
}

function markProfile(html) {
  if (html.includes('id="profileBanner"')) return html;
  return html.replace(
    /<div class="profile">([\s\S]*?)<\/div>/,
    '<div class="profile" id="profileBanner">$1</div>',
  );
}

function titleFromHtml(html, id) {
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return `${h1[1].trim()} Material Calculator`;
  return `${id} Material Calculator`;
}

function writeEngine(id, calculatorSource, title) {
  const category = CATEGORY_BY_ID[id] || "Material Calculators";
  const usesMix = calculatorSource.includes("mixMaterials(");
  const usesFmt = /\bfmt\(/.test(calculatorSource);
  const usesMixNote = calculatorSource.includes("mixNote");
  const usesLabelOf = calculatorSource.includes("labelOf(");
  const imports = [
    "coerceInputs",
    "m",
    "q",
    "result",
    "toEngineResult",
    usesMix ? "mixMaterials" : null,
    usesFmt ? "fmt" : null,
    usesMixNote ? "mixNote" : null,
    usesLabelOf ? "labelOf" : null,
    usesLabelOf ? "setLabelContext" : null,
  ].filter(Boolean);

  const computeBody = usesLabelOf
    ? `  const v = coerceInputs(raw);
  setLabelContext(v);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    ${JSON.stringify(title)},
  ]);`
    : `  const v = coerceInputs(raw);
  const out = calculator(v);
  return toEngineResult(out, [
    "Server-backed STRUCTURA material quantity calculation.",
    ${JSON.stringify(title)},
  ]);`;

  const content = `// @ts-nocheck
/**
 * AUTO-GENERATED server engine for ${id}.
 * Source formula extracted from Stage-1 calculator HTML — do not edit lightly.
 */
import {
  ${imports.join(",\n  ")},
} from "../helpers";
import type { CalculatorEngine, EngineResult, NumericInputs } from "../types";

${calculatorSource}

export function compute${id[0].toUpperCase()}${id.slice(1)}(
  raw: NumericInputs,
): EngineResult {
${computeBody}
}

export const ${id}Engine: CalculatorEngine = {
  id: ${JSON.stringify(id)},
  version: "1.0",
  title: ${JSON.stringify(title)},
  category: ${JSON.stringify(category)},
  compute: compute${id[0].toUpperCase()}${id.slice(1)},
};
`;

  fs.writeFileSync(path.join(ENGINE_DIR, `${id}.ts`), content);
}

function writeRegistry(ids) {
  const imports = ids
    .map((id) => `import { ${id}Engine } from "./engines/${id}";`)
    .join("\n");
  const entries = ids.map((id) => `  [${id}Engine.id]: ${id}Engine,`).join("\n");
  const content = `${imports}
import type { CalculatorEngine, EngineResult, NumericInputs } from "./types";

/**
 * Server-side calculator engine registry.
 * Only engines registered here are callable via /api/calculations/compute.
 */
const ENGINES: Record<string, CalculatorEngine> = {
${entries}
};

export function listEngineIds(): string[] {
  return Object.keys(ENGINES);
}

export function getEngine(calculatorId: string): CalculatorEngine | null {
  return ENGINES[calculatorId] || null;
}

export function computeCalculation(
  calculatorId: string,
  inputs: NumericInputs,
): EngineResult {
  const engine = getEngine(calculatorId);
  if (!engine) {
    throw new Error(\`Unknown calculatorId: \${calculatorId}\`);
  }
  return engine.compute(inputs);
}
`;
  fs.writeFileSync(REGISTRY_PATH, content);
}

function bootBlock(meta) {
  return [
    "StructuraFramework.boot({",
    `  meta: ${JSON.stringify(meta)},`,
    "  getAssumptions(){",
    "    if(window.__lastAssumptions && window.__lastAssumptions.length) return window.__lastAssumptions;",
    "    const assumption = document.querySelector('.assumption');",
    "    const list = [];",
    "    if(assumption) list.push(assumption.textContent.replace(/\\s+/g,' ').trim());",
    "    if(typeof mixNote !== 'undefined') list.push(mixNote);",
    "    if(window.StructuraCountry) list.push(StructuraCountry.getActive().specificationProfile);",
    "    return [...new Set(list.filter(Boolean))];",
    "  }",
    "});",
  ].join("\n");
}

function ensureExposeGlobals(html) {
  if (html.includes("window.calculate = calculate")) return html;
  const needle = "byId('calculate').addEventListener";
  const idx = html.indexOf(needle);
  if (idx < 0) return html;
  const inject = [
    "window.updateDiagram = updateDiagram;",
    "window.values = values;",
    "window.validate = typeof validate==='function'?validate:undefined;",
    "window.render = typeof render==='function'?render:undefined;",
    "window.calculate = calculate;",
    "window.resetForm = resetForm;",
    needle,
  ].join("\n");
  return html.slice(0, idx) + inject + html.slice(idx + needle.length);
}

function replaceCalculateWithProxy(html) {
  const extracted = extractFunction(html, "calculate");
  if (!extracted) return html;
  const proxy = `async function calculate(options){
  if(typeof window.__structureServerCalculate==='function'){
    return window.__structureServerCalculate(options);
  }
  throw new Error('Server calculation is not ready.');
}`;
  return html.slice(0, extracted.start) + proxy + html.slice(extracted.end);
}

function ensureBoot(html, meta) {
  if (html.includes("StructuraFramework.boot({")) {
    // Refresh meta object for existing boot calls.
    return html.replace(
      /StructuraFramework\.boot\(\{\s*meta:\s*\{[\s\S]*?\},/,
      `StructuraFramework.boot({\n  meta: ${JSON.stringify(meta)},`,
    );
  }
  const needle = "updateDiagram();calculate();setTimeout(updateQA,100);";
  const idx = html.lastIndexOf(needle);
  if (idx < 0) {
    // try without setTimeout
    const alt = "updateDiagram();calculate();";
    const altIdx = html.lastIndexOf(alt);
    if (altIdx < 0) throw new Error(`boot insertion point missing for ${meta.id}`);
    return (
      html.slice(0, altIdx) +
      `${bootBlock(meta)}\n${alt}` +
      html.slice(altIdx + alt.length)
    );
  }
  return (
    html.slice(0, idx) +
    `${bootBlock(meta)}\n${needle}` +
    html.slice(idx + needle.length)
  );
}

function migrateHtml(id, html, title) {
  const category = CATEGORY_BY_ID[id] || "Material Calculators";
  const meta = {
    id,
    title,
    category,
    version: "1.0",
    printOrientation: "portrait",
    execution: "server",
    report: {
      style: "minimal",
      includeSvg: false,
      includeInputs: false,
      includeSteps: false,
      includeCost: false,
      includeCountry: false,
      includeValidation: false,
    },
  };

  // Strip quantity formula from the browser bundle.
  const calcFn = extractFunction(html, "calculator");
  if (calcFn) {
    html =
      html.slice(0, calcFn.start) +
      "/* quantity formulas removed — executed via /api/calculations/compute */\n" +
      html.slice(calcFn.end);
  }

  html = stripPrintMedia(html);
  html = ensureReportCss(html);
  html = markBody(html);
  html = markProfile(html);
  html = ensureScripts(html);
  html = replaceCalculateWithProxy(html);
  html = ensureExposeGlobals(html);
  html = ensureBoot(html, meta);
  html = html.replace(/>Verified working route</g, ">Server-backed calculator<");
  html = html.replace(/>Framework calculator</g, ">Server-backed calculator<");
  html = html.replace(
    />Reference framework calculator</g,
    ">Server-backed calculator<",
  );

  // Print via shared engine (framework boot also rewires, but keep explicit).
  html = html.replace(
    /byId\('print'\)\.addEventListener\('click',\(\)=>window\.print\(\)\);/g,
    "/* print rewired by StructuraFramework.boot */",
  );

  if (html.includes("function calculator(")) {
    throw new Error(`${id}: calculator formula still present after strip`);
  }
  return html;
}

function main() {
  fs.mkdirSync(ENGINE_DIR, { recursive: true });
  const files = fs
    .readdirSync(CALC_DIR)
    .filter((f) => f.endsWith(".html"))
    .sort();

  const engineIds = [];
  const results = [];

  for (const file of files) {
    const id = file.replace(/\.html$/, "");
    const full = path.join(CALC_DIR, file);
    const html = fs.readFileSync(full, "utf8");
    const title = titleFromHtml(html, id);

    if (id === "brickWall") {
      // Keep curated engine + page, but ensure registry includes it.
      engineIds.push(id);
      results.push({ id, status: "kept-reference" });
      continue;
    }

    const calcFn = extractFunction(html, "calculator");
    if (!calcFn) {
      results.push({ id, status: "skip-no-formula" });
      continue;
    }

    writeEngine(id, calcFn.source, title);
    engineIds.push(id);
    const next = migrateHtml(id, html, title);
    fs.writeFileSync(full, next);
    results.push({ id, status: "migrated", bytes: next.length });
  }

  // Ensure brickWall engine remains in registry (already authored).
  if (!fs.existsSync(path.join(ENGINE_DIR, "brickWall.ts"))) {
    throw new Error("brickWall engine missing");
  }
  writeRegistry(engineIds);

  console.log(JSON.stringify({ count: results.length, results }, null, 2));
}

main();
