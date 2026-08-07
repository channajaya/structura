const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "calculators");
const metas = {
  foundationExcavation: {
    id: "foundationExcavation",
    title: "Foundation Excavation Material Calculator",
    category: "Foundations",
    version: "1.0",
    printOrientation: "portrait",
    code: "SA-MAT-1-2-1",
  },
  randomRubble: {
    id: "randomRubble",
    title: "Random Rubble Foundation Wall Material Calculator",
    category: "Foundations",
    version: "1.0",
    printOrientation: "portrait",
    code: "SA-MAT-1-3",
  },
  stripFooting: {
    id: "stripFooting",
    title: "Strip Footing Material Calculator",
    category: "Foundations",
    version: "1.0",
    printOrientation: "portrait",
    code: "SA-MAT-1-6-7",
  },
  padFooting: {
    id: "padFooting",
    title: "Pad Footing Material Calculator",
    category: "Foundations",
    version: "1.0",
    printOrientation: "portrait",
    code: "SA-MAT-1-6-8",
  },
  groundBeam: {
    id: "groundBeam",
    title: "Ground Beam Material Calculator",
    category: "Foundations",
    version: "1.0",
    printOrientation: "portrait",
    code: "SA-MAT-1-6-9",
  },
  foundationRebar: {
    id: "foundationRebar",
    title: "Foundation Reinforcement Material Calculator",
    category: "Foundations",
    version: "1.0",
    printOrientation: "portrait",
    code: "SA-MAT-1-7",
  },
};

function bootBlock(meta) {
  return [
    "StructuraFramework.boot({",
    `  meta: ${JSON.stringify(meta)},`,
    "  getAssumptions(){",
    "    const assumption = document.querySelector('.assumption');",
    "    const list = [];",
    "    if(assumption) list.push(assumption.textContent.replace(/\\s+/g,' ').trim());",
    "    if(typeof mixNote !== 'undefined') list.push(mixNote);",
    "    list.push(StructuraCountry.getActive().specificationProfile);",
    "    return [...new Set(list.filter(Boolean))];",
    "  }",
    "});",
  ].join("\n");
}

for (const id of Object.keys(metas)) {
  const file = path.join(dir, `${id}.html`);
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("StructuraFramework.boot({")) {
    console.log(`${id}: already has boot`);
    continue;
  }
  const needle = "updateDiagram();calculate();setTimeout(updateQA,100);";
  const idx = html.lastIndexOf(needle);
  if (idx < 0) {
    console.log(`${id}: needle missing`);
    continue;
  }
  html =
    html.slice(0, idx) +
    `${bootBlock(metas[id])}\n${needle}` +
    html.slice(idx + needle.length);
  fs.writeFileSync(file, html);
  console.log(`${id}: boot injected`);
}
