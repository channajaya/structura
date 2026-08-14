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
  LOAD_PRESETS,
  LOAD_TRANSFER_KEY,
  createCustomPreset,
  evaluatePreset,
  type LoadCategory,
  type LoadPreset,
} from "@/lib/uk-calculators/load-database";

const categories = ["All", "Roofs", "Floors", "Walls", "Ceilings", "Openings", "Imposed loads"] as const;
type CategoryFilter = (typeof categories)[number];

const fmt = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

const originClass = (origin: LoadPreset["origin"]) =>
  origin.toLowerCase().replaceAll(" ", "-");

function AssemblyGraphic({ preset, gk, qk }: { preset: LoadPreset; gk: number; qk: number }) {
  const total = Math.max(gk + qk, 0.01);
  const gWidth = 440 * gk / total;
  const qWidth = 440 * qk / total;
  const isRoof = preset.category === "Roofs";
  const isWall = preset.outputBasis === "wall-face";

  return (
    <div className="ld-graphic-card">
      <div className="ld-graphic-toolbar">
        <span><Layers3 size={15} /> Live load composition</span>
        <span>{preset.outputBasis === "wall-face" ? "Wall elevation" : "Plan-area basis"}</span>
      </div>
      <svg viewBox="0 0 620 280" role="img" aria-label={`Load composition graphic for ${preset.name}`}>
        <defs>
          <pattern id="ld-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#dbe6ee" strokeWidth="1" />
          </pattern>
          <marker id="ld-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#e87524" />
          </marker>
        </defs>
        <rect width="620" height="280" fill="url(#ld-grid)" />
        {isRoof ? (
          <g>
            <path d="M80 176 L310 62 L540 176" fill="#edf6fb" stroke="#244d6a" strokeWidth="5" strokeLinejoin="round" />
            <path d="M94 170 L310 63 L526 170" fill="none" stroke="#e87524" strokeWidth="10" strokeLinecap="round" />
            {[150, 220, 290, 360, 430].map((x) => {
              const y = x <= 310 ? 176 - (x - 80) * 114 / 230 : 62 + (x - 310) * 114 / 230;
              return <line key={x} x1={x} x2={x} y1={y - 54} y2={y - 10} stroke="#e87524" strokeWidth="2" markerEnd="url(#ld-arrow)" />;
            })}
            <line x1="80" x2="540" y1="202" y2="202" stroke="#7390a3" />
            <text x="310" y="224" textAnchor="middle">Loads reported per horizontal plan area</text>
          </g>
        ) : isWall ? (
          <g>
            <rect x="205" y="36" width="210" height="175" rx="3" fill="#f5e5d4" stroke="#8a684b" strokeWidth="2" />
            {[78, 120, 162].map((y) => <line key={y} x1="205" x2="415" y1={y} y2={y} stroke="#c49a72" />)}
            <path d="M310 22V76" stroke="#e87524" strokeWidth="3" markerEnd="url(#ld-arrow)" />
            <line x1="174" x2="174" y1="36" y2="211" stroke="#7390a3" />
            <line x1="166" x2="182" y1="36" y2="36" stroke="#7390a3" />
            <line x1="166" x2="182" y1="211" y2="211" stroke="#7390a3" />
            <text x="154" y="126" textAnchor="middle" transform="rotate(-90 154 126)">height × kN/m² = kN/m</text>
          </g>
        ) : (
          <g>
            {[0, 1, 2, 3].map((index) => (
              <rect key={index} x={120 + index * 8} y={66 - index * 12} width="360" height="34" rx="3" fill={["#d6e7f2", "#9bc0d8", "#5f95b7", "#244d6a"][index]} stroke="#fff" />
            ))}
            {[165, 245, 325, 405].map((x) => <line key={x} x1={x} x2={x} y1="30" y2="78" stroke="#e87524" strokeWidth="2" markerEnd="url(#ld-arrow)" />)}
            <text x="300" y="154" textAnchor="middle">Layered assembly on plan</text>
          </g>
        )}
        <g transform="translate(90 244)">
          <rect width="440" height="14" rx="7" fill="#e3eaf0" />
          <rect width={gWidth} height="14" rx="7" fill="#1769aa" />
          <rect x={gWidth} width={qWidth} height="14" rx="7" fill="#e87524" />
        </g>
        <text x="90" y="274">Gk {fmt(gk)}</text>
        <text x="530" y="274" textAnchor="end">Qk {fmt(qk)}</text>
      </svg>
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
};

function isStoredLoadPreset(value: unknown): value is LoadPreset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LoadPreset>;
  return candidate.custom === true
    && typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && typeof candidate.notes === "string"
    && (candidate.outputBasis === "plan-area" || candidate.outputBasis === "wall-face")
    && Array.isArray(candidate.components)
    && candidate.components.every((component) =>
      Boolean(component)
      && typeof component.id === "string"
      && typeof component.label === "string"
      && (component.action === "Gk" || component.action === "Qk"));
}

export default function LoadLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [origin, setOrigin] = useState("All sources");
  const [customLoads, setCustomLoads] = useState<LoadPreset[]>([]);
  const [selectedId, setSelectedId] = useState("example-roof-45-solar");
  const [pitchDeg, setPitchDeg] = useState(45);
  const [wallHeightM, setWallHeightM] = useState(2.4);
  const [copyStatus, setCopyStatus] = useState("");
  const [transferStatus, setTransferStatus] = useState("");
  const [editor, setEditor] = useState<EditorDraft | null>(null);

  useEffect(() => {
    let savedLoads: LoadPreset[] = [];
    try {
      const saved = window.localStorage.getItem(CUSTOM_LOADS_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as unknown;
      if (Array.isArray(parsed)) savedLoads = parsed.filter(isStoredLoadPreset);
    } catch {}
    const update = window.setTimeout(() => setCustomLoads(savedLoads), 0);
    return () => window.clearTimeout(update);
  }, []);

  const allLoads = useMemo(() => [...LOAD_PRESETS, ...customLoads], [customLoads]);
  const selected = allLoads.find((preset) => preset.id === selectedId) ?? allLoads[0];
  const result = evaluatePreset(selected, selected.pitchDeg !== undefined ? pitchDeg : undefined);

  const filtered = useMemo(() => {
    const normalQuery = query.trim().toLowerCase();
    return allLoads.filter((preset) => {
      const matchesCategory = category === "All" || preset.category === category;
      const matchesOrigin = origin === "All sources" || preset.origin === origin;
      const haystack = [preset.name, preset.category, preset.origin, preset.notes, ...(preset.tags ?? [])].join(" ").toLowerCase();
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
      setCopyStatus("Copied");
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
      setCopyStatus("Copied");
    }
    window.setTimeout(() => setCopyStatus(""), 1800);
  };

  const copySelected = () => {
    const unit = selected.outputBasis === "wall-face" ? "kN/m² wall face" : "kN/m² plan";
    const componentLines = result.components.map((component) =>
      `- ${component.label}: ${component.formula} = ${fmt(component.valueKnM2, 3)} ${unit} (${component.action})`);
    const lineLoad = selected.outputBasis === "wall-face"
      ? `\nWall line load at ${fmt(wallHeightM)} m: ${fmt(result.gk * wallHeightM, 3)} kN/m`
      : "";
    copyText([
      selected.name,
      `Basis: ${unit}`,
      ...componentLines,
      `Gk = ${fmt(result.gk, 3)} ${unit}`,
      `Qk = ${fmt(result.qk, 3)} ${unit}`,
      `Characteristic Gk + Qk = ${fmt(result.characteristic, 3)} ${unit}`,
      `ULS 6.10a = ${fmt(result.combinations.ulsA, 3)} ${unit}`,
      `ULS 6.10b = ${fmt(result.combinations.ulsB, 3)} ${unit}`,
      lineLoad,
      `Reference: ${selected.reference ?? "User-defined"}`,
    ].filter(Boolean).join("\n"));
  };

  const startEditor = () => {
    setEditor({
      id: selected.custom ? selected.id : `custom-${Date.now()}`,
      name: selected.custom ? selected.name : `${selected.name} — copy`,
      category: selected.category,
      gk: Number(result.gk.toFixed(3)),
      qk: Number(result.qk.toFixed(3)),
      notes: selected.notes,
      outputBasis: selected.outputBasis,
    });
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
    );
    const withoutCurrent = customLoads.filter((item) => item.id !== editor.id);
    persistCustomLoads([...withoutCurrent, next]);
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
    window.localStorage.setItem(LOAD_TRANSFER_KEY, JSON.stringify({
      name: selected.name,
      gk: result.gk,
      qk: result.qk,
      basis: selected.outputBasis,
      savedAt: new Date().toISOString(),
    }));
    setTransferStatus("Ready in Load takedown");
  };

  const projectCount = allLoads.filter((item) => item.origin === "Project preset").length;
  const transparentCount = allLoads.filter((item) => item.components.length > 1 || item.origin === "UK code reference").length;

  return (
    <main className="ld-app">
      <section className="ld-hero">
        <div>
          <Link href="/uk-calculators" className="ld-back"><ArrowLeft size={15} /> UK calculator workspace</Link>
          <div className="ld-kicker"><Database size={16} /> STRUCTURA / LOAD INTELLIGENCE / UK</div>
          <h1>Build the load.<br /><em>See the evidence.</em></h1>
          <p>A transparent, reusable load library for UK small works—organised by building element, with formula traces, editable copies and a direct hand-off to member design.</p>
        </div>
        <div className="ld-hero-metrics">
          <div><span>DATABASE</span><strong>{allLoads.length}</strong><small>load presets</small></div>
          <div><span>PROJECT</span><strong>{projectCount}</strong><small>supplied assumptions</small></div>
          <div><span>TRACEABLE</span><strong>{transparentCount}</strong><small>detailed / code entries</small></div>
        </div>
      </section>

      <div className="ld-research-banner">
        <BookOpenCheck size={18} />
        <p><strong>Standards basis:</strong> first-generation BS EN 1991-1-1 and the 2019 UK National Annex remain the applicable UK building standards until 30 March 2028 unless the authority or project specification states otherwise. Snow and wind remain site-specific actions.</p>
      </div>

      <section className="ld-browser" aria-label="UK structural load database">
        <aside className="ld-library-rail">
          <div className="ld-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roof, brick, floor…" aria-label="Search load database" />
          </div>
          <div className="ld-filter-row">
            <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} aria-label="Filter by category">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={origin} onChange={(event) => setOrigin(event.target.value)} aria-label="Filter by source">
              {["All sources", "Project preset", "Calculated assembly", "UK code reference", "Custom"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="ld-list-head"><span>{filtered.length} entries</span><span>Gk / Qk</span></div>
          <div className="ld-load-list">
            {filtered.map((preset) => {
              const values = evaluatePreset(preset);
              return (
                <button key={preset.id} type="button" className={selected.id === preset.id ? "active" : undefined} onClick={() => selectPreset(preset)}>
                  <span className={`ld-origin-dot ${originClass(preset.origin)}`} />
                  <span className="ld-list-copy">
                    <strong>{preset.name}</strong>
                    <small>{preset.category} · {preset.origin}</small>
                  </span>
                  <span className="ld-list-values"><strong>{fmt(values.gk)}</strong><small>{fmt(values.qk)}</small></span>
                </button>
              );
            })}
            {filtered.length === 0 && <div className="ld-empty">No loads match these filters.</div>}
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
              <button type="button" onClick={copySelected}>{copyStatus ? <Check size={15} /> : <Copy size={15} />}{copyStatus || "Copy calc"}</button>
              <button type="button" onClick={startEditor}><Pencil size={15} /> {selected.custom ? "Edit" : "Duplicate + edit"}</button>
              {selected.custom && <button type="button" className="danger" onClick={deleteSelected} aria-label="Delete custom load"><Trash2 size={15} /></button>}
            </div>
          </header>

          <div className="ld-main-grid">
            <div>
              <AssemblyGraphic preset={selected} gk={result.gk} qk={result.qk} />
              <div className="ld-variable-row">
                {selected.pitchDeg !== undefined && (
                  <label><span><Ruler size={14} /> Roof pitch</span><strong>{fmt(pitchDeg, 0)}°</strong><input type="range" min="0" max="70" step="1" value={pitchDeg} onChange={(event) => setPitchDeg(Number(event.target.value))} /></label>
                )}
                {selected.outputBasis === "wall-face" && (
                  <label><span><Ruler size={14} /> Wall height</span><strong>{fmt(wallHeightM, 2)} m</strong><input type="range" min="0.5" max="6" step="0.1" value={wallHeightM} onChange={(event) => setWallHeightM(Number(event.target.value))} /></label>
                )}
              </div>
              <div className="ld-formula-card">
                <div className="ld-card-title"><div><span>Calculation trace</span><h3>Every component shown</h3></div><span className="ld-unit-chip">{selected.outputBasis === "wall-face" ? "kN/m² wall face" : "kN/m² plan"}</span></div>
                <div className="ld-component-list">
                  {result.components.map((component, index) => (
                    <div className="ld-component" key={component.id}>
                      <span className={`ld-action ${component.action.toLowerCase()}`}>{component.action}</span>
                      <span className="ld-step">{String(index + 1).padStart(2, "0")}</span>
                      <div><strong>{component.label}</strong><code>{component.formula}</code>{component.note && <small>{component.note}</small>}</div>
                      <strong className="ld-component-value">{fmt(component.valueKnM2, 3)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="ld-result-rail">
              <div className="ld-card-title"><div><span>Characteristic actions</span><h3>Separated by action</h3></div></div>
              <div className="ld-result-grid">
                <div className="gk"><span>Permanent</span><strong>{fmt(result.gk, 3)}</strong><small>Gk · kN/m²</small></div>
                <div className="qk"><span>Variable</span><strong>{fmt(result.qk, 3)}</strong><small>Qk · kN/m²</small></div>
              </div>
              <div className="ld-total">
                <span>Characteristic total</span>
                <strong>{fmt(result.characteristic, 3)} <small>kN/m²</small></strong>
                <code>Gk + Qk</code>
              </div>
              {selected.outputBasis === "wall-face" && (
                <div className="ld-line-result">
                  <span>Wall line load</span><strong>{fmt(result.gk * wallHeightM, 3)} kN/m</strong><code>{fmt(result.gk, 3)} × {fmt(wallHeightM, 2)}</code>
                </div>
              )}
              <div className="ld-uls-card">
                <span>UK ULS envelope</span>
                <div><small>6.10a</small><strong>{fmt(result.combinations.ulsA, 3)}</strong></div>
                <div><small>6.10b</small><strong>{fmt(result.combinations.ulsB, 3)}</strong></div>
                <p>{result.combinations.governing} governs this Gk/Qk pair.</p>
              </div>
              <button type="button" className="ld-use-button" disabled={selected.outputBasis !== "plan-area"} onClick={useInCalculator}>
                {transferStatus ? <Check size={17} /> : <ArrowRight size={17} />}
                {transferStatus || "Use in Load takedown"}
              </button>
              {transferStatus && <Link className="ld-open-calc" href="/uk-calculators#workbench">Open calculator <ArrowRight size={14} /></Link>}
              {selected.outputBasis === "wall-face" && <p className="ld-use-help">Convert the wall face load to kN/m using height, then add it as a wall line action.</p>}
              <div className="ld-reference">
                <BookOpenCheck size={16} />
                <div><span>Source / assumption</span><p>{selected.reference}</p></div>
              </div>
            </aside>
          </div>

          {editor && (
            <section className="ld-editor" aria-label="Edit custom load">
              <div className="ld-editor-head"><div><FilePenLine size={18} /><span><strong>Device-local editable copy</strong><small>Changes are stored only in this browser.</small></span></div><button type="button" onClick={() => setEditor(null)}>Close</button></div>
              <div className="ld-editor-grid">
                <label className="wide"><span>Load name</span><input value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} /></label>
                <label><span>Category</span><select value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value as LoadCategory })}>{categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Gk (kN/m²)</span><input type="number" min="0" step="0.01" value={editor.gk} onChange={(event) => setEditor({ ...editor, gk: Number(event.target.value) })} /></label>
                <label><span>Qk (kN/m²)</span><input type="number" min="0" step="0.01" value={editor.qk} onChange={(event) => setEditor({ ...editor, qk: Number(event.target.value) })} /></label>
                <label className="wide"><span>Notes / scope</span><textarea rows={3} value={editor.notes} onChange={(event) => setEditor({ ...editor, notes: event.target.value })} /></label>
              </div>
              <div className="ld-editor-actions"><button type="button" onClick={saveEditor}><Save size={15} /> Save custom load</button><button type="button" onClick={() => setEditor(null)}><RotateCcw size={15} /> Cancel</button></div>
            </section>
          )}
        </section>
      </section>

      <section className="ld-standards">
        <div><ShieldAlert size={20} /><span><strong>Engineering use</strong><p>Loads are starting data, not a completed design. Verify occupancy, actual products, snow, wind, concentrated actions, load combinations and the full load path.</p></span></div>
        <nav aria-label="Research sources">
          <a href="https://knowledge.bsigroup.com/products/uk-national-annex-to-eurocode-1-actions-on-structures-general-actions-densities-self-weight-imposed-loads-for-buildings" target="_blank" rel="noreferrer">BSI UK NA <ExternalLink size={13} /></a>
          <a href="https://www.gov.uk/government/publications/structure-approved-document-a" target="_blank" rel="noreferrer">Approved Document A <ExternalLink size={13} /></a>
          <a href="https://www.steelconstruction.info/Design_codes_and_standards" target="_blank" rel="noreferrer">SCI combinations <ExternalLink size={13} /></a>
        </nav>
      </section>
    </main>
  );
}
