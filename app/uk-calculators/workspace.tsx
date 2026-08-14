"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Boxes,
  Building2,
  Check,
  ChevronRight,
  CircleGauge,
  Construction,
  House,
  Layers3,
  LockKeyhole,
  Network,
  Ruler,
  ShieldCheck,
  Sparkles,
  Warehouse,
} from "lucide-react";
import {
  STEEL_SECTIONS,
  calculateLoadTakedown,
  calculateMasonryBearing,
  designSteelBeam,
  designTimberMember,
  type BeamAnalysis,
  type CheckResult,
  type GraphPoint,
  type TimberGrade,
} from "@/lib/uk-calculators/engine";
import { LOAD_TRANSFER_KEY } from "@/lib/uk-calculators/load-database";

type CalculatorId = "load" | "steel" | "bearing" | "floor" | "roof";

const calculators = [
  { id: "load" as const, number: "01", title: "Load takedown", short: "Loads", icon: Network },
  { id: "steel" as const, number: "02", title: "Steel beam", short: "Steel beam", icon: Construction },
  { id: "bearing" as const, number: "03", title: "Masonry bearing", short: "Bearing", icon: Building2 },
  { id: "floor" as const, number: "04", title: "Timber floor", short: "Timber floor", icon: Layers3 },
  { id: "roof" as const, number: "05", title: "Timber roof", short: "Timber roof", icon: House },
];

const comingSoon = [
  ["06", "Foundation design", "Strip · trench fill · pad", "MVP"],
  ["07", "Foundations near trees", "Shrinkable clay workflow", "MVP"],
  ["08", "Flitch beam", "Timber + steel composite", "MVP"],
  ["09", "Masonry wall panel", "Vertical + lateral", "MVP"],
  ["10", "Steel column / post", "UC · SHS · RHS", "MVP"],
  ["11", "Windpost", "Masonry restraint", "Phase 2"],
  ["12", "Retaining wall", "RC + masonry", "Phase 2"],
  ["13", "LVL / glulam beam", "Engineered timber", "Phase 2"],
  ["14", "Lintel over opening", "Load triangle + lintel", "Phase 2"],
  ["15", "Timber stud", "Axial + lateral", "Phase 2"],
  ["16", "Base plate + anchors", "Steel to concrete", "Phase 2"],
  ["17", "Simple connections", "Fin plate · end plate", "Phase 2"],
  ["18", "Timber racking", "Shear wall panels", "Phase 2"],
  ["19", "Beam torsion", "Eccentric loading", "Phase 2"],
  ["20", "RC beam", "Flexure + shear", "Phase 2"],
  ["21", "RC one-way slab", "Flexure + serviceability", "Phase 3"],
  ["22", "RC column", "Axial + biaxial", "Phase 3"],
  ["23", "Ground beam", "Soil + pile reactions", "Phase 3"],
  ["24", "Pile capacity", "Axial geotechnics", "Phase 3"],
  ["25", "Pile cap", "Strut-and-tie", "Phase 3"],
  ["26", "Raft foundation", "Bearing + flexure", "Phase 3"],
  ["27", "Steel beam splice", "Bolted splice", "Phase 3"],
  ["28", "Timber connections", "Bolt · screw · hanger", "Phase 3"],
  ["29", "Small portal frame", "Single-bay frame", "Specialist"],
  ["30", "RC stair", "Flight + landing", "Specialist"],
] as const;

const fmt = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : "—";

function NumberField({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max,
  step = 0.1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="uk-field">
      <span className="uk-field-label">{label}</span>
      <span className="uk-field-control">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span>{unit}</span>
      </span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="uk-field uk-field-wide">
      <span className="uk-field-label">{label}</span>
      <span className="uk-field-control uk-select-control">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
      </span>
    </label>
  );
}

function InputGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="uk-input-group">
      <legend>{title}</legend>
      <div className="uk-field-grid">{children}</div>
    </fieldset>
  );
}

function pathFor(points: GraphPoint[], signed: boolean) {
  if (points.length === 0) return "";
  const width = 420;
  const height = 82;
  const xMax = Math.max(points.at(-1)?.x ?? 1, 0.001);
  const yMax = Math.max(...points.map((point) => Math.abs(point.y)), 0.001);
  return points.map((point, index) => {
    const x = 8 + point.x / xMax * (width - 16);
    const y = signed
      ? height / 2 - point.y / yMax * (height / 2 - 10)
      : height - 8 - point.y / yMax * (height - 18);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function DiagramStrip({
  label,
  value,
  unit,
  points,
  signed = false,
  colour,
}: {
  label: string;
  value: number;
  unit: string;
  points: GraphPoint[];
  signed?: boolean;
  colour: string;
}) {
  const baseline = signed ? 41 : 74;
  return (
    <div className="uk-diagram-strip">
      <div className="uk-diagram-label">
        <span>{label}</span>
        <strong>{fmt(value)} {unit}</strong>
      </div>
      <svg viewBox="0 0 420 82" role="img" aria-label={`${label}, maximum ${fmt(value)} ${unit}`}>
        <line x1="8" x2="412" y1={baseline} y2={baseline} className="uk-chart-axis" />
        <path d={pathFor(points, signed)} fill="none" stroke={colour} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function BeamViewport({
  analysis,
  udlKnM,
  pointKn,
  pointPositionM,
  memberLabel,
  material = "steel",
  showDeflection = true,
}: {
  analysis: BeamAnalysis;
  udlKnM: number;
  pointKn?: number;
  pointPositionM?: number;
  memberLabel: string;
  material?: "steel" | "timber";
  showDeflection?: boolean;
}) {
  const pointX = 70 + (pointPositionM ?? analysis.spanM / 2) / analysis.spanM * 580;
  const memberColour = material === "steel" ? "#2563eb" : "#a16207";
  return (
    <div className="uk-viewport-card">
      <div className="uk-viewport-toolbar">
        <span><CircleGauge size={15} /> Live engineering view</span>
        <span className="uk-view-chip">Elevation</span>
      </div>
      <svg className="uk-beam-view" viewBox="0 0 720 250" role="img" aria-label={`${memberLabel}, simply supported over ${fmt(analysis.spanM, 2)} metres`}>
        <defs>
          <marker id="load-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#f97316" />
          </marker>
          <marker id="reaction-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#16a34a" />
          </marker>
          <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="720" height="250" fill="url(#grid-pattern)" />
        <text x="360" y="22" textAnchor="middle" className="uk-svg-title">{memberLabel}</text>
        {Array.from({ length: 9 }).map((_, index) => {
          const x = 84 + index * 69;
          return <line key={x} x1={x} y1="48" x2={x} y2="104" stroke="#f97316" strokeWidth="1.8" markerEnd="url(#load-arrow)" />;
        })}
        <line x1="84" x2="636" y1="48" y2="48" stroke="#f97316" strokeWidth="2" />
        <text x="360" y="42" textAnchor="middle" className="uk-svg-load">w* = {fmt(udlKnM)} kN/m</text>
        {(pointKn ?? 0) > 0 && (
          <g>
            <line x1={pointX} x2={pointX} y1="28" y2="104" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#load-arrow)" />
            <text x={pointX + 8} y="33" className="uk-svg-point">P* = {fmt(pointKn ?? 0)} kN</text>
          </g>
        )}
        <rect x="70" y="108" width="580" height="18" rx="2" fill={memberColour} />
        {material === "steel" ? (
          <g stroke="#dbeafe" strokeWidth="2">
            <line x1="70" x2="650" y1="113" y2="113" />
            <line x1="70" x2="650" y1="121" y2="121" />
          </g>
        ) : (
          <g stroke="#fef3c7" strokeWidth="1.5" opacity=".8">
            <path d="M75 116 C160 108 250 124 345 116 S535 108 645 117" fill="none" />
          </g>
        )}
        <path d="M70 128 L53 156 H87 Z" fill="#475569" />
        <circle cx="634" cy="154" r="7" fill="#475569" />
        <circle cx="650" cy="154" r="7" fill="#475569" />
        <path d="M650 128 L633 148 H667 Z" fill="#475569" />
        <line x1="42" x2="98" y1="160" y2="160" stroke="#64748b" strokeWidth="2" />
        <line x1="622" x2="678" y1="164" y2="164" stroke="#64748b" strokeWidth="2" />
        <line x1="70" x2="70" y1="204" y2="166" stroke="#16a34a" strokeWidth="2" markerEnd="url(#reaction-arrow)" />
        <line x1="650" x2="650" y1="204" y2="166" stroke="#16a34a" strokeWidth="2" markerEnd="url(#reaction-arrow)" />
        <text x="70" y="220" textAnchor="middle" className="uk-svg-reaction">R₁ {fmt(analysis.reactionLeftKn)} kN</text>
        <text x="650" y="220" textAnchor="middle" className="uk-svg-reaction">R₂ {fmt(analysis.reactionRightKn)} kN</text>
        <line x1="70" x2="650" y1="238" y2="238" stroke="#64748b" />
        <line x1="70" x2="70" y1="230" y2="244" stroke="#64748b" />
        <line x1="650" x2="650" y1="230" y2="244" stroke="#64748b" />
        <text x="360" y="247" textAnchor="middle" className="uk-svg-dimension">L = {fmt(analysis.spanM, 2)} m</text>
      </svg>
      <div className={`uk-force-grid${showDeflection ? "" : " two"}`}>
        <DiagramStrip label="Shear force" value={analysis.maxShearKn} unit="kN" points={analysis.shear} signed colour="#f97316" />
        <DiagramStrip label="Bending moment" value={analysis.maxMomentKnM} unit="kNm" points={analysis.moment} colour="#2563eb" />
        {showDeflection ? <DiagramStrip label="Deflected shape" value={analysis.maxDeflectionMm} unit="mm" points={analysis.deflection} colour="#7c3aed" /> : null}
      </div>
    </div>
  );
}

function BearingViewport({
  reactionKn,
  wallThicknessMm,
  bearingLengthMm,
  requiredLengthMm,
  utilisation,
}: {
  reactionKn: number;
  wallThicknessMm: number;
  bearingLengthMm: number;
  requiredLengthMm: number;
  utilisation: number;
}) {
  const bearingWidth = Math.min(210, Math.max(60, bearingLengthMm * 0.7));
  const requiredWidth = Math.min(250, Math.max(60, requiredLengthMm * 0.7));
  const colour = utilisation <= 1 ? "#16a34a" : "#dc2626";
  return (
    <div className="uk-viewport-card">
      <div className="uk-viewport-toolbar">
        <span><CircleGauge size={15} /> Live bearing view</span>
        <span className="uk-view-chip">Section</span>
      </div>
      <svg className="uk-bearing-view" viewBox="0 0 720 430" role="img" aria-label="Steel beam bearing on a masonry wall">
        <defs>
          <marker id="bearing-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#dc2626" />
          </marker>
          <pattern id="brick-pattern" width="80" height="36" patternUnits="userSpaceOnUse">
            <rect width="80" height="36" fill="#fff7ed" stroke="#d6a878" />
            <path d="M40 0V18 M0 18H80" stroke="#d6a878" />
          </pattern>
        </defs>
        <rect x="210" y="178" width="300" height="210" rx="3" fill="url(#brick-pattern)" />
        <rect x="70" y="108" width="360" height="44" rx="2" fill="#2563eb" />
        <path d="M70 118H430 M70 142H430" stroke="#dbeafe" strokeWidth="4" />
        <rect x="210" y="152" width={bearingWidth} height="26" fill="#64748b" />
        <line x1={210 + bearingWidth / 2} x2={210 + bearingWidth / 2} y1="38" y2="96" stroke="#dc2626" strokeWidth="4" markerEnd="url(#bearing-arrow)" />
        <text x={230 + bearingWidth / 2} y="55" className="uk-svg-point">N* = {fmt(reactionKn)} kN</text>
        <path
          d={`M210 181 L${210 + bearingWidth} 181 L${210 + requiredWidth} 314 L210 314 Z`}
          fill={colour}
          opacity=".13"
          stroke={colour}
          strokeDasharray="6 5"
          strokeWidth="2"
        />
        <line x1="210" x2={210 + bearingWidth} y1="96" y2="96" stroke="#64748b" />
        <line x1="210" x2="210" y1="90" y2="102" stroke="#64748b" />
        <line x1={210 + bearingWidth} x2={210 + bearingWidth} y1="90" y2="102" stroke="#64748b" />
        <text x={210 + bearingWidth / 2} y="88" textAnchor="middle" className="uk-svg-dimension">{fmt(bearingLengthMm, 0)} mm bearing</text>
        <text x="530" y="204" className="uk-svg-note">Wall thickness</text>
        <text x="530" y="224" className="uk-svg-value">{fmt(wallThicknessMm, 0)} mm</text>
        <text x="530" y="272" className="uk-svg-note">Required length</text>
        <text x="530" y="294" className="uk-svg-value">{fmt(requiredLengthMm, 0)} mm</text>
        <rect x="530" y="326" width="130" height="10" rx="5" fill="#e2e8f0" />
        <rect x="530" y="326" width={Math.min(130, 130 * utilisation)} height="10" rx="5" fill={colour} />
        <text x="530" y="358" className="uk-svg-note">Bearing utilisation</text>
        <text x="530" y="382" className="uk-svg-value" fill={colour}>{fmt(utilisation * 100, 0)}%</text>
      </svg>
    </div>
  );
}

function RoofViewport({
  analysis,
  pitchDeg,
  memberType,
  lineLoad,
}: {
  analysis: BeamAnalysis;
  pitchDeg: number;
  memberType: string;
  lineLoad: number;
}) {
  const rise = Math.tan(pitchDeg * Math.PI / 180) * 220;
  const roofY = Math.max(55, 190 - rise);
  return (
    <div className="uk-viewport-card">
      <div className="uk-viewport-toolbar">
        <span><CircleGauge size={15} /> Live roof view</span>
        <span className="uk-view-chip">Roof section</span>
      </div>
      <svg className="uk-roof-view" viewBox="0 0 720 270" role="img" aria-label={`${memberType} at ${pitchDeg} degree roof pitch`}>
        <defs>
          <marker id="roof-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 z" fill="#0ea5e9" />
          </marker>
        </defs>
        <path d={`M70 210 L360 ${roofY} L650 210`} fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
        <path d={`M70 210 L360 ${roofY}`} fill="none" stroke="#a16207" strokeWidth="13" strokeLinecap="round" />
        <path d={`M360 ${roofY} L650 210`} fill="none" stroke="#d6b36a" strokeWidth="7" strokeLinecap="round" />
        <line x1="70" x2="70" y1="210" y2="246" stroke="#475569" strokeWidth="7" />
        <line x1="650" x2="650" y1="210" y2="246" stroke="#475569" strokeWidth="7" />
        {[130, 190, 250, 310].map((x, index) => {
          const fraction = (x - 70) / 290;
          const y = 210 + (roofY - 210) * fraction;
          return <line key={x} x1={x} x2={x} y1={y - 64 - index * 2} y2={y - 9} stroke="#0ea5e9" strokeWidth="2" markerEnd="url(#roof-arrow)" />;
        })}
        <text x="160" y="52" className="uk-svg-load">q* = {fmt(lineLoad)} kN/m</text>
        <path d="M94 210 A65 65 0 0 1 145 177" fill="none" stroke="#2563eb" strokeWidth="2" />
        <text x="118" y="198" className="uk-svg-dimension">{fmt(pitchDeg, 0)}°</text>
        <text x="380" y={roofY - 12} className="uk-svg-title">{memberType}</text>
        <text x="360" y="258" textAnchor="middle" className="uk-svg-dimension">Member span = {fmt(analysis.spanM, 2)} m</text>
      </svg>
      <div className="uk-force-grid">
        <DiagramStrip label="Shear force" value={analysis.maxShearKn} unit="kN" points={analysis.shear} signed colour="#f97316" />
        <DiagramStrip label="Bending moment" value={analysis.maxMomentKnM} unit="kNm" points={analysis.moment} colour="#2563eb" />
        <DiagramStrip label="Deflected shape" value={analysis.maxDeflectionMm} unit="mm" points={analysis.deflection} colour="#7c3aed" />
      </div>
    </div>
  );
}

function UtilisationGauge({ value }: { value: number }) {
  const percentage = Math.max(0, value * 100);
  const colour = value <= 0.85 ? "#16a34a" : value <= 1 ? "#f59e0b" : "#dc2626";
  const sweep = Math.min(100, percentage) * 3.6;
  return (
    <div className="uk-gauge-wrap">
      <div className="uk-gauge" style={{ background: `conic-gradient(${colour} 0deg ${sweep}deg, #e8edf3 ${sweep}deg 360deg)` }}>
        <div>
          <strong>{fmt(percentage, 0)}%</strong>
          <span>governing</span>
        </div>
      </div>
      <div className={`uk-status ${value <= 1 ? "pass" : "fail"}`}>
        {value <= 1 ? <Check size={15} /> : <AlertTriangle size={15} />}
        {value <= 1 ? "Preliminary pass" : "Design fails"}
      </div>
    </div>
  );
}

function CheckList({ checks }: { checks: CheckResult[] }) {
  return (
    <div className="uk-check-list">
      {checks.map((check) => {
        const pass = check.utilisation <= 1;
        return (
          <div className="uk-check-row" key={check.label}>
            <div className="uk-check-top">
              <span>{check.label}</span>
              <strong className={pass ? "ok" : "not-ok"}>{fmt(check.utilisation * 100, 0)}%</strong>
            </div>
            <div className="uk-progress"><span style={{ width: `${Math.min(100, check.utilisation * 100)}%` }} className={pass ? "ok" : "not-ok"} /></div>
            <div className="uk-check-values"><span>{check.demand}</span><span>/ {check.capacity}</span></div>
          </div>
        );
      })}
    </div>
  );
}

function ScopeBanner({ children }: { children: ReactNode }) {
  return (
    <div className="uk-scope-banner">
      <LockKeyhole size={15} />
      <span><strong>Implemented scope:</strong> {children}</span>
    </div>
  );
}

export default function UKCalculatorWorkspace() {
  const [active, setActive] = useState<CalculatorId>("load");
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [loadLibraryNotice, setLoadLibraryNotice] = useState("");
  const [load, setLoad] = useState({
    spanM: 4.5,
    tributaryWidthM: 3.2,
    deadAreaKnM2: 0.75,
    imposedAreaKnM2: 1.5,
    wallDeadKnM: 3.2,
    pointDeadKn: 0,
    pointImposedKn: 0,
    pointPositionM: 2.25,
  });
  const [steel, setSteel] = useState({
    spanM: 4.5,
    gkLineKnM: 5.6,
    qkLineKnM: 4.8,
    gkPointKn: 0,
    qkPointKn: 0,
    pointPositionM: 2.25,
    sectionName: "254 × 146 × 31 UKB",
    steelGrade: 355 as 275 | 355,
    deflectionRatio: 360,
  });
  const [bearing, setBearing] = useState({
    reactionKn: 42,
    wallThicknessMm: 215,
    bearingLengthMm: 100,
    masonryDesignStrengthNmm2: 1.7,
    enhancementFactor: 1.15,
  });
  const [floor, setFloor] = useState({
    spanM: 4,
    widthMm: 47,
    depthMm: 220,
    spacingM: 0.4,
    deadAreaKnM2: 0.75,
    imposedAreaKnM2: 1.5,
    grade: "C24" as TimberGrade,
    serviceClass: 1 as 1 | 2,
    systemFactor: 1.1,
    deflectionRatio: 300,
  });
  const [roof, setRoof] = useState({
    memberType: "Common rafter",
    spanM: 4.2,
    pitchDeg: 35,
    planTributaryWidthM: 0.4,
    widthMm: 47,
    depthMm: 200,
    deadAreaKnM2: 0.85,
    variableAreaKnM2: 0.75,
    grade: "C24" as TimberGrade,
    serviceClass: 2 as 1 | 2,
    deflectionRatio: 300,
  });

  useEffect(() => {
    let transfer: { name?: string; gk?: number; qk?: number } | null = null;
    try {
      const saved = window.localStorage.getItem(LOAD_TRANSFER_KEY);
      if (!saved) return;
      transfer = JSON.parse(saved) as { name?: string; gk?: number; qk?: number };
      if (!Number.isFinite(transfer.gk) || !Number.isFinite(transfer.qk)) return;
    } catch {
      return;
    }
    const update = window.setTimeout(() => {
      if (!transfer) return;
      setLoad((current) => ({
        ...current,
        deadAreaKnM2: Math.max(0, transfer.gk ?? 0),
        imposedAreaKnM2: Math.max(0, transfer.qk ?? 0),
      }));
      setActive("load");
      setLoadLibraryNotice(`${transfer.name ?? "Library load"} loaded`);
    }, 0);
    return () => window.clearTimeout(update);
  }, []);

  const loadResult = useMemo(() => calculateLoadTakedown(load), [load]);
  const steelResult = useMemo(() => designSteelBeam(steel), [steel]);
  const bearingResult = useMemo(() => calculateMasonryBearing(bearing), [bearing]);
  const floorResult = useMemo(() => designTimberMember({
    spanM: floor.spanM,
    widthMm: floor.widthMm,
    depthMm: floor.depthMm,
    gkLineKnM: floor.deadAreaKnM2 * floor.spacingM,
    qkLineKnM: floor.imposedAreaKnM2 * floor.spacingM,
    grade: floor.grade,
    serviceClass: floor.serviceClass,
    systemFactor: floor.systemFactor,
    deflectionRatio: floor.deflectionRatio,
  }), [floor]);
  const roofLineFactor = roof.planTributaryWidthM * (roof.memberType === "Common rafter" ? Math.cos(roof.pitchDeg * Math.PI / 180) : 1);
  const roofResult = useMemo(() => designTimberMember({
    spanM: roof.spanM,
    widthMm: roof.widthMm,
    depthMm: roof.depthMm,
    gkLineKnM: roof.deadAreaKnM2 * roofLineFactor,
    qkLineKnM: roof.variableAreaKnM2 * roofLineFactor,
    grade: roof.grade,
    serviceClass: roof.serviceClass,
    systemFactor: 1,
    deflectionRatio: roof.deflectionRatio,
    psi0: 0.5,
    psi2: 0,
  }), [roof, roofLineFactor]);

  const sendLoadToSteel = () => {
    setSteel((current) => ({
      ...current,
      spanM: load.spanM,
      gkLineKnM: loadResult.gkLine,
      qkLineKnM: loadResult.qkLine,
      gkPointKn: load.pointDeadKn,
      qkPointKn: load.pointImposedKn,
      pointPositionM: load.pointPositionM,
    }));
    setActive("steel");
  };

  const sendSteelToBearing = () => {
    setBearing((current) => ({ ...current, reactionKn: steelResult.governing.reactionLeftKn }));
    setActive("bearing");
  };

  return (
    <main className="uk-app">
      <section className="uk-hero">
        <div className="uk-hero-copy">
          <div className="uk-eyebrow"><Sparkles size={14} /> UK Domestic Structural Studio <span>Preview 0.1</span></div>
          <h1>See the load path.<br /><em>Check every link.</em></h1>
          <p>
            Five connected visual calculators for the work small UK practices do repeatedly—
            from tributary loads to steel, masonry and timber members.
          </p>
          <div className="uk-code-row">
            <span>EN 1990 + UK NA</span><span>EN 1993-1-1</span><span>EN 1995-1-1</span><span>EN 1996-1-1</span>
          </div>
          <Link className="uk-load-library-link" href="/uk-calculators/load-database">
            <BookOpenCheck size={16} /> Open UK load database <ArrowRight size={15} />
          </Link>
        </div>
        <div className="uk-hero-flow" aria-label="Integrated calculation workflow">
          <div className="uk-flow-head"><span>Connected workflow</span><strong>UK-001 · Wall removal</strong></div>
          <div className="uk-flow-track">
            {calculators.slice(0, 3).map((calculator, index) => (
              <button key={calculator.id} type="button" onClick={() => setActive(calculator.id)}>
                <span>{calculator.number}</span>
                <calculator.icon size={20} />
                <strong>{calculator.short}</strong>
                {index < 2 && <ChevronRight className="uk-flow-arrow" size={17} />}
              </button>
            ))}
          </div>
          <div className="uk-flow-signal"><span /><span /><span /><span /><span /></div>
          <p><ShieldCheck size={16} /> Actions stay separated and transfer between calculators without retyping.</p>
        </div>
      </section>

      <div className="uk-beta-warning">
        <AlertTriangle size={17} />
        <span><strong>Engineering preview:</strong> implemented checks are transparent but deliberately limited. Do not use for construction or statutory submission until independently validated and signed off by a competent UK structural engineer.</span>
      </div>

      <section className="uk-workbench" id="workbench">
        <div className="uk-section-heading">
          <div><span>Live workbench</span><h2>First five calculators</h2></div>
          <button type="button" className="uk-roadmap-button" onClick={() => setShowRoadmap((visible) => !visible)}>
            <Boxes size={16} /> {showRoadmap ? "Hide roadmap" : "View all 30"}
          </button>
        </div>

        <div className="uk-calculator-tabs" role="tablist" aria-label="UK structural calculators">
          {calculators.map((calculator) => (
            <button
              key={calculator.id}
              type="button"
              role="tab"
              aria-selected={active === calculator.id}
              className={active === calculator.id ? "active" : undefined}
              onClick={() => setActive(calculator.id)}
            >
              <span>{calculator.number}</span>
              <calculator.icon size={17} />
              <strong>{calculator.title}</strong>
              {calculator.id === "load" || calculator.id === "steel" || calculator.id === "bearing" ? <i>Linked</i> : null}
            </button>
          ))}
        </div>

        {active === "load" && (
          <div className="uk-calc-shell">
            <aside className="uk-input-rail">
              <div className="uk-panel-title"><span>01</span><div><h3>Load takedown</h3><p>Tributary strip → beam actions</p></div></div>
              <InputGroup title="Geometry">
                <NumberField label="Beam span" value={load.spanM} onChange={(spanM) => setLoad({ ...load, spanM, pointPositionM: Math.min(load.pointPositionM, spanM) })} unit="m" min={0.5} max={15} />
                <NumberField label="Tributary width" value={load.tributaryWidthM} onChange={(tributaryWidthM) => setLoad({ ...load, tributaryWidthM })} unit="m" min={0.1} max={12} />
              </InputGroup>
              <InputGroup title="Area actions">
                <NumberField label="Permanent Gk" value={load.deadAreaKnM2} onChange={(deadAreaKnM2) => setLoad({ ...load, deadAreaKnM2 })} unit="kN/m²" />
                <NumberField label="Imposed Qk" value={load.imposedAreaKnM2} onChange={(imposedAreaKnM2) => setLoad({ ...load, imposedAreaKnM2 })} unit="kN/m²" />
              </InputGroup>
              <Link className="uk-inline-library-link" href="/uk-calculators/load-database">
                <BookOpenCheck size={15} /><span><strong>Choose from load database</strong>{loadLibraryNotice && <small>{loadLibraryNotice}</small>}</span><ArrowRight size={15} />
              </Link>
              <InputGroup title="Line + point actions">
                <NumberField label="Wall Gk" value={load.wallDeadKnM} onChange={(wallDeadKnM) => setLoad({ ...load, wallDeadKnM })} unit="kN/m" />
                <NumberField label="Point Gk" value={load.pointDeadKn} onChange={(pointDeadKn) => setLoad({ ...load, pointDeadKn })} unit="kN" />
                <NumberField label="Point Qk" value={load.pointImposedKn} onChange={(pointImposedKn) => setLoad({ ...load, pointImposedKn })} unit="kN" />
                <NumberField label="Point position" value={load.pointPositionM} onChange={(pointPositionM) => setLoad({ ...load, pointPositionM })} unit="m" min={0} max={load.spanM} />
              </InputGroup>
            </aside>
            <section className="uk-model-panel">
              <ScopeBanner>simply supported beam; one UDL and one point action; UK 6.10a/6.10b envelope.</ScopeBanner>
              <BeamViewport
                analysis={loadResult.governing}
                udlKnM={loadResult.governingUdlKnM}
                pointKn={loadResult.governingPointKn}
                pointPositionM={load.pointPositionM}
                memberLabel="Tributary load beam"
                showDeflection={false}
              />
              <div className="uk-trace-grid">
                <div><span>Permanent line action</span><strong>{fmt(loadResult.gkLine, 2)} kN/m</strong><small>area Gk × tributary width + wall</small></div>
                <div><span>Variable line action</span><strong>{fmt(loadResult.qkLine, 2)} kN/m</strong><small>area Qk × tributary width</small></div>
                <div><span>Governing ULS</span><strong>{loadResult.governingCombination}</strong><small>UK fundamental combination envelope</small></div>
              </div>
            </section>
            <aside className="uk-result-rail">
              <div className="uk-result-heading"><BarChart3 size={18} /><div><span>Analysis envelope</span><h3>{loadResult.governingCombination} governs</h3></div></div>
              <div className="uk-key-results">
                <div><span>Max moment</span><strong>{fmt(loadResult.governing.maxMomentKnM)} <small>kNm</small></strong></div>
                <div><span>Max shear</span><strong>{fmt(loadResult.governing.maxShearKn)} <small>kN</small></strong></div>
                <div><span>Left reaction</span><strong>{fmt(loadResult.governing.reactionLeftKn)} <small>kN</small></strong></div>
                <div><span>Right reaction</span><strong>{fmt(loadResult.governing.reactionRightKn)} <small>kN</small></strong></div>
              </div>
              <div className="uk-combination-card">
                <span>6.10a line</span><strong>{fmt(loadResult.lineCombination.ulsA, 2)} kN/m</strong>
                <span>6.10b line</span><strong>{fmt(loadResult.lineCombination.ulsB, 2)} kN/m</strong>
              </div>
              <button type="button" className="uk-transfer-button" onClick={sendLoadToSteel}>
                Send actions to steel beam <ArrowRight size={16} />
              </button>
              <div className="uk-mini-note"><BookOpenCheck size={15} /><span>ψ₀ = 0.70 shown for domestic floor use. Production will expose occupancy categories and accompanying actions.</span></div>
            </aside>
          </div>
        )}

        {active === "steel" && (
          <div className="uk-calc-shell">
            <aside className="uk-input-rail">
              <div className="uk-panel-title"><span>02</span><div><h3>Steel beam</h3><p>UKB analysis + preliminary resistance</p></div></div>
              <InputGroup title="Member">
                <NumberField label="Span" value={steel.spanM} onChange={(spanM) => setSteel({ ...steel, spanM, pointPositionM: Math.min(steel.pointPositionM, spanM) })} unit="m" min={0.5} max={15} />
                <SelectField label="UKB section" value={steel.sectionName} onChange={(sectionName) => setSteel({ ...steel, sectionName })} options={STEEL_SECTIONS.map((section) => ({ value: section.name, label: section.name }))} />
                <SelectField label="Steel grade" value={String(steel.steelGrade)} onChange={(value) => setSteel({ ...steel, steelGrade: Number(value) as 275 | 355 })} options={[{ value: "275", label: "S275" }, { value: "355", label: "S355" }]} />
                <SelectField label="Deflection limit" value={String(steel.deflectionRatio)} onChange={(value) => setSteel({ ...steel, deflectionRatio: Number(value) })} options={[{ value: "250", label: "L / 250" }, { value: "360", label: "L / 360" }, { value: "500", label: "L / 500" }]} />
              </InputGroup>
              <InputGroup title="Characteristic actions">
                <NumberField label="UDL Gk" value={steel.gkLineKnM} onChange={(gkLineKnM) => setSteel({ ...steel, gkLineKnM })} unit="kN/m" />
                <NumberField label="UDL Qk" value={steel.qkLineKnM} onChange={(qkLineKnM) => setSteel({ ...steel, qkLineKnM })} unit="kN/m" />
                <NumberField label="Point Gk" value={steel.gkPointKn} onChange={(gkPointKn) => setSteel({ ...steel, gkPointKn })} unit="kN" />
                <NumberField label="Point Qk" value={steel.qkPointKn} onChange={(qkPointKn) => setSteel({ ...steel, qkPointKn })} unit="kN" />
                <NumberField label="Point position" value={steel.pointPositionM} onChange={(pointPositionM) => setSteel({ ...steel, pointPositionM })} unit="m" min={0} max={steel.spanM} />
              </InputGroup>
            </aside>
            <section className="uk-model-panel">
              <ScopeBanner>simply supported and fully laterally restrained; plastic bending, shear proxy and SLS deflection only.</ScopeBanner>
              <BeamViewport
                analysis={steelResult.governing}
                udlKnM={steelResult.governingUdlKnM}
                pointKn={steelResult.governingPointKn}
                pointPositionM={steel.pointPositionM}
                memberLabel={steel.sectionName}
              />
              <div className="uk-exclusion-warning"><AlertTriangle size={16} /><span>LTB, section classification, web bearing/buckling, high-shear interaction, openings and torsion are not yet implemented. A “preliminary pass” is not a complete EC3 design.</span></div>
            </section>
            <aside className="uk-result-rail">
              <div className="uk-result-heading"><CircleGauge size={18} /><div><span>Design checks</span><h3>{steel.sectionName}</h3></div></div>
              <UtilisationGauge value={steelResult.utilisation} />
              <CheckList checks={steelResult.checks} />
              <div className="uk-combination-card">
                <span>Governing ULS</span><strong>{steelResult.governingCombination}</strong>
                <span>Left reaction</span><strong>{fmt(steelResult.governing.reactionLeftKn)} kN</strong>
              </div>
              <button type="button" className="uk-transfer-button" onClick={sendSteelToBearing}>
                Send reaction to bearing <ArrowRight size={16} />
              </button>
            </aside>
          </div>
        )}

        {active === "bearing" && (
          <div className="uk-calc-shell">
            <aside className="uk-input-rail">
              <div className="uk-panel-title"><span>03</span><div><h3>Masonry bearing</h3><p>Reaction → bearing footprint</p></div></div>
              <InputGroup title="Design action">
                <NumberField label="Design reaction NEd" value={bearing.reactionKn} onChange={(reactionKn) => setBearing({ ...bearing, reactionKn })} unit="kN" />
              </InputGroup>
              <InputGroup title="Wall + bearing">
                <SelectField label="Wall thickness" value={String(bearing.wallThicknessMm)} onChange={(value) => setBearing({ ...bearing, wallThicknessMm: Number(value) })} options={[{ value: "100", label: "100 mm leaf" }, { value: "140", label: "140 mm block" }, { value: "215", label: "215 mm solid" }, { value: "300", label: "300 mm wall" }]} />
                <NumberField label="Bearing length" value={bearing.bearingLengthMm} onChange={(bearingLengthMm) => setBearing({ ...bearing, bearingLengthMm })} unit="mm" step={25} min={50} />
                <NumberField label="Masonry fd" value={bearing.masonryDesignStrengthNmm2} onChange={(masonryDesignStrengthNmm2) => setBearing({ ...bearing, masonryDesignStrengthNmm2 })} unit="N/mm²" step={0.1} min={0.1} />
                <NumberField label="Enhancement β" value={bearing.enhancementFactor} onChange={(enhancementFactor) => setBearing({ ...bearing, enhancementFactor })} unit="—" step={0.05} min={1} max={1.5} hint="Only use when EC6 eligibility is verified." />
              </InputGroup>
            </aside>
            <section className="uk-model-panel">
              <ScopeBanner>single centred reaction and direct local bearing resistance; β is user-controlled and capped at 1.50.</ScopeBanner>
              <BearingViewport
                reactionKn={bearing.reactionKn}
                wallThicknessMm={bearing.wallThicknessMm}
                bearingLengthMm={bearing.bearingLengthMm}
                requiredLengthMm={bearingResult.requiredLengthMm}
                utilisation={bearingResult.utilisation}
              />
              <div className="uk-exclusion-warning"><AlertTriangle size={16} /><span>Wall stability, nearby-load interaction, eccentric bearing, padstone bending/shear and load dispersion require the production EC6/PD 6697 engine.</span></div>
            </section>
            <aside className="uk-result-rail">
              <div className="uk-result-heading"><CircleGauge size={18} /><div><span>Local bearing</span><h3>{bearingResult.utilisation <= 1 ? "Direct bearing works" : "Spreader indicated"}</h3></div></div>
              <UtilisationGauge value={bearingResult.utilisation} />
              <div className="uk-key-results">
                <div><span>Bearing stress</span><strong>{fmt(bearingResult.stressNmm2, 2)} <small>N/mm²</small></strong></div>
                <div><span>Resistance</span><strong>{fmt(bearingResult.resistanceKn)} <small>kN</small></strong></div>
                <div><span>Required length</span><strong>{fmt(bearingResult.requiredLengthMm, 0)} <small>mm</small></strong></div>
                <div><span>Indicative padstone</span><strong>{fmt(bearingResult.suggestedPadstoneLengthMm, 0)} <small>mm long</small></strong></div>
              </div>
              <div className="uk-mini-note"><BookOpenCheck size={15} /><span>Production logic will verify β eligibility and design either a concrete padstone or steel spreader, including wall stability below.</span></div>
            </aside>
          </div>
        )}

        {active === "floor" && (
          <div className="uk-calc-shell">
            <aside className="uk-input-rail">
              <div className="uk-panel-title"><span>04</span><div><h3>Timber floor</h3><p>C16/C24 joist screening</p></div></div>
              <InputGroup title="Joist layout">
                <NumberField label="Span" value={floor.spanM} onChange={(spanM) => setFloor({ ...floor, spanM })} unit="m" min={0.5} max={10} />
                <NumberField label="Spacing" value={floor.spacingM} onChange={(spacingM) => setFloor({ ...floor, spacingM })} unit="m" step={0.05} min={0.1} />
                <NumberField label="Width" value={floor.widthMm} onChange={(widthMm) => setFloor({ ...floor, widthMm })} unit="mm" step={1} min={25} />
                <NumberField label="Depth" value={floor.depthMm} onChange={(depthMm) => setFloor({ ...floor, depthMm })} unit="mm" step={5} min={75} />
                <SelectField label="Strength class" value={floor.grade} onChange={(grade) => setFloor({ ...floor, grade: grade as TimberGrade })} options={[{ value: "C16", label: "C16 softwood" }, { value: "C24", label: "C24 softwood" }]} />
                <SelectField label="Service class" value={String(floor.serviceClass)} onChange={(value) => setFloor({ ...floor, serviceClass: Number(value) as 1 | 2 })} options={[{ value: "1", label: "Service class 1" }, { value: "2", label: "Service class 2" }]} />
              </InputGroup>
              <InputGroup title="Area actions">
                <NumberField label="Permanent Gk" value={floor.deadAreaKnM2} onChange={(deadAreaKnM2) => setFloor({ ...floor, deadAreaKnM2 })} unit="kN/m²" />
                <NumberField label="Imposed Qk" value={floor.imposedAreaKnM2} onChange={(imposedAreaKnM2) => setFloor({ ...floor, imposedAreaKnM2 })} unit="kN/m²" />
              </InputGroup>
            </aside>
            <section className="uk-model-panel">
              <ScopeBanner>solid rectangular joist; simply supported; medium-duration kmod; bending, shear and final deflection.</ScopeBanner>
              <BeamViewport
                analysis={floorResult.displayAnalysis}
                udlKnM={floorResult.line.uls}
                memberLabel={`${floor.widthMm} × ${floor.depthMm} ${floor.grade} joist @ ${fmt(floor.spacingM * 1000, 0)} centres`}
                material="timber"
              />
              <div className="uk-exclusion-warning"><AlertTriangle size={16} /><span>Vibration, notches, holes, bearing, lateral stability, load sharing eligibility and fire are not yet included.</span></div>
            </section>
            <aside className="uk-result-rail">
              <div className="uk-result-heading"><CircleGauge size={18} /><div><span>Member checks</span><h3>{floor.widthMm} × {floor.depthMm} {floor.grade}</h3></div></div>
              <UtilisationGauge value={floorResult.utilisation} />
              <CheckList checks={floorResult.checks} />
              <div className="uk-combination-card">
                <span>Design line action</span><strong>{fmt(floorResult.line.uls, 2)} kN/m</strong>
                <span>Governing ULS</span><strong>{floorResult.governingCombination}</strong>
              </div>
            </aside>
          </div>
        )}

        {active === "roof" && (
          <div className="uk-calc-shell">
            <aside className="uk-input-rail">
              <div className="uk-panel-title"><span>05</span><div><h3>Timber roof</h3><p>Rafter · purlin · ridge preview</p></div></div>
              <InputGroup title="Roof member">
                <SelectField label="Member type" value={roof.memberType} onChange={(memberType) => setRoof({ ...roof, memberType })} options={[{ value: "Common rafter", label: "Common rafter" }, { value: "Purlin", label: "Purlin" }, { value: "Structural ridge", label: "Structural ridge beam" }]} />
                <NumberField label="Member span" value={roof.spanM} onChange={(spanM) => setRoof({ ...roof, spanM })} unit="m" min={0.5} max={12} />
                <NumberField label="Roof pitch" value={roof.pitchDeg} onChange={(pitchDeg) => setRoof({ ...roof, pitchDeg })} unit="°" min={5} max={60} />
                <NumberField label="Plan tributary width" value={roof.planTributaryWidthM} onChange={(planTributaryWidthM) => setRoof({ ...roof, planTributaryWidthM })} unit="m" min={0.1} />
                <NumberField label="Width" value={roof.widthMm} onChange={(widthMm) => setRoof({ ...roof, widthMm })} unit="mm" step={1} min={25} />
                <NumberField label="Depth" value={roof.depthMm} onChange={(depthMm) => setRoof({ ...roof, depthMm })} unit="mm" step={5} min={75} />
                <SelectField label="Strength class" value={roof.grade} onChange={(grade) => setRoof({ ...roof, grade: grade as TimberGrade })} options={[{ value: "C16", label: "C16 softwood" }, { value: "C24", label: "C24 softwood" }]} />
              </InputGroup>
              <InputGroup title="Plan area actions">
                <NumberField label="Permanent Gk" value={roof.deadAreaKnM2} onChange={(deadAreaKnM2) => setRoof({ ...roof, deadAreaKnM2 })} unit="kN/m²" />
                <NumberField label="Snow / imposed Qk" value={roof.variableAreaKnM2} onChange={(variableAreaKnM2) => setRoof({ ...roof, variableAreaKnM2 })} unit="kN/m²" />
              </InputGroup>
            </aside>
            <section className="uk-model-panel">
              <ScopeBanner>single simply supported member under vertical permanent and roof variable actions; ψ₀ = 0.50.</ScopeBanner>
              <RoofViewport analysis={roofResult.displayAnalysis} pitchDeg={roof.pitchDeg} memberType={roof.memberType} lineLoad={roofResult.line.uls} />
              <div className="uk-exclusion-warning"><AlertTriangle size={16} /><span>Axial force, biaxial purlin bending, wind uplift, snow drift, lateral restraint, connections and bearing are reserved for the validated roof engine.</span></div>
            </section>
            <aside className="uk-result-rail">
              <div className="uk-result-heading"><CircleGauge size={18} /><div><span>Member checks</span><h3>{roof.memberType}</h3></div></div>
              <UtilisationGauge value={roofResult.utilisation} />
              <CheckList checks={roofResult.checks} />
              <div className="uk-combination-card">
                <span>Design line action</span><strong>{fmt(roofResult.line.uls, 2)} kN/m</strong>
                <span>Governing ULS</span><strong>{roofResult.governingCombination}</strong>
              </div>
            </aside>
          </div>
        )}
      </section>

      {showRoadmap && (
        <section className="uk-roadmap" aria-labelledby="roadmap-title">
          <div className="uk-section-heading">
            <div><span>Planned library</span><h2 id="roadmap-title">25 more calculators — coming soon</h2></div>
            <p>Ordered for the recurring needs of small UK structural practices.</p>
          </div>
          <div className="uk-roadmap-grid">
            {comingSoon.map(([number, title, description, phase]) => (
              <article key={number}>
                <div><span>{number}</span><i>{phase}</i></div>
                <h3>{title}</h3>
                <p>{description}</p>
                <small><LockKeyhole size={12} /> Coming soon</small>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="uk-quality-bar">
        <div><Warehouse size={21} /><span><strong>Shared calculation core</strong> One load engine, one analysis model, versioned material data.</span></div>
        <div><Ruler size={21} /><span><strong>Graphical by default</strong> Geometry, actions, reactions and diagrams stay in view.</span></div>
        <div><ShieldCheck size={21} /><span><strong>Validation-gated</strong> “Professional” status only after independent review and regression cases.</span></div>
      </section>
    </main>
  );
}
