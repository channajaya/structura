const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "calculators");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));

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
      if (depth === 0) return html.slice(start, end + 1);
    }
  }
  return null;
}

const report = [];
for (const f of files) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const id = f.replace(/\.html$/, "");
  const snippet = extractFunction(html, "calculator");
  report.push({
    id,
    found: !!snippet,
    len: snippet ? snippet.length : 0,
    mix: snippet ? snippet.includes("mixMaterials(") : false,
    fmt: snippet ? /\bfmt\(/.test(snippet) : false,
    hasServerMeta: html.includes("execution: 'server'") || html.includes('execution: "server"'),
    framework: html.includes("StructuraFramework.boot({"),
  });
}
console.log(JSON.stringify(report, null, 2));
console.log(
  "summary",
  report.filter((r) => r.found).length,
  "found;",
  report.filter((r) => r.hasServerMeta).length,
  "server;",
  report.filter((r) => r.framework).length,
  "framework",
);
