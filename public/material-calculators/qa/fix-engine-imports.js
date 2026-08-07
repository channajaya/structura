const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "../../../lib/material-calculators/engines");

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
  if (file === "brickWall.ts") continue;
  const full = path.join(dir, file);
  let src = fs.readFileSync(full, "utf8");
  const needsMixNote = src.includes("mixNote") && !src.includes("mixNote,") && !/import \{[^}]*\bmixNote\b/.test(src);
  const needsLabelOf = src.includes("labelOf(") && !/import \{[^}]*\blabelOf\b/.test(src);
  if (!needsMixNote && !needsLabelOf && !src.includes("setLabelContext")) {
    // may need setLabelContext in compute body
  }

  if (needsMixNote || needsLabelOf) {
    src = src.replace(/import \{\n([\s\S]*?)\n\} from "\.\.\/helpers";/, (m, body) => {
      const lines = body
        .split("\n")
        .map((l) => l.trim().replace(/,$/, ""))
        .filter(Boolean);
      if (needsMixNote && !lines.includes("mixNote")) lines.push("mixNote");
      if (needsLabelOf && !lines.includes("labelOf")) lines.push("labelOf");
      if (needsLabelOf && !lines.includes("setLabelContext")) lines.push("setLabelContext");
      return `import {\n  ${lines.join(",\n  ")},\n} from "../helpers";`;
    });
  }

  if (needsLabelOf && !src.includes("setLabelContext(v)")) {
    src = src.replace(
      /const v = coerceInputs\(raw\);\n  const out = calculator\(v\);/,
      "const v = coerceInputs(raw);\n  setLabelContext(v);\n  const out = calculator(v);",
    );
  }

  fs.writeFileSync(full, src);
  console.log(file, { needsMixNote, needsLabelOf });
}
