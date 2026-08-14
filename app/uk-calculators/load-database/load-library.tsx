"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  Copy,
  Database,
  ExternalLink,
  FilePenLine,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Ruler,
  Save,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CUSTOM_LOADS_KEY,
  LOAD_PRESET_COUNT,
  LOAD_PRESETS,
  LOAD_TRANSFER_KEY,
  createCustomPreset,
  evaluatePreset,
  type EvaluatedComponent,
  type LoadCategory,
  type LoadPreset,
  type LoadVisualKind,
} from "@/lib/uk-calculators/load-database";
import {
  UK_NA_IMPOSED_GROUPS,
  UK_NA_IMPOSED_LOAD_COUNT,
  UK_NA_IMPOSED_LOADS,
  getUkNaImposedLoad,
  resolveUkNaImposedLoad,
} from "@/lib/uk-calculators/uk-na-imposed-loads";

const categories = ["All", "Roofs", "Floors", "Walls", "Ceilings", "Openings", "Imposed loads"] as const;
type CategoryFilter = (typeof categories)[number];

const fmt = (value: number, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : "-";
const originClass = (origin: LoadPreset["origin"]) => origin.toLowerCase().replaceAll(" ", "-");

const layerColours: Record<LoadVisualKind, { top: string; side: string; stroke: string }> = {
  tile: { top: "#a7adb0", side: "#6e777c", stroke: "#535d62" },
  carpet: { top: "#c58b51", side: "#8f6037", stroke: "#76502f" },
  timber: { top: "#d9a55f", side: "#a67438", stroke: "#805929" },
  board: { top: "#c7ad80", side: "#8e7650", stroke: "#705c3e" },
  gypsum: { top: "#e9e5dc", side: "#beb8aa", stroke: "#918b80" },
  concrete: { top: "#aab1b5", side: "#747d82", stroke: "#596267" },
  masonry: { top: "#c8785d", side: "#96503a", stroke: "#7c412f" },
  insulation: { top: "#e8c95d", side: "#b99b34", stroke: "#947a27" },
  membrane: { top: "#43515c", side: "#25313a", stroke: "#17232c" },
  metal: { top: "#7ba6bc", side: "#4f788c", stroke: "#345c70" },
  glass: { top: "#9fdbe5", side: "#5daab9", stroke: "#3a8392" },
  soil: { top: "#778f54", side: "#50673a", stroke: "#3f522e" },
  load: { top: "#e87524", side: "#b94f0c", stroke: "#9c420a" },
};

function wrapLabel(label: string, max = 29) {
  const words = label.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function SvgLabel({ component, x, y, anchor }: { component: EvaluatedComponent; x: number; y: number; anchor: "start" | "end" }) {
  const lines = wrapLabel(component.label);
  return (
    <text x={x} y={y} textAnchor={anchor} className="ld-svg-label">
      {lines.map((line, index) => <tspan key={line} x={x} dy={index === 0 ? 0 : 14}>{line}</tspan>)}
      <tspan x={x} dy="15" className="ld-svg-value">{component.valueKnM2.toFixed(3)} kN/m2</tspan>
    </text>
  );
}

function PlanAssembly({ components }: { components: EvaluatedComponent[] }) {
  return (
    <g>
      {components.map((component, index) => {
        const y = 66 + index * 43;
        const left = index % 2 === 0;
        const colours = layerColours[component.visualKind ?? "board"];
        const labelX = left ? 24 : 916;
        const lineEnd = left ? 258 : 704;
        const contactX = left ? 335 : 626;
        return (
          <g key={component.id}>
            <polygon points={`300,${y} 632,${y} 688,${y + 25} 356,${y + 25}`} fill={colours.top} stroke={colours.stroke} strokeWidth="1.3" />
            <polygon points={`356,${y + 25} 688,${y + 25} 688,${y + 35} 356,${y + 35}`} fill={colours.side} stroke={colours.stroke} strokeWidth="1.1" />
            <line x1={contactX} y1={y + 13} x2={lineEnd} y2={y + 13} className="ld-svg-leader" />
            <line x1={lineEnd} y1={y + 13} x2={left ? 220 : 742} y2={y + 13} className="ld-svg-leader" />
            <SvgLabel component={component} x={labelX} y={y + 3} anchor={left ? "start" : "end"} />
          </g>
        );
      })}
    </g>
  );
}

function RoofAssembly({ components }: { components: EvaluatedComponent[] }) {
  return (
    <g>
      {components.map((component, index) => {
        const y = 70 + index * 42;
        const left = index % 2 === 0;
        const colours = layerColours[component.visualKind ?? "board"];
        const labelX = left ? 24 : 916;
        const lineEnd = left ? 254 : 706;
        const contactX = left ? 340 : 625;
        return (
          <g key={component.id}>
            <polygon points={`320,${y + 25} 612,${y - 24} 684,${y - 10} 392,${y + 40}`} fill={colours.top} stroke={colours.stroke} strokeWidth="1.3" />
            <polygon points={`392,${y + 40} 684,${y - 10} 684,${y} 392,${y + 50}`} fill={colours.side} stroke={colours.stroke} strokeWidth="1.1" />
            <line x1={contactX} y1={y + 15} x2={lineEnd} y2={y + 15} className="ld-svg-leader" />
            <line x1={lineEnd} y1={y + 15} x2={left ? 220 : 742} y2={y + 15} className="ld-svg-leader" />
            <SvgLabel component={component} x={labelX} y={y + 5} anchor={left ? "start" : "end"} />
          </g>
        );
      })}
    </g>
  );
}

function WallAssembly({ components }: { components: EvaluatedComponent[] }) {
  const width = Math.min(74, 360 / Math.max(components.length, 1));
  const start = 480 - components.length * width / 2;
  return (
    <g>
      {components.map((component, index) => {
        const x = start + index * width;
        const left = index % 2 === 0;
        const labelY = 74 + index * 48;
        const colours = layerColours[component.visualKind ?? "masonry"];
        return (
          <g key={component.id}>
            <rect x={x} y="68" width={width - 5} height="272" fill={colours.top} stroke={colours.stroke} strokeWidth="1.3" />
            <line x1={x + width / 2} y1={labelY} x2={left ? 250 : 710} y2={labelY} className="ld-svg-leader" />
            <line x1={left ? 250 : 710} y1={labelY} x2={left ? 218 : 742} y2={labelY} className="ld-svg-leader" />
            <SvgLabel component={component} x={left ? 24 : 916} y={labelY - 10} anchor={left ? "start" : "end"} />
          </g>
        );
      })}
      <text x="480" y="371" textAnchor="middle" className="ld-svg-axis">EXTERNAL / SIDE A  →  INTERNAL / SIDE B</text>
    </g>
  );
}

function AssemblyGraphic({ preset, components, qk }: { preset: LoadPreset; components: EvaluatedComponent[]; qk: number }) {
  const permanent = components.filter((component) => component.action === "Gk");
  const qComponents = components.filter((component) => component.action === "Qk");
  const visualComponents = permanent.length ? permanent : qComponents;
  const isRoof = preset.category === "Roofs";
  const isWall = preset.outputBasis === "wall-face" || preset.category === "Openings";
  const visualTitle = isRoof ? "Exploded roof build-up" : isWall ? "Layered wall / opening build-up" : "Exploded floor / ceiling build-up";

  return (
    <div className="ld-graphic-card">
      <div className="ld-graphic-toolbar">
        <span><Layers3 size={16} /> {visualTitle}</span>
        <span>{preset.outputBasis === "wall-face" ? "Per m2 wall face" : "Per m2 horizontal plan"}</span>
      </div>
      <svg viewBox="0 0 940 410" role="img" aria-label={`Exploded load build-up for ${preset.name}`}>
        <defs>
          <pattern id={`grid-${preset.id}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#dfe8ee" strokeWidth="1" />
          </pattern>
          <marker id={`arrow-${preset.id}`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#e87524" />
          </marker>
        </defs>
        <rect width="940" height="410" fill={`url(#grid-${preset.id})`} />
        {qk > 0 && (
          <g>
            {[402, 480, 558].map((x) => <line key={x} x1={x} x2={x} y1="14" y2="48" stroke="#e87524" strokeWidth="2.5" markerEnd={`url(#arrow-${preset.id})`} />)}
            <text x="480" y="18" textAnchor="middle" className="ld-svg-q">IMPOSED AREA ACTION qk = {qk.toFixed(3)} kN/m2</text>
          </g>
        )}
        {isRoof ? <RoofAssembly components={visualComponents} /> : isWall ? <WallAssembly components={visualComponents} /> : <PlanAssembly components={visualComponents} />}
        {!permanent.length && <text x="480" y="388" textAnchor="middle" className="ld-svg-axis">CODE ACTION - NO PERMANENT BUILD-UP</text>}
      </svg>
      <div className="ld-graphic-caption"><span>Layer order follows the named construction build-up.</span><span>{permanent.length ? "Each layer callout is included in Gk." : "The callout is the applicable Qk action."}</span></div>
    </div>
  );
}

type EditorDraft = {
  id: string;
  name: string;
  category: LoadCategory;
  gk: number;
  qk: number;
  notes: string;
  outputBasis: LoadPreset["outputBasis"];
  ukNaImposedCode: string;
  concentratedKn?: number;
  storageHeightM: number;
  roomQkKnM2: number;
  roofPitchDeg: number;
};

function resolveEditorImposed(draft: EditorDraft): EditorDraft {
  const imposed = getUkNaImposedLoad(draft.ukNaImposedCode);
  if (!imposed) return { ...draft, concentratedKn: undefined };
  const resolved = resolveUkNaImposedLoad(imposed, {
    roomQkKnM2: draft.roomQkKnM2,
    storageHeightM: draft.storageHeightM,
    roofPitchDeg: draft.roofPitchDeg,
  });
  return { ...draft, qk: Number(resolved.qkKnM2.toFixed(3)), concentratedKn: resolved.concentratedKn };
}

function isStoredLoadPreset(value: unknown): value is LoadPreset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LoadPreset>;
  return candidate.custom === true
    && typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && typeof candidate.notes === "string"
    && (candidate.outputBasis === "plan-area" || candidate.outputBasis === "wall-face")
    && Array.isArray(candidate.components)
    && candidate.components.every((component) => Boolean(component) && typeof component.id === "string" && typeof component.label === "string" && (component.action === "Gk" || component.action === "Qk"));
}

export default function LoadLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [origin, setOrigin] = useState("All sources");
  const [customLoads, setCustomLoads] = useState<LoadPreset[]>([]);
  const [selectedId, setSelectedId] = useState("floor-timber-ceramic-tile");
  const [pitchDeg, setPitchDeg] = useState(35);
  const [wallHeightM, setWallHeightM] = useState(2.4);
  const [copyStatus, setCopyStatus] = useState("");
  const [transferStatus, setTransferStatus] = useState("");
  const [editor, setEditor] = useState<EditorDraft | null>(null);

  useEffect(() => {
    let savedLoads: LoadPreset[] = [];
    try {
      const saved = window.localStorage.getItem(CUSTOM_LOADS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) savedLoads = parsed.filter(isStoredLoadPreset);
      }
    } catch {}
    const update = window.setTimeout(() => setCustomLoads(savedLoads), 0);
    return () => window.clearTimeout(update);
  }, []);

  const allLoads = useMemo(() => [...LOAD_PRESETS, ...customLoads], [customLoads]);
  const selected = allLoads.find((preset) => preset.id === selectedId) ?? allLoads[0];
  const result = evaluatePreset(selected, selected.pitchDeg !== undefined ? pitchDeg : undefined);
  const selectedEditorImposed = editor ? getUkNaImposedLoad(editor.ukNaImposedCode) : undefined;
  const selectedEditorImposedResult = selectedEditorImposed && editor
    ? resolveUkNaImposedLoad(selectedEditorImposed, { roomQkKnM2: editor.roomQkKnM2, storageHeightM: editor.storageHeightM, roofPitchDeg: editor.roofPitchDeg })
    : undefined;

  const filtered = useMemo(() => {
    const normalQuery = query.trim().toLowerCase();
    return allLoads.filter((preset) => {
      const matchesCategory = category === "All" || preset.category === category;
      const matchesOrigin = origin === "All sources" || preset.origin === origin;
      const haystack = [preset.name, preset.category, preset.origin, preset.notes, ...(preset.tags ?? []), ...preset.components.map((component) => component.label)].join(" ").toLowerCase();
      return matchesCategory && matchesOrigin && (!normalQuery || haystack.includes(normalQuery));
    });
  }, [allLoads, category, origin, query]);

  const persistCustomLoads = (loads: LoadPreset[]) => {
    setCustomLoads(loads);
    window.localStorage.setItem(CUSTOM_LOADS_KEY, JSON.stringify(loads));
  };

  const selectPreset = (preset: LoadPreset) => {
    setSelectedId(preset.id);
    setPitchDeg(preset.pitchDeg ?? 30);
    setEditor(null);
    setCopyStatus("");
    setTransferStatus("");
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopyStatus("Copied");
    window.setTimeout(() => setCopyStatus(""), 1800);
  };

  const copySelected = () => {
    const unit = selected.outputBasis === "wall-face" ? "kN/m2 wall face" : "kN/m2 plan";
    const componentLines = result.components.map((component) => `- ${component.label}: ${component.formula} = ${fmt(component.valueKnM2, 3)} ${unit} (${component.action})`);
    const lineLoad = selected.outputBasis === "wall-face" ? `Wall line load at ${fmt(wallHeightM)} m: ${fmt(result.gk * wallHeightM, 3)} kN/m` : "";
    void copyText([
      selected.name,
      `Basis: ${unit}`,
      ...componentLines,
      `Gk = ${fmt(result.gk, 3)} ${unit}`,
      `Imposed area qk = ${fmt(result.qk, 3)} ${unit}`,
      `Characteristic Gk + Qk = ${fmt(result.characteristic, 3)} ${unit}`,
      `ULS 6.10a = ${fmt(result.combinations.ulsA, 3)} ${unit}`,
      `ULS 6.10b = ${fmt(result.combinations.ulsB, 3)} ${unit}`,
      selected.concentratedKn !== undefined ? `Separate concentrated Qk = ${fmt(selected.concentratedKn, 2)} kN` : "",
      lineLoad,
      `Reference: ${selected.reference ?? "User-defined"}`,
    ].filter(Boolean).join("\n"));
  };

  const startEditor = () => {
    const suggestedCode = selected.ukNaImposedCode
      ?? (selected.category === "Roofs" ? "H" : selected.category === "Floors" && result.qk > 0 ? "A1" : "");
    const draft: EditorDraft = {
      id: selected.custom ? selected.id : `custom-${Date.now()}`,
      name: selected.custom ? selected.name : `${selected.name} - edited copy`,
      category: selected.category,
      gk: Number(result.gk.toFixed(3)),
      qk: Number(result.qk.toFixed(3)),
      notes: selected.notes,
      outputBasis: selected.outputBasis,
      ukNaImposedCode: suggestedCode,
      concentratedKn: selected.concentratedKn,
      storageHeightM: selected.storageHeightM ?? 2.4,
      roomQkKnM2: selected.roomQkKnM2 ?? 1.5,
      roofPitchDeg: selected.roofPitchDeg ?? (selected.pitchDeg !== undefined ? pitchDeg : 30),
    };
    setEditor(suggestedCode ? resolveEditorImposed(draft) : draft);
    window.setTimeout(() => document.querySelector(".ld-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const startNewEditor = () => {
    setEditor(resolveEditorImposed({
      id: `custom-${Date.now()}`,
      name: "New load build",
      category: "Floors",
      gk: 0,
      qk: 1.5,
      notes: "Add the permanent load from the selected construction build-up and confirm the exact occupancy.",
      outputBasis: "plan-area",
      ukNaImposedCode: "A1",
      storageHeightM: 2.4,
      roomQkKnM2: 1.5,
      roofPitchDeg: 30,
    }));
    window.setTimeout(() => document.querySelector(".ld-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const changeImposedCode = (code: string) => {
    if (!editor) return;
    setEditor(code ? resolveEditorImposed({ ...editor, ukNaImposedCode: code }) : { ...editor, ukNaImposedCode: "", concentratedKn: undefined });
  };

  const changeImposedInput = (changes: Partial<Pick<EditorDraft, "roomQkKnM2" | "storageHeightM" | "roofPitchDeg">>) => {
    if (!editor) return;
    setEditor(resolveEditorImposed({ ...editor, ...changes }));
  };

  const saveEditor = () => {
    if (!editor || !editor.name.trim()) return;
    const next = createCustomPreset(
      editor.id,
      editor.name.trim(),
      editor.category,
      editor.gk,
      editor.qk,
      editor.notes.trim(),
      editor.outputBasis,
      editor.ukNaImposedCode ? {
        code: editor.ukNaImposedCode,
        concentratedKn: editor.concentratedKn,
        storageHeightM: editor.storageHeightM,
        roomQkKnM2: editor.roomQkKnM2,
        roofPitchDeg: editor.roofPitchDeg,
      } : undefined,
    );
    persistCustomLoads([...customLoads.filter((item) => item.id !== editor.id), next]);
    setSelectedId(next.id);
    setEditor(null);
  };

  const deleteSelected = () => {
    if (!selected.custom) return;
    persistCustomLoads(customLoads.filter((item) => item.id !== selected.id));
    setSelectedId(LOAD_PRESETS[0].id);
    setEditor(null);
  };

  const useInCalculator = () => {
    if (selected.outputBasis !== "plan-area") return;
    window.localStorage.setItem(LOAD_TRANSFER_KEY, JSON.stringify({ name: selected.name, gk: result.gk, qk: result.qk, basis: selected.outputBasis, savedAt: new Date().toISOString() }));
    setTransferStatus("Ready in Load takedown");
  };

  return (
    <main className="ld-app">
      <header className="ld-toolbar">
        <div className="ld-toolbar-copy">
          <Link href="/uk-calculators" className="ld-back"><ArrowLeft size={15} /> UK calculator workspace</Link>
          <div className="ld-title-row"><Database size={19} /><div><h1>UK load assembly library</h1><p>Recognisable construction names, component build-ups and UK NA imposed actions.</p></div></div>
        </div>
        <div className="ld-toolbar-stats">
          <span><strong>{LOAD_PRESET_COUNT}</strong> built-in presets</span>
          <span><strong>{UK_NA_IMPOSED_LOAD_COUNT}</strong> UK NA imposed uses</span>
        </div>
      </header>

      <section className="ld-browser" aria-label="UK structural load database">
        <aside className="ld-library-rail">
          <div className="ld-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tile, carpet, AAC, roof..." aria-label="Search load database" /></div>
          <div className="ld-filter-row">
            <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} aria-label="Filter by category">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={origin} onChange={(event) => setOrigin(event.target.value)} aria-label="Filter by source">
              {["All sources", "Calculated assembly", "UK code reference", "Custom"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <button type="button" className="ld-new-load" onClick={startNewEditor}><Plus size={15} /> New load build + UK NA imposed load</button>
          <div className="ld-list-head"><span>{filtered.length} entries</span><span>Gk / qk</span></div>
          <div className="ld-load-list">
            {filtered.map((preset) => {
              const values = evaluatePreset(preset);
              return (
                <button key={preset.id} type="button" className={selected.id === preset.id ? "active" : undefined} onClick={() => selectPreset(preset)}>
                  <span className={`ld-origin-dot ${originClass(preset.origin)}`} />
                  <span className="ld-list-copy"><strong>{preset.name}</strong><small>{preset.category} · {preset.components.length} calculation rows</small></span>
                  <span className="ld-list-values"><strong>{fmt(values.gk)}</strong><small>{fmt(values.qk)}</small></span>
                </button>
              );
            })}
            {filtered.length === 0 && <div className="ld-empty">No assemblies match these filters.</div>}
          </div>
        </aside>

        <section className="ld-detail-panel">
          <header className="ld-detail-head">
            <div>
              <span className={`ld-source-chip ${originClass(selected.origin)}`}>{selected.origin}</span>
              <h2>{selected.name}</h2>
              <p>{selected.notes}</p>
            </div>
            <div className="ld-head-actions">
              <button type="button" onClick={copySelected}>{copyStatus ? <Check size={15} /> : <Copy size={15} />}{copyStatus || "Copy calculation"}</button>
              <button type="button" onClick={startEditor}><Pencil size={15} /> {selected.custom ? "Edit" : "Duplicate + edit"}</button>
              {selected.custom && <button type="button" className="danger" onClick={deleteSelected} aria-label="Delete custom load"><Trash2 size={15} /></button>}
            </div>
          </header>

          <div className="ld-detail-body">
            <AssemblyGraphic preset={selected} components={result.components} qk={result.qk} />

            <div className="ld-variable-row">
              {selected.pitchDeg !== undefined && <label><span><Ruler size={14} /> Roof pitch</span><strong>{fmt(pitchDeg, 0)}°</strong><input type="range" min="0" max="70" step="1" value={pitchDeg} onChange={(event) => setPitchDeg(Number(event.target.value))} /></label>}
              {selected.outputBasis === "wall-face" && <label><span><Ruler size={14} /> Supported height</span><strong>{fmt(wallHeightM, 2)} m</strong><input type="range" min="0.5" max="6" step="0.1" value={wallHeightM} onChange={(event) => setWallHeightM(Number(event.target.value))} /></label>}
            </div>

            <section className="ld-summary-band" aria-label="Calculated load summary">
              <div className="gk"><span>Permanent Gk</span><strong>{fmt(result.gk, 3)}</strong><small>kN/m2</small></div>
              <div className="qk"><span>Imposed qk</span><strong>{fmt(result.qk, 3)}</strong><small>kN/m2</small></div>
              <div><span>Gk + Qk</span><strong>{fmt(result.characteristic, 3)}</strong><small>kN/m2</small></div>
              <div><span>ULS 6.10a</span><strong>{fmt(result.combinations.ulsA, 3)}</strong><small>kN/m2</small></div>
              <div><span>ULS 6.10b</span><strong>{fmt(result.combinations.ulsB, 3)}</strong><small>kN/m2</small></div>
              {selected.concentratedKn !== undefined && <div className="point"><span>Separate point Qk</span><strong>{fmt(selected.concentratedKn, 2)}</strong><small>kN - not added to UDL</small></div>}
              {selected.outputBasis === "wall-face" && <div className="line"><span>Wall line Gk</span><strong>{fmt(result.gk * wallHeightM, 3)}</strong><small>kN/m</small></div>}
              <button type="button" className="ld-use-button" disabled={selected.outputBasis !== "plan-area"} onClick={useInCalculator}>{transferStatus ? <Check size={17} /> : <ArrowRight size={17} />}{transferStatus || "Use in Load takedown"}</button>
            </section>
            {transferStatus && <Link className="ld-open-calc" href="/uk-calculators#workbench">Open Load takedown calculator <ArrowRight size={14} /></Link>}

            <div className="ld-formula-card">
              <div className="ld-card-title"><div><span>Calculation trace</span><h3>Every dead-load layer and imposed action</h3></div><span className="ld-unit-chip">{selected.outputBasis === "wall-face" ? "kN/m2 wall face" : "kN/m2 plan"}</span></div>
              <div className="ld-component-list">
                {result.components.map((component, index) => (
                  <div className="ld-component" key={component.id}>
                    <span className={`ld-action ${component.action.toLowerCase()}`}>{component.action === "Qk" ? "qk" : "Gk"}</span>
                    <span className="ld-step">{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{component.label}</strong><code>{component.formula}</code>{component.note && <small>{component.note}</small>}</div>
                    <strong className="ld-component-value">{fmt(component.valueKnM2, 3)}</strong>
                  </div>
                ))}
              </div>
              <div className="ld-reference"><BookOpenCheck size={16} /><div><span>Source / assumption</span><p>{selected.reference}</p></div></div>
            </div>
          </div>

          {editor && (
            <section className="ld-editor" aria-label="Edit custom load">
              <div className="ld-editor-head"><div><FilePenLine size={18} /><span><strong>Device-local editable copy</strong><small>Changes are stored only in this browser.</small></span></div><button type="button" onClick={() => setEditor(null)}>Close</button></div>
              <div className="ld-editor-grid">
                <label className="wide"><span>Load name</span><input value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} /></label>
                <label><span>Category</span><select value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value as LoadCategory })}>{categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Gk (kN/m2)</span><input type="number" min="0" step="0.01" value={editor.gk} onChange={(event) => setEditor({ ...editor, gk: Number(event.target.value) })} /></label>
                <label><span>Area imposed qk (kN/m2)</span><input type="number" min="0" step="0.01" value={editor.qk} readOnly={Boolean(editor.ukNaImposedCode)} onChange={(event) => setEditor({ ...editor, qk: Number(event.target.value) })} /></label>
                <label className="wide ld-imposed-select"><span>UK NA imposed-load use</span><select value={editor.ukNaImposedCode} onChange={(event) => changeImposedCode(event.target.value)}><option value="">Manual / project-specific qk</option>{UK_NA_IMPOSED_GROUPS.map((group) => <optgroup key={group} label={group}>{UK_NA_IMPOSED_LOADS.filter((item) => item.group === group).map((item) => <option key={item.code} value={item.code}>{item.code} - {item.label}</option>)}</optgroup>)}</select></label>
                {selectedEditorImposed && selectedEditorImposedResult && (
                  <div className="wide ld-imposed-card">
                    <div className="ld-imposed-copy"><span className="ld-code-badge">{selectedEditorImposed.code}</span><div><strong>{selectedEditorImposed.label}</strong><p>{selectedEditorImposed.description}</p>{selectedEditorImposed.note && <small>{selectedEditorImposed.note}</small>}</div></div>
                    <div className="ld-imposed-values"><span><small>Area UDL qk</small><strong>{fmt(selectedEditorImposedResult.qkKnM2, 3)} kN/m2</strong><code>{selectedEditorImposedResult.formula}</code></span><span><small>Separate concentrated Qk</small><strong>{selectedEditorImposedResult.concentratedKn !== undefined ? `${fmt(selectedEditorImposedResult.concentratedKn, 2)} kN` : "Project-specific"}</strong><code>Checked separately - not added to qk</code></span></div>
                    {selectedEditorImposed.rule === "room-minimum" && <label><span>Room qk used for comparison (kN/m2)</span><input type="number" min="0" step="0.1" value={editor.roomQkKnM2} onChange={(event) => changeImposedInput({ roomQkKnM2: Number(event.target.value) })} /></label>}
                    {selectedEditorImposed.rule === "storage-height" && <label><span>Storage height (m)</span><input type="number" min="0" step="0.1" value={editor.storageHeightM} onChange={(event) => changeImposedInput({ storageHeightM: Number(event.target.value) })} /></label>}
                    {selectedEditorImposed.rule === "roof-pitch" && <label><span>Roof pitch from horizontal (degrees)</span><input type="number" min="0" max="90" step="1" value={editor.roofPitchDeg} onChange={(event) => changeImposedInput({ roofPitchDeg: Number(event.target.value) })} /></label>}
                    <p className="ld-imposed-source">Source: supplied NA to BS EN 1991-1-1:2002, Tables NA.2 to NA.7. Verify the current project-adopted edition and amendments.</p>
                  </div>
                )}
                <label className="wide"><span>Notes / scope</span><textarea rows={3} value={editor.notes} onChange={(event) => setEditor({ ...editor, notes: event.target.value })} /></label>
              </div>
              <div className="ld-editor-actions"><button type="button" onClick={saveEditor}><Save size={15} /> Save custom load</button><button type="button" onClick={() => setEditor(null)}><RotateCcw size={15} /> Cancel</button></div>
            </section>
          )}
        </section>
      </section>

      <section className="ld-standards">
        <div><ShieldAlert size={20} /><span><strong>Engineering use</strong><p>These are traceable starting assemblies, not completed design loads. Verify the chosen products, occupancy, concentrated actions, snow, wind, plant, combinations and full load path.</p></span></div>
        <nav aria-label="Research sources">
          <a href="https://knowledge.bsigroup.com/products/uk-national-annex-to-eurocode-1-actions-on-structures-general-actions-densities-self-weight-imposed-loads-for-buildings" target="_blank" rel="noreferrer">BSI UK NA <ExternalLink size={13} /></a>
          <a href="https://www.gov.uk/government/publications/structure-approved-document-a" target="_blank" rel="noreferrer">Approved Document A <ExternalLink size={13} /></a>
          <a href="https://www.steelconstruction.info/Design_codes_and_standards" target="_blank" rel="noreferrer">SCI design guidance <ExternalLink size={13} /></a>
        </nav>
      </section>
    </main>
  );
}
