/**
 * Migrate Stage-1 standalone calculator HTML pages onto the STRUCTURA framework.
 * Preserves calculator(v) and updateDiagram() bodies; rewires shared shell/report.
 *
 * Usage: node public/material-calculators/qa/migrate-calculators-to-framework.js set01
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CALC_DIR = path.join(ROOT, "calculators");

const SETS = {
  set01: [
    {
      id: "foundationExcavation",
      title: "Foundation Excavation Material Calculator",
      category: "Foundations",
      code: "SA-MAT-1-2-1",
    },
    {
      id: "randomRubble",
      title: "Random Rubble Foundation Wall Material Calculator",
      category: "Foundations",
      code: "SA-MAT-1-3",
    },
    {
      id: "stripFooting",
      title: "Strip Footing Material Calculator",
      category: "Foundations",
      code: "SA-MAT-1-6-7",
    },
    {
      id: "padFooting",
      title: "Pad Footing Material Calculator",
      category: "Foundations",
      code: "SA-MAT-1-6-8",
    },
    {
      id: "groundBeam",
      title: "Ground Beam Material Calculator",
      category: "Foundations",
      code: "SA-MAT-1-6-9",
    },
    {
      id: "foundationRebar",
      title: "Foundation Reinforcement Material Calculator",
      category: "Foundations",
      code: "SA-MAT-1-7",
    },
  ],
};

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

function markProfileBanner(html) {
  if (html.includes('id="profileBanner"')) return html;
  return html.replace(
    /<div class="profile">([\s\S]*?)<\/div>/,
    '<div class="profile" id="profileBanner">$1</div>',
  );
}

function markFrameworkBody(html) {
  return html.replace(
    /<body([^>]*)>/i,
    (match, attrs) => {
      if (/data-framework=/.test(attrs)) return match;
      return `<body${attrs} data-framework="structura-v1">`;
    },
  );
}

function updateStatusPill(html) {
  return html.replace(
    />Verified working route</g,
    ">Framework calculator</",
  );
}

function injectScripts(html) {
  if (html.includes("structura-framework-boot.js")) return html;
  const tags = SHARED_SCRIPTS.map(
    (name) => `<script src="../js/${name}"></script>`,
  ).join("\n");
  return html.replace(/<script>/i, `${tags}\n<script>`);
}

function exposeGlobals(html) {
  // Ensure page helpers remain available to the bootstrap adapter.
  let out = html;
  if (!out.includes("window.calculate = calculate")) {
    out = out.replace(
      /function calculate\(\)\{/,
      "function calculate(){",
    );
    out = out.replace(
      /byId\('calculate'\)\.addEventListener/,
      [
        "window.updateDiagram = updateDiagram;",
        "window.values = values;",
        "window.validate = validate;",
        "window.calculate = calculate;",
        "window.resetForm = resetForm;",
        "byId('calculate').addEventListener",
      ].join("\n"),
    );
  }
  return out;
}

function rewirePrintAndBoot(html, meta) {
  const bootBlock = `
StructuraFramework.boot({
  meta: ${JSON.stringify(meta, null, 2)},
  getAssumptions(){
    const assumption = document.querySelector('.assumption');
    const list = [];
    if(assumption) list.push(assumption.textContent.replace(/\\s+/g,' ').trim());
    if(typeof mixNote !== 'undefined') list.push(mixNote);
    list.push(StructuraCountry.getActive().specificationProfile);
    return [...new Set(list.filter(Boolean))];
  }
});
`.trim();

  let out = html.replace(
    /byId\('print'\)\.addEventListener\('click',\(\)=>window\.print\(\)\);/,
    "/* print rewired by StructuraFramework.boot */",
  );

  if (!out.includes("StructuraFramework.boot({")) {
    const needle = "updateDiagram();calculate();setTimeout(updateQA,100);";
    const idx = out.lastIndexOf(needle);
    if (idx >= 0) {
      // Avoid String.replace $-substitutions in bootBlock contents.
      out =
        out.slice(0, idx) +
        `${bootBlock}\n${needle}` +
        out.slice(idx + needle.length);
    }
  }
  return out;
}

function fillDataFieldAttrs(html) {
  // Convert data-field="" on inputs/selects that already have ids into data-field="id".
  return html.replace(
    /<(input|select)\b([^>]*?)\bid="([^"]+)"([^>]*?)>/gi,
    (full, tag, pre, id, post) => {
      const attrs = `${pre} id="${id}"${post}`;
      if (/data-field="[^"]+"/.test(attrs)) {
        return `<${tag}${attrs.replace(/data-field=""/, `data-field="${id}"`)}>`;
      }
      if (/data-field=""/.test(full)) {
        return full.replace(/data-field=""/, `data-field="${id}"`);
      }
      return full;
    },
  );
}

function migrateOne(meta) {
  const file = path.join(CALC_DIR, `${meta.id}.html`);
  const original = fs.readFileSync(file, "utf8");
  if (original.includes('data-framework="structura-v1"') && original.includes("StructuraFramework.boot")) {
    return { id: meta.id, skipped: true, reason: "already migrated" };
  }

  // Capture baseline metrics from formula via browserless extraction is done separately.
  let html = original;
  html = stripPrintMedia(html);
  html = ensureReportCss(html);
  html = markProfileBanner(html);
  html = markFrameworkBody(html);
  html = updateStatusPill(html);
  html = fillDataFieldAttrs(html);
  html = injectScripts(html);
  html = exposeGlobals(html);
  html = rewirePrintAndBoot(html, {
    id: meta.id,
    title: meta.title,
    category: meta.category,
    version: "1.0",
    printOrientation: "portrait",
    code: meta.code,
  });

  // Safety: formulas must remain present.
  if (!html.includes("function calculator(") || !html.includes("function updateDiagram(")) {
    throw new Error(`${meta.id}: formula or SVG function missing after migrate`);
  }

  fs.writeFileSync(file, html);
  return { id: meta.id, skipped: false, bytes: html.length };
}

function main() {
  const setName = process.argv[2] || "set01";
  const list = SETS[setName];
  if (!list) {
    console.error(`Unknown set ${setName}. Available: ${Object.keys(SETS).join(", ")}`);
    process.exit(1);
  }
  const results = list.map(migrateOne);
  console.log(JSON.stringify({ set: setName, results }, null, 2));
}

main();
