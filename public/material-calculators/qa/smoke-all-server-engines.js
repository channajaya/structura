const fs = require("fs");
const path = require("path");

const CALC_DIR = path.join(__dirname, "..", "calculators");

function defaultsFromHtml(html) {
  const map = {};
  for (const m of html.matchAll(/<input\b[^>]*>/gi)) {
    const tag = m[0];
    const id = (tag.match(/\bid="([^"]+)"/i) || [])[1];
    if (!id) continue;
    const value = (tag.match(/\bvalue="([^"]*)"/i) || [])[1];
    const def = (tag.match(/\bdata-default="([^"]*)"/i) || [])[1];
    const raw = value != null ? value : def;
    if (raw == null) continue;
    const n = Number(raw);
    map[id] = Number.isFinite(n) && raw !== "" ? n : raw;
  }
  for (const m of html.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi)) {
    const id = m[1];
    const body = m[2];
    const selected = body.match(/<option\b[^>]*\bselected\b[^>]*\bvalue="([^"]+)"/i);
    const any = body.match(/<option\b[^>]*\bvalue="([^"]+)"/i);
    const raw = selected ? selected[1] : any ? any[1] : null;
    if (raw == null) continue;
    const n = Number(raw);
    map[id] = Number.isFinite(n) && raw !== "" ? n : raw;
  }
  return map;
}

async function main() {
  const base = process.env.BASE_URL || "http://localhost:3000";
  const files = fs.readdirSync(CALC_DIR).filter((f) => f.endsWith(".html"));
  const rows = [];
  for (const file of files) {
    const id = file.replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(CALC_DIR, file), "utf8");
    if (html.includes("function calculator(")) {
      rows.push({ id, ok: false, error: "formula still in HTML" });
      continue;
    }
    const inputs = defaultsFromHtml(html);
    try {
      const res = await fetch(`${base}/api/calculations/compute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calculatorId: id, inputs }),
      });
      const data = await res.json();
      if (!res.ok) {
        rows.push({ id, ok: false, error: data.error || res.status, inputs });
      } else {
        rows.push({
          id,
          ok: true,
          metrics: data.results?.metrics?.length || 0,
          first: data.results?.metrics?.[0]?.value,
          source: data.source,
        });
      }
    } catch (err) {
      rows.push({ id, ok: false, error: String(err.message || err) });
    }
  }
  const failed = rows.filter((r) => !r.ok);
  const out = {
    total: rows.length,
    passed: rows.length - failed.length,
    failed: failed.length,
    rows,
  };
  fs.writeFileSync(
    path.join(__dirname, "server-engine-smoke.json"),
    JSON.stringify(out, null, 2),
  );
  console.log(JSON.stringify({ total: out.total, passed: out.passed, failed: out.failed, failures: failed }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main();
