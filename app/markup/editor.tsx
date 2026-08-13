"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BoxSelect,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Cloud,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  Focus,
  Hand,
  HelpCircle,
  Highlighter,
  ImagePlus,
  Library,
  Layers3,
  ListChecks,
  Minus,
  MousePointer2,
  MoveDiagonal2,
  OctagonAlert,
  PenLine,
  Pentagon,
  Plus,
  Redo2,
  Ruler,
  Save,
  Search,
  Square,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  createEditablePdf,
  type FillStyle,
  type LineStyle,
  type Markup,
  type MarkupKind,
  type PageScale,
  type Point,
  type Size,
  type Unit,
} from "@/lib/markup/pdf-annotation-engine";
import {
  deleteLocalProject,
  getLocalProject,
  listLocalProjects,
  saveLocalProject,
  updateLocalProjectState,
  type LocalProjectState,
  type LocalProjectSummary,
} from "@/lib/markup/local-project-store";
import { degrees, PDFDocument, PDFName, rgb, StandardFonts, type PDFFont } from "pdf-lib";

let pdfJsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfJsPromise;
}

type ActiveTool = "select" | "pan" | "reference" | "cutout" | MarkupKind;

type SavedSymbol = {
  id: string;
  name: string;
  markup: Markup;
};

type LibraryStatus = "loading" | "saving" | "saved" | "temporary";
type CalculationStatus = "idle" | "checking" | "verified" | "unavailable";
type ProjectSaveStatus = "idle" | "saving" | "saved" | "error";

const SYMBOL_STORAGE_KEY = "structura-markup-saved-symbols";
const AUTOSAVE_STORAGE_KEY = "structura-pro-autosave";

type SourceDocument = {
  kind: "pdf" | "image";
  name: string;
  pageCount: number;
  pdf?: PDFDocumentProxy;
  pdfBytes?: ArrayBuffer;
  image?: HTMLImageElement;
  imageBytes?: ArrayBuffer;
  imageType?: "png" | "jpeg";
};

type Draft = { kind: ActiveTool; points: Point[] };
type InspectorTab = "properties" | "appearance" | "measurement";

const TOOL_LABELS: Record<ActiveTool, string> = {
  select: "Select",
  pan: "Pan",
  text: "Text box",
  callout: "Callout",
  line: "Line",
  arrow: "Arrow",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  cloud: "Revision cloud",
  freehand: "Pen",
  highlight: "Highlighter",
  length: "Distance",
  polyline: "Distance path",
  perimeter: "Perimeter",
  area: "Area",
  volume: "Volume",
  diameter: "Diameter",
  radius: "Radius",
  slope: "Slope",
  angle: "Angle",
  count: "Tally",
  cutout: "Area cut-out",
  reference: "Reference scale",
};

const TOOL_ICONS: Record<ActiveTool, LucideIcon> = {
  select: MousePointer2,
  pan: Hand,
  text: Type,
  callout: ArrowDownToLine,
  line: Minus,
  arrow: ArrowRight,
  rectangle: Square,
  ellipse: Circle,
  cloud: Cloud,
  freehand: PenLine,
  highlight: Highlighter,
  length: MoveDiagonal2,
  polyline: PenLine,
  perimeter: Pentagon,
  area: Pentagon,
  volume: Square,
  diameter: Circle,
  radius: Ruler,
  slope: MoveDiagonal2,
  angle: MoveDiagonal2,
  count: Plus,
  cutout: Minus,
  reference: Ruler,
};

const TOOL_SHORTCUTS: Partial<Record<ActiveTool, string>> = {
  select: "V", pan: "P", text: "N", callout: "C", line: "L", rectangle: "R",
  ellipse: "E", highlight: "H", length: "M", polyline: "J", area: "Q", angle: "G", count: "K",
};

const TOOL_GROUPS: { name: string; tools: ActiveTool[] }[] = [
  { name: "Navigate", tools: ["select", "pan"] },
  {
    name: "Drawing tools",
    tools: ["text", "callout", "line", "arrow", "rectangle", "ellipse", "cloud", "freehand", "highlight"],
  },
  { name: "Quantities", tools: ["reference", "length", "polyline", "perimeter", "area", "volume", "diameter", "radius", "slope", "angle", "count"] },
];

const MULTI_POINT_TOOLS: ActiveTool[] = ["polyline", "perimeter", "area", "volume", "cutout"];
const MEASUREMENT_KINDS: MarkupKind[] = ["length", "polyline", "perimeter", "area", "volume", "diameter", "radius", "slope", "angle", "count"];
const LINEAR_MEASUREMENT_KINDS: MarkupKind[] = ["length", "polyline", "perimeter", "area", "volume", "diameter", "radius"];
const UNITS: { value: Unit; label: string }[] = [
  { value: "mm", label: "Millimetres (mm)" },
  { value: "cm", label: "Centimetres (cm)" },
  { value: "m", label: "Metres (m)" },
  { value: "in", label: "Inches (in)" },
  { value: "ft", label: "Feet (ft)" },
];
const UNIT_IN_METERS: Record<Unit, number> = { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048 };

const LINE_STYLES: { value: LineStyle; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "dashdot", label: "Dash-dot" },
  { value: "center", label: "Centre line" },
  { value: "hidden", label: "Hidden line" },
];

const FILL_STYLES: { value: FillStyle; label: string }[] = [
  { value: "none", label: "No fill" },
  { value: "solid", label: "Solid fill" },
  { value: "diagonal", label: "Diagonal hatch" },
  { value: "crosshatch", label: "Cross hatch" },
];

const DEFAULT_LAYERS = ["Existing", "Proposed", "Structural", "Architectural", "Services", "Revision"];

const DISCIPLINE_KITS = [
  { name: "Architect Review", color: "#e23b3b", icon: "A" },
  { name: "Contractor Review", color: "#f2b134", icon: "C" },
  { name: "Engineer Review", color: "#26a7c7", icon: "E" },
];

const SCALE_PRESETS = [
  { id: "metric-10", label: "1:10 · metric", unit: "m" as Unit, pixelsPerUnit: 283.4646 },
  { id: "metric-20", label: "1:20 · metric", unit: "m" as Unit, pixelsPerUnit: 141.7323 },
  { id: "metric-25", label: "1:25 · metric", unit: "m" as Unit, pixelsPerUnit: 113.3858 },
  { id: "metric-50", label: "1:50 · metric", unit: "m" as Unit, pixelsPerUnit: 56.6929 },
  { id: "metric-75", label: "1:75 · metric", unit: "m" as Unit, pixelsPerUnit: 37.7953 },
  { id: "metric-100", label: "1:100 · metric", unit: "m" as Unit, pixelsPerUnit: 28.3465 },
  { id: "metric-200", label: "1:200 · metric", unit: "m" as Unit, pixelsPerUnit: 14.1732 },
  { id: "metric-250", label: "1:250 · metric", unit: "m" as Unit, pixelsPerUnit: 11.3386 },
  { id: "metric-500", label: "1:500 · metric", unit: "m" as Unit, pixelsPerUnit: 5.6693 },
  { id: "metric-1000", label: "1:1000 · metric", unit: "m" as Unit, pixelsPerUnit: 2.8346 },
  { id: "arch-8", label: "1/8\" = 1'-0\"", unit: "ft" as Unit, pixelsPerUnit: 9 },
  { id: "arch-4", label: "1/4\" = 1'-0\"", unit: "ft" as Unit, pixelsPerUnit: 18 },
  { id: "arch-2", label: "1/2\" = 1'-0\"", unit: "ft" as Unit, pixelsPerUnit: 36 },
  { id: "eng-10", label: "1\" = 10'", unit: "ft" as Unit, pixelsPerUnit: 7.2 },
  { id: "eng-20", label: "1\" = 20'", unit: "ft" as Unit, pixelsPerUnit: 3.6 },
] as const;

const COLORS = ["#f04a3e", "#f2b134", "#23b88b", "#2f8cff", "#8758e5", "#111827"];

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function formatProjectDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function safePdfText(value: unknown) {
  return String(value ?? "")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/°/g, " deg")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "");
}

function fitPdfText(text: string, width: number, font: PDFFont, size: number) {
  const safe = safePdfText(text);
  if (font.widthOfTextAtSize(safe, size) <= width) return safe;
  let clipped = safe;
  while (clipped.length > 1 && font.widthOfTextAtSize(`${clipped}...`, size) > width) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}...`;
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function constrainPoint(start: Point, end: Point) {
  const length = distance(start, end);
  const angle = Math.round(Math.atan2(end.y - start.y, end.x - start.x) / (Math.PI / 4)) * (Math.PI / 4);
  return { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
}

function polygonArea(points: Point[]) {
  if (points.length < 3) return 0;
  return Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2,
  );
}

function pathLength(points: Point[], closed = false) {
  if (points.length < 2) return 0;
  const path = closed ? [...points, points[0]] : points;
  return path.slice(1).reduce((total, point, index) => total + distance(path[index], point), 0);
}

function netRegionArea(markup: Markup) {
  return Math.max(0, polygonArea(markup.points) - (markup.holes || []).reduce((total, hole) => total + polygonArea(hole), 0));
}

function regionPath(markup: Markup) {
  const path = new Path2D();
  const add = (points: Point[]) => {
    if (!points.length) return;
    path.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => path.lineTo(point.x, point.y));
    path.closePath();
  };
  add(markup.points);
  (markup.holes || []).forEach(add);
  return path;
}

function angleDegrees(points: Point[]) {
  if (points.length < 3) return 0;
  const [a, vertex, c] = points;
  const first = Math.atan2(a.y - vertex.y, a.x - vertex.x);
  const second = Math.atan2(c.y - vertex.y, c.x - vertex.x);
  let degrees = Math.abs((second - first) * 180 / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

function lineDash(style: LineStyle | undefined, width: number) {
  if (style === "dashed") return [width * 4, width * 2];
  if (style === "dotted") return [width, width * 2];
  if (style === "dashdot") return [width * 4, width * 2, width, width * 2];
  if (style === "center") return [width * 7, width * 2, width * 1.5, width * 2];
  if (style === "hidden") return [width * 2, width * 2];
  return [];
}

function fillHatch(ctx: CanvasRenderingContext2D, bounds: ReturnType<typeof getBounds>, markup: Markup, clipPath?: Path2D) {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (!markup.fillStyle || markup.fillStyle === "none") return;
  ctx.save();
  if (clipPath) ctx.clip(clipPath, "evenodd");
  else {
    ctx.beginPath();
    ctx.rect(bounds.minX, bounds.minY, width, height);
    ctx.clip();
  }
  ctx.strokeStyle = markup.fillColor || markup.stroke;
  ctx.fillStyle = markup.fillColor || markup.stroke;
  if (markup.fillStyle === "solid") {
    ctx.globalAlpha = Math.min(markup.opacity, 0.35);
    ctx.fillRect(bounds.minX, bounds.minY, width, height);
  } else {
    ctx.globalAlpha = Math.min(markup.opacity, 0.55);
    ctx.lineWidth = 1;
    for (let offset = -height; offset < width + height; offset += 10) {
      ctx.beginPath();
      ctx.moveTo(bounds.minX + offset, bounds.minY);
      ctx.lineTo(bounds.minX + offset + height, bounds.maxY);
      ctx.stroke();
      if (markup.fillStyle === "crosshatch") {
        ctx.beginPath();
        ctx.moveTo(bounds.minX + offset, bounds.maxY);
        ctx.lineTo(bounds.minX + offset + height, bounds.minY);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawRevisionCloud(ctx: CanvasRenderingContext2D, bounds: ReturnType<typeof getBounds>) {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const radius = Math.max(5, Math.min(11, Math.min(width, height) / 7));
  const points: Point[] = [];
  const addEdge = (start: Point, end: Point) => {
    const length = distance(start, end);
    const count = Math.max(2, Math.ceil(length / (radius * 1.55)));
    for (let index = 0; index < count; index += 1) {
      const t = index / count;
      points.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
    }
  };
  addEdge({ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.minY });
  addEdge({ x: bounds.maxX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY });
  addEdge({ x: bounds.maxX, y: bounds.maxY }, { x: bounds.minX, y: bounds.maxY });
  addEdge({ x: bounds.minX, y: bounds.maxY }, { x: bounds.minX, y: bounds.minY });
  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function convertUnit(value: number, from: Unit, to: Unit, power = 1) {
  return value * (UNIT_IN_METERS[from] / UNIT_IN_METERS[to]) ** power;
}

function measurementResult(markup: Markup, scale?: PageScale): { value: number; unit: string; valid: boolean } {
  if (markup.kind === "count") return { value: 1, unit: "items", valid: true };
  if (markup.kind === "angle" && markup.points.length > 2) {
    const degrees = angleDegrees(markup.points);
    return markup.angleUnit === "radians"
      ? { value: degrees * Math.PI / 180, unit: "rad", valid: true }
      : { value: degrees, unit: "°", valid: true };
  }
  if (markup.kind === "slope" && markup.points.length > 1) {
    const run = Math.abs(markup.points[1].x - markup.points[0].x);
    const rise = Math.abs(markup.points[1].y - markup.points[0].y);
    if (!run) return { value: Number.POSITIVE_INFINITY, unit: "vertical", valid: true };
    const ratio = rise / run;
    if (markup.slopeUnit === "ratio") return { value: ratio > 0 ? 1 / ratio : 0, unit: "ratio", valid: true };
    if (markup.slopeUnit === "degrees") return { value: Math.atan(ratio) * 180 / Math.PI, unit: "°", valid: true };
    return { value: ratio * 100, unit: "%", valid: true };
  }
  if (!scale || !LINEAR_MEASUREMENT_KINDS.includes(markup.kind)) return { value: 0, unit: "unscaled", valid: false };
  const outputUnit = markup.displayUnit || scale.unit;
  if (["length", "diameter", "radius"].includes(markup.kind) && markup.points.length > 1) {
    return { value: convertUnit(distance(markup.points[0], markup.points[1]) / scale.pixelsPerUnit, scale.unit, outputUnit), unit: outputUnit, valid: true };
  }
  if (["polyline", "perimeter"].includes(markup.kind) && markup.points.length > 1) {
    return { value: convertUnit(pathLength(markup.points, markup.kind === "perimeter") / scale.pixelsPerUnit, scale.unit, outputUnit), unit: outputUnit, valid: true };
  }
  if (["area", "volume"].includes(markup.kind) && markup.points.length > 2) {
    const area = netRegionArea(markup) / scale.pixelsPerUnit ** 2;
    if (markup.kind === "volume") {
      const depth = convertUnit(Math.max(0, markup.depth || 0), markup.depthUnit || scale.unit, scale.unit);
      return { value: convertUnit(area * depth, scale.unit, outputUnit, 3), unit: `${outputUnit}³`, valid: true };
    }
    return { value: convertUnit(area, scale.unit, outputUnit, 2), unit: `${outputUnit}²`, valid: true };
  }
  return { value: 0, unit: outputUnit, valid: false };
}

function formatMeasurement(markup: Markup, scale?: PageScale) {
  const precision = Math.max(0, Math.min(4, markup.precision ?? 2));
  const result = measurementResult(markup, scale);
  if (!result.valid) return LINEAR_MEASUREMENT_KINDS.includes(markup.kind) ? "Set scale" : "—";
  if (result.unit === "vertical") return "Vertical";
  if (result.unit === "ratio") return `1:${result.value.toFixed(Math.max(1, precision))}`;
  if (markup.kind === "count") return "1 item";
  const shownPrecision = markup.kind === "angle" ? Math.max(markup.angleUnit === "radians" ? 2 : 1, precision) : precision;
  return `${result.value.toFixed(shownPrecision)} ${result.unit}`;
}

function getBounds(points: Point[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function pointToSegmentDistance(point: Point, start: Point, end: Point) {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (!lengthSquared) return distance(point, start);
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * (end.x - start.x) +
        (point.y - start.y) * (end.y - start.y)) /
        lengthSquared,
    ),
  );
  return distance(point, {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
  });
}

function pointInPolygon(point: Point, points: Point[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    const intersect =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || 1) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

function hitMarkup(point: Point, markup: Markup, tolerance: number) {
  if (!markup.visible) return false;
  if (markup.kind === "text") {
    const start = markup.points[0];
    const fontSize = markup.fontSize || 15;
    const width = Math.max(54, (markup.text || "Note").length * fontSize * 0.66 + 16);
    return point.x >= start.x - tolerance && point.x <= start.x + width + tolerance &&
      point.y >= start.y - fontSize - 7 - tolerance && point.y <= start.y + 8 + tolerance;
  }
  if (markup.kind === "count") {
    return distance(point, markup.points[0]) <= tolerance * 2.2;
  }
  if (markup.kind === "rectangle" || markup.kind === "ellipse" || markup.kind === "cloud" || markup.kind === "callout") {
    const end = markup.points[1] || markup.points[0];
    const hitPoints = markup.kind === "callout"
      ? [...markup.points, { x: end.x + Math.max(72, (markup.text || "Review").length * (markup.fontSize || 13) * 0.6 + 16), y: end.y - (markup.fontSize || 13) - 16 }]
      : markup.points;
    const bounds = getBounds(hitPoints);
    return (
      point.x >= bounds.minX - tolerance &&
      point.x <= bounds.maxX + tolerance &&
      point.y >= bounds.minY - tolerance &&
      point.y <= bounds.maxY + tolerance
    );
  }
  if (["area", "volume"].includes(markup.kind)) {
    return pointInPolygon(point, markup.points) && !(markup.holes || []).some((hole) => pointInPolygon(point, hole));
  }
  if (markup.kind === "perimeter") {
    return markup.points.some((current, index) => pointToSegmentDistance(point, current, markup.points[(index + 1) % markup.points.length]) <= tolerance);
  }
  return markup.points.some((current, index) => {
    if (index === markup.points.length - 1) return distance(point, current) <= tolerance;
    return pointToSegmentDistance(point, current, markup.points[index + 1]) <= tolerance;
  });
}

function drawTag(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  markup: Markup,
) {
  ctx.save();
  const fontSize = Math.max(7, Math.min(72, markup.fontSize || 11));
  const fontFamily = markup.fontFamily === "Times Roman" ? "Georgia" : markup.fontFamily === "Courier" ? "Courier New" : "Arial";
  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  const width = ctx.measureText(text).width + 10;
  const height = fontSize + 7;
  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.strokeStyle = markup.stroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height, width, height, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = markup.stroke;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - height / 2);
  ctx.restore();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, start: Point, end: Point, color: string) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const size = 10;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - size * Math.cos(angle - Math.PI / 6), end.y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(end.x - size * Math.cos(angle + Math.PI / 6), end.y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMarkup(
  ctx: CanvasRenderingContext2D,
  markup: Markup,
  scale?: PageScale,
  selected = false,
  countNumber?: number,
) {
  if (!markup.visible || !markup.points.length) return;
  const [start, end = start] = markup.points;
  let bounds = getBounds(markup.points);
  if (markup.kind === "text") {
    const fontSize = markup.fontSize || 15;
    bounds = {
      minX: start.x - 4,
      minY: start.y - fontSize - 3,
      maxX: start.x + Math.max(54, (markup.text || "Note").length * fontSize * 0.66 + 14),
      maxY: start.y + 7,
    };
  } else if (markup.kind === "count") {
    bounds = { minX: start.x - 12, minY: start.y - 12, maxX: start.x + 12, maxY: start.y + 12 };
  } else if (markup.kind === "callout") {
    const fontSize = markup.fontSize || 13;
    const labelWidth = Math.max(72, (markup.text || "Review").length * fontSize * 0.6 + 16);
    const raw = getBounds([...markup.points, { x: end.x + labelWidth, y: end.y - fontSize - 16 }]);
    bounds = raw;
  }
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);

  ctx.save();
  ctx.globalAlpha = markup.opacity;
  ctx.strokeStyle = markup.stroke;
  ctx.fillStyle = markup.fill || "transparent";
  ctx.lineWidth = markup.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(lineDash(markup.lineStyle, markup.strokeWidth));

  if (markup.kind === "rectangle" || markup.kind === "highlight") {
    if (markup.kind === "highlight") {
      ctx.fillStyle = markup.stroke;
      ctx.globalAlpha = Math.min(markup.opacity, 0.32);
      ctx.fillRect(bounds.minX, bounds.minY, width, height);
    } else {
      fillHatch(ctx, bounds, markup);
      if (markup.fill && markup.fill !== "transparent" && (!markup.fillStyle || markup.fillStyle === "none")) ctx.fillRect(bounds.minX, bounds.minY, width, height);
      ctx.strokeRect(bounds.minX, bounds.minY, width, height);
    }
  } else if (markup.kind === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(
      bounds.minX + width / 2,
      bounds.minY + height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2,
    );
    if (markup.fill && markup.fill !== "transparent") ctx.fill();
    ctx.stroke();
  } else if (markup.kind === "cloud") {
    ctx.setLineDash([]);
    drawRevisionCloud(ctx, bounds);
  } else if (markup.kind === "text") {
    ctx.globalAlpha = 1;
    const fontSize = markup.fontSize || 15;
    const fontFamily = markup.fontFamily === "Times Roman" ? "Georgia" : markup.fontFamily === "Courier" ? "Courier New" : "Arial";
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    const text = markup.text || "Note";
    const tagWidth = ctx.measureText(text).width + 14;
    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.strokeStyle = markup.stroke;
    ctx.lineWidth = Math.max(1, markup.strokeWidth);
    ctx.beginPath();
    ctx.roundRect(start.x - 4, start.y - fontSize - 3, tagWidth, fontSize + 10, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = markup.stroke;
    ctx.textBaseline = "middle";
    ctx.fillText(text, start.x + 3, start.y + 1 - fontSize / 2);
  } else if (markup.kind === "callout") {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    drawArrowHead(ctx, end, start, markup.stroke);
    const text = markup.text || "Review";
    const fontSize = markup.fontSize || 13;
    const fontFamily = markup.fontFamily === "Times Roman" ? "Georgia" : markup.fontFamily === "Courier" ? "Courier New" : "Arial";
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    const tagWidth = Math.max(72, ctx.measureText(text).width + 16);
    const tagHeight = fontSize + 12;
    ctx.fillStyle = "rgba(255,255,255,.95)";
    ctx.fillRect(end.x, end.y - tagHeight - 3, tagWidth, tagHeight);
    ctx.strokeRect(end.x, end.y - tagHeight - 3, tagWidth, tagHeight);
    ctx.fillStyle = markup.stroke;
    ctx.fillText(text, end.x + 7, end.y - tagHeight / 2 - 3);
  } else if (markup.kind === "count") {
    ctx.globalAlpha = 1;
    ctx.fillStyle = markup.stroke;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "700 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(countNumber || 1), start.x, start.y);
  } else {
    const isRegion = markup.kind === "area" || markup.kind === "volume";
    const closes = isRegion || markup.kind === "perimeter";
    if (isRegion) {
      const path = regionPath(markup);
      if (markup.fillStyle && markup.fillStyle !== "none") fillHatch(ctx, bounds, markup, path);
      else {
        ctx.fillStyle = markup.fill || `${markup.stroke}22`;
        ctx.fill(path, "evenodd");
      }
      ctx.stroke(path);
    } else {
      ctx.beginPath();
      markup.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      if (closes) ctx.closePath();
      ctx.stroke();
    }
    if (markup.kind === "arrow") drawArrowHead(ctx, start, end, markup.stroke);
    if (["diameter", "radius"].includes(markup.kind)) {
      const radius = markup.kind === "diameter" ? distance(start, end) / 2 : distance(start, end);
      const center = markup.kind === "diameter" ? { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 } : start;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (markup.kind === "slope") {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.restore();
    }
    if (["length", "diameter", "radius", "slope"].includes(markup.kind)) {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const dx = Math.cos(angle + Math.PI / 2) * 5;
      const dy = Math.sin(angle + Math.PI / 2) * 5;
      ctx.beginPath();
      ctx.moveTo(start.x - dx, start.y - dy);
      ctx.lineTo(start.x + dx, start.y + dy);
      ctx.moveTo(end.x - dx, end.y - dy);
      ctx.lineTo(end.x + dx, end.y + dy);
      ctx.stroke();
      drawTag(ctx, formatMeasurement(markup, scale), (start.x + end.x) / 2, (start.y + end.y) / 2, markup);
    }
    if (["polyline", "perimeter"].includes(markup.kind)) {
      const labelPoint = markup.kind === "perimeter"
        ? markup.points.reduce((sum, point) => ({ x: sum.x + point.x / markup.points.length, y: sum.y + point.y / markup.points.length }), { x: 0, y: 0 })
        : markup.points[Math.floor(markup.points.length / 2)];
      drawTag(ctx, formatMeasurement(markup, scale), labelPoint.x, labelPoint.y, markup);
    }
    if (isRegion) {
      const center = markup.points.reduce(
        (sum, point) => ({ x: sum.x + point.x / markup.points.length, y: sum.y + point.y / markup.points.length }),
        { x: 0, y: 0 },
      );
      drawTag(ctx, formatMeasurement(markup, scale), center.x, center.y, markup);
    }
    if (markup.kind === "angle" && markup.points.length > 2) {
      const [armA, vertex, armB] = markup.points;
      const radius = Math.min(30, distance(armA, vertex) / 3, distance(armB, vertex) / 3);
      const startAngle = Math.atan2(armA.y - vertex.y, armA.x - vertex.x);
      const endAngle = Math.atan2(armB.y - vertex.y, armB.x - vertex.x);
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, radius, startAngle, endAngle, endAngle < startAngle);
      ctx.stroke();
      drawTag(ctx, formatMeasurement(markup, scale), vertex.x, vertex.y - radius - 4, markup);
    }
  }

  ctx.restore();

  if (selected) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#2f8cff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(bounds.minX - 5, bounds.minY - 5, width + 10, height + 10);
    ctx.setLineDash([]);
    [
      [bounds.minX - 5, bounds.minY - 5],
      [bounds.maxX + 5, bounds.minY - 5],
      [bounds.maxX + 5, bounds.maxY + 5],
      [bounds.minX - 5, bounds.maxY + 5],
    ].forEach(([x, y]) => {
      ctx.fillRect(x - 3, y - 3, 6, 6);
      ctx.strokeRect(x - 3, y - 3, 6, 6);
    });
    markup.points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = index === 0 ? "#ffffff" : "#2f8cff";
      ctx.fill();
      ctx.strokeStyle = "#176ac1";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.restore();
  }
}

function downloadBytes(bytes: Uint8Array | Blob, filename: string, type = "application/pdf") {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function canvasOutputScale(size: Size, displayScale: number) {
  const desired = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  const cssWidth = Math.max(1, size.width * displayScale);
  const cssHeight = Math.max(1, size.height * displayScale);
  const dimensionLimit = 8192 / Math.max(cssWidth, cssHeight);
  const areaLimit = Math.sqrt(40_000_000 / (cssWidth * cssHeight));
  return Math.max(0.75, Math.min(desired, dimensionLimit, areaLimit));
}

async function renderOverlayPng(size: Size, pageMarkups: Markup[], scale?: PageScale) {
  const exportScale = Math.min(2, 2400 / Math.max(size.width, size.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(size.width * exportScale));
  canvas.height = Math.max(1, Math.round(size.height * exportScale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The flattened overlay could not be rendered.");
  context.setTransform(exportScale, 0, 0, exportScale, 0, 0);
  let tally = 0;
  pageMarkups.filter((markup) => markup.visible).forEach((markup) => {
    if (markup.kind === "count") tally += 1;
    drawMarkup(context, markup, scale, false, markup.kind === "count" ? tally : undefined);
  });
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("The flattened overlay could not be encoded.")), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

function ToolButton({
  tool,
  active,
  onClick,
}: {
  tool: ActiveTool;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = TOOL_ICONS[tool];
  return (
    <button
      className={`tool-button ${active ? "is-active" : ""}`}
      type="button"
      onClick={onClick}
      aria-label={TOOL_LABELS[tool]}
      title={`${TOOL_LABELS[tool]}${TOOL_SHORTCUTS[tool] ? ` (${TOOL_SHORTCUTS[tool]})` : ""}`}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
      <span>{TOOL_LABELS[tool]}</span>
    </button>
  );
}

type PdfViewportLike = {
  width: number;
  height: number;
  convertToViewportPoint: (x: number, y: number) => number[];
};

type PdfAnnotationData = {
  id?: string;
  annotationType?: number;
  rect?: number[];
  lineCoordinates?: ArrayLike<number> | { x1: number; y1: number; x2: number; y2: number };
  vertices?: ArrayLike<number> | Array<{ x: number; y: number }>;
  inkLists?: Array<ArrayLike<number> | Array<{ x: number; y: number }>>;
  color?: ArrayLike<number>;
  interiorColor?: ArrayLike<number>;
  opacity?: number;
  borderStyle?: { width?: number; style?: number };
  contents?: string;
  contentsObj?: { str?: string };
  title?: string;
  titleObj?: { str?: string };
  subject?: string;
  modificationDate?: string;
  defaultAppearanceData?: { fontSize?: number };
};

function annotationColor(color?: ArrayLike<number>) {
  if (!color || color.length < 3) return "#f04a3e";
  const max = Math.max(Number(color[0]), Number(color[1]), Number(color[2])) <= 1 ? 255 : 1;
  return `#${[0, 1, 2].map((index) => Math.round(Number(color[index]) * max).toString(16).padStart(2, "0")).join("")}`;
}

function importAnnotation(data: PdfAnnotationData, viewport: PdfViewportLike, page: number): Markup | null {
  const rect = data.rect && data.rect.length >= 4
    ? [...viewport.convertToViewportPoint(data.rect[0], data.rect[1]), ...viewport.convertToViewportPoint(data.rect[2], data.rect[3])]
    : [40, 40, 120, 80];
  const bounds = {
    minX: Math.min(rect[0], rect[2]), minY: Math.min(rect[1], rect[3]),
    maxX: Math.max(rect[0], rect[2]), maxY: Math.max(rect[1], rect[3]),
  };
  const mapPoint = (point: { x: number; y: number }): Point => {
    const [x, y] = viewport.convertToViewportPoint(point.x, point.y);
    return { x, y };
  };
  const mapCoordinateList = (values: ArrayLike<number> | Array<{ x: number; y: number }> | undefined) => {
    if (!values?.length) return [];
    if (typeof values[0] === "number") {
      const points: Point[] = [];
      for (let index = 0; index + 1 < values.length; index += 2) {
        points.push(mapPoint({ x: Number(values[index]), y: Number(values[index + 1]) }));
      }
      return points;
    }
    return Array.from(values as ArrayLike<{ x: number; y: number }>).map(mapPoint);
  };
  const type = data.annotationType;
  let kind: MarkupKind;
  let points: Point[];
  if (type === 1 || type === 3) {
    kind = "text";
    points = [{ x: bounds.minX, y: bounds.maxY }];
  } else if (type === 4 && data.lineCoordinates) {
    kind = "line";
    if ("x1" in data.lineCoordinates) {
      points = [mapPoint({ x: data.lineCoordinates.x1, y: data.lineCoordinates.y1 }), mapPoint({ x: data.lineCoordinates.x2, y: data.lineCoordinates.y2 })];
    } else {
      points = mapCoordinateList(data.lineCoordinates);
    }
  } else if (type === 5) {
    kind = "rectangle";
    points = [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }];
  } else if (type === 6) {
    kind = "ellipse";
    points = [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }];
  } else if ((type === 7 || type === 8) && data.vertices?.length) {
    kind = type === 7 ? "area" : "polyline";
    points = mapCoordinateList(data.vertices);
  } else if ([9, 10, 11, 12].includes(type || 0)) {
    kind = "highlight";
    points = [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }];
  } else if (type === 15 && data.inkLists?.[0]?.length) {
    kind = "freehand";
    points = mapCoordinateList(data.inkLists[0]);
  } else if (type === 13) {
    kind = "rectangle";
    points = [{ x: bounds.minX, y: bounds.minY }, { x: bounds.maxX, y: bounds.maxY }];
  } else {
    return null;
  }
  if (!points.length) return null;
  const text = data.contentsObj?.str || data.contents || data.subject || "Imported note";
  const stroke = annotationColor(data.color);
  return {
    id: crypto.randomUUID(),
    page,
    kind,
    points,
    text: kind === "text" ? text : undefined,
    subject: data.subject || `Imported ${TOOL_LABELS[kind]}`,
    comment: kind === "text" ? "" : text,
    author: data.titleObj?.str || data.title || "Imported author",
    stroke,
    fill: "transparent",
    strokeWidth: Math.max(1, data.borderStyle?.width || (kind === "highlight" ? 14 : 2)),
    opacity: data.opacity ?? (kind === "highlight" ? 0.28 : 1),
    visible: true,
    createdAt: data.modificationDate || new Date().toISOString(),
    fontFamily: "Helvetica",
    fontSize: data.defaultAppearanceData?.fontSize || 15,
    status: "Open",
    lineStyle: data.borderStyle?.style === 2 ? "dashed" : "solid",
    fillStyle: data.interiorColor ? "solid" : "none",
    fillColor: data.interiorColor ? annotationColor(data.interiorColor) : stroke,
    layer: "Imported annotations",
    sourceAnnotationRef: data.id,
    sourceAnnotationName: data.id,
    precision: 2,
  };
}

export function StructuraEditor() {
  const [source, setSource] = useState<SourceDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizes, setPageSizes] = useState<Record<number, Size>>({});
  const [activeTool, setActiveTool] = useState<ActiveTool>("select");
  const [markups, setMarkups] = useState<Markup[]>([]);
  const [past, setPast] = useState<Markup[][]>([]);
  const [future, setFuture] = useState<Markup[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [scales, setScales] = useState<Record<number, PageScale>>({});
  const [referenceSetup, setReferenceSetup] = useState<{ points: [Point, Point]; value: string; unit: Unit } | null>(null);
  const [scalePresetId, setScalePresetId] = useState("metric-50");
  const [textEntry, setTextEntry] = useState<{ point: Point; value: string; fontFamily: NonNullable<Markup["fontFamily"]>; fontSize: number; editingId?: string; kind?: "text" | "callout" } | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("properties");
  const [calculationStatus, setCalculationStatus] = useState<CalculationStatus>("idle");
  const [serverMeasurement, setServerMeasurement] = useState<{ display: string; warnings: string[] } | null>(null);
  const [stroke, setStroke] = useState("#f04a3e");
  const strokeWidth = 3;
  const opacity = 1;
  const [lineStyle, setLineStyle] = useState<LineStyle>("solid");
  const [fillStyle, setFillStyle] = useState<FillStyle>("none");
  const [fillColor, setFillColor] = useState("#f2b134");
  const [measurementPrecision, setMeasurementPrecision] = useState(2);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(false);
  const [gridSpacing, setGridSpacing] = useState(10);
  const [snapIndicator, setSnapIndicator] = useState<Point | null>(null);
  const [cutoutTargetId, setCutoutTargetId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState("Structural");
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>(() => Object.fromEntries(DEFAULT_LAYERS.map((layer) => [layer, true])));
  const [customScaleRatio, setCustomScaleRatio] = useState("75");
  const [removedSourceAnnotationRefs, setRemovedSourceAnnotationRefs] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [savedSymbols, setSavedSymbols] = useState<SavedSymbol[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus>("loading");
  const [bottomOpen, setBottomOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<LocalProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectSaveStatus, setProjectSaveStatus] = useState<ProjectSaveStatus>("idle");
  const [projectStorageReady, setProjectStorageReady] = useState(true);
  const [projectBusyId, setProjectBusyId] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [dropActive, setDropActive] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [registerQuery, setRegisterQuery] = useState("");
  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({
    Navigate: true,
    "Drawing tools": true,
    Quantities: true,
    "Saved presets": true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectBackupInputRef = useRef<HTMLInputElement>(null);
  const presetLibraryInputRef = useRef<HTMLInputElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const panRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const dragRef = useRef<{ id: string; start: Point; original: Markup[]; moved: boolean } | null>(null);
  const vertexDragRef = useRef<{ id: string; index: number; original: Markup[]; moved: boolean } | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const localProjectsRef = useRef<LocalProjectSummary[]>([]);
  const projectHydratingRef = useRef(false);

  const selectedMarkup = useMemo(
    () => markups.find((markup) => markup.id === selectedId) || null,
    [markups, selectedId],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (!selectedMarkup || !MEASUREMENT_KINDS.includes(selectedMarkup.kind)) {
        setCalculationStatus("idle");
        setServerMeasurement(null);
        return;
      }
      setCalculationStatus("checking");
      fetch("/api/markup/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "calculate", markups: [selectedMarkup], scales: { [selectedMarkup.page]: scales[selectedMarkup.page] } }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Calculation service unavailable");
          return response.json() as Promise<{ results?: { display: string; warnings: string[] }[] }>;
        })
        .then((payload) => {
          setServerMeasurement(payload.results?.[0] || null);
          setCalculationStatus("verified");
        })
        .catch((cause) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setCalculationStatus("unavailable");
          setServerMeasurement(null);
        });
    }, selectedMarkup ? 260 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [scales, selectedMarkup]);
  const currentSize = pageSizes[currentPage];
  const currentScale = scales[currentPage];
  const displayScale = Math.max(0.05, fitScale * zoom);
  const visiblePageMarkups = useMemo(
    () => markups.filter((markup) => markup.page === currentPage && markup.visible && layerVisibility[markup.layer || "Structural"] !== false),
    [markups, currentPage, layerVisibility],
  );
  const measurementSummary = useMemo(() => {
    const groups = new Map<string, { layer: string; type: string; items: number; total: number; unit: string; precision: number }>();
    markups.filter((markup) => MEASUREMENT_KINDS.includes(markup.kind)).forEach((markup) => {
      const layer = markup.layer || "Structural";
      const scale = scales[markup.page];
      const result = measurementResult(markup, scale);
      const unit = result.unit;
      const value = Number.isFinite(result.value) ? result.value : 0;
      const key = `${layer}|${markup.kind}|${unit}`;
      const current = groups.get(key) || { layer, type: TOOL_LABELS[markup.kind], items: 0, total: 0, unit, precision: markup.precision ?? measurementPrecision };
      current.items += 1;
      current.total += value;
      current.precision = Math.max(current.precision, markup.precision ?? measurementPrecision);
      groups.set(key, current);
    });
    return [...groups.values()].sort((a, b) => a.layer.localeCompare(b.layer) || a.type.localeCompare(b.type));
  }, [markups, measurementPrecision, scales]);
  const allLayers = useMemo(
    () => [...new Set([...DEFAULT_LAYERS, "Imported annotations", ...markups.map((markup) => markup.layer || "Structural")])],
    [markups],
  );
  const filteredMarkups = useMemo(() => {
    const query = registerQuery.trim().toLowerCase();
    if (!query) return markups;
    return markups.filter((markup) =>
      [TOOL_LABELS[markup.kind], markup.subject, markup.layer, markup.comment, markup.author, markup.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [markups, registerQuery]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(SYMBOL_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) as SavedSymbol[] : [];
        setSavedSymbols(Array.isArray(parsed) ? parsed : []);
        setLibraryStatus("saved");
      } catch {
        setLibraryStatus("temporary");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const refreshLocalProjects = useCallback(async () => {
    try {
      const projects = await listLocalProjects();
      localProjectsRef.current = projects;
      setLocalProjects(projects);
      setProjectStorageReady(true);
    } catch {
      setProjectStorageReady(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedPreference = window.localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (storedPreference === "off") setAutoSaveEnabled(false);
      void refreshLocalProjects();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshLocalProjects]);

  const commitMarkups = useCallback(
    (next: Markup[]) => {
      setPast((history) => [...history.slice(-39), markups]);
      setFuture([]);
      setMarkups(next);
    },
    [markups],
  );

  const undo = useCallback(() => {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setPast((history) => history.slice(0, -1));
    setFuture((history) => [markups, ...history].slice(0, 40));
    setMarkups(previous);
    setSelectedId(null);
  }, [markups, past]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];
    setFuture((history) => history.slice(1));
    setPast((history) => [...history, markups].slice(-40));
    setMarkups(next);
    setSelectedId(null);
  }, [future, markups]);

  const addMarkup = useCallback(
    (kind: MarkupKind, points: Point[], template?: Markup, patch?: Partial<Markup>) => {
      const isHighlight = kind === "highlight";
      const markup: Markup = {
        id: crypto.randomUUID(),
        page: currentPage,
        kind,
        points,
        text: template?.text || (kind === "text" ? "Add note" : kind === "callout" ? "Review" : undefined),
        subject: template?.subject || TOOL_LABELS[kind],
        comment: template?.comment || "",
        author: template?.author || "You",
        stroke: template?.stroke || stroke,
        fill: template?.fill || (["area", "volume"].includes(kind) ? `${stroke}1f` : "transparent"),
        strokeWidth: template?.strokeWidth || (isHighlight ? 14 : strokeWidth),
        opacity: template?.opacity ?? (isHighlight ? 0.28 : opacity),
        visible: true,
        createdAt: new Date().toISOString(),
        fontFamily: template?.fontFamily || "Helvetica",
        fontSize: template?.fontSize || (kind === "callout" ? 13 : 15),
        status: template?.status || "Open",
        lineStyle: template?.lineStyle || lineStyle,
        fillStyle: template?.fillStyle || fillStyle,
        fillColor: template?.fillColor || fillColor,
        layer: template?.layer || activeLayer,
        holes: template?.holes ? structuredClone(template.holes) : undefined,
        depth: template?.depth ?? (kind === "volume" ? 1 : undefined),
        depthUnit: template?.depthUnit ?? (kind === "volume" ? scales[currentPage]?.unit || "m" : undefined),
        displayUnit: template?.displayUnit ?? (LINEAR_MEASUREMENT_KINDS.includes(kind) ? scales[currentPage]?.unit : undefined),
        angleUnit: template?.angleUnit ?? (kind === "angle" ? "degrees" : undefined),
        slopeUnit: template?.slopeUnit ?? (kind === "slope" ? "percent" : undefined),
        precision: template?.precision ?? measurementPrecision,
        ...patch,
      };
      commitMarkups([...markups, markup]);
      setSelectedId(markup.id);
      setActiveTool("select");
      return markup;
    },
    [activeLayer, commitMarkups, currentPage, fillColor, fillStyle, lineStyle, markups, measurementPrecision, opacity, scales, stroke, strokeWidth],
  );

  const updateSelected = useCallback(
    (patch: Partial<Markup>) => {
      if (!selectedId) return;
      commitMarkups(markups.map((markup) => (markup.id === selectedId ? { ...markup, ...patch } : markup)));
    },
    [commitMarkups, markups, selectedId],
  );

  const deleteMarkup = useCallback(
    (id: string) => {
      const target = markups.find((markup) => markup.id === id);
      if (target?.locked) {
        setError("Unlock this markup before deleting it.");
        return;
      }
      if (target?.sourceAnnotationRef) {
        setRemovedSourceAnnotationRefs((refs) => refs.includes(target.sourceAnnotationRef!) ? refs : [...refs, target.sourceAnnotationRef!]);
      }
      commitMarkups(markups.filter((markup) => markup.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [commitMarkups, markups, selectedId],
  );

  const duplicateSelected = useCallback(() => {
    if (!selectedMarkup) return;
    const copy: Markup = {
      ...structuredClone(selectedMarkup),
      id: crypto.randomUUID(),
      points: selectedMarkup.points.map((point) => ({ x: point.x + 12, y: point.y + 12 })),
      createdAt: new Date().toISOString(),
      status: "Open",
      sourceAnnotationRef: undefined,
      sourceAnnotationName: undefined,
    };
    commitMarkups([...markups, copy]);
    setSelectedId(copy.id);
  }, [commitMarkups, markups, selectedMarkup]);

  const getCurrentProjectState = useCallback((): LocalProjectState => ({
    pageSizes,
    scales,
    markups,
    layerVisibility,
    activeLayer,
    measurementSettings: {
      precision: measurementPrecision,
      snapEnabled,
      gridSnapEnabled,
      gridSpacing,
    },
    removedSourceAnnotationRefs,
  }), [activeLayer, gridSnapEnabled, gridSpacing, layerVisibility, markups, measurementPrecision, pageSizes, removedSourceAnnotationRefs, scales, snapEnabled]);

  const loadFile = useCallback(async (file: File) => {
    setError("");
    if (file.size > 150 * 1024 * 1024) {
      setError("This file is larger than 150 MB. Choose a smaller drawing for this preview.");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "png", "jpg", "jpeg"].includes(extension)) {
      setError("Upload a PDF, PNG, JPG, or JPEG file.");
      return;
    }

    setLoadingDocument(true);
    try {
      const openedMarkups: Markup[] = [];
      if (extension === "pdf") {
        const bytes = await file.arrayBuffer();
        const pdfjs = await getPdfJs();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
        const sizes: Record<number, Size> = {};
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          sizes[pageNumber] = { width: viewport.width, height: viewport.height };
          const annotations = await page.getAnnotations({ intent: "display" });
          openedMarkups.push(...annotations
            .map((annotation) => importAnnotation(annotation as PdfAnnotationData, viewport, pageNumber))
            .filter((markup): markup is Markup => Boolean(markup)));
        }
        setSource({ kind: "pdf", name: file.name, pageCount: pdf.numPages, pdf, pdfBytes: bytes });
        setPageSizes(sizes);
      } else {
        const bytes = await file.arrayBuffer();
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.decoding = "async";
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("The image could not be read."));
          image.src = url;
        });
        URL.revokeObjectURL(url);
        const factor = Math.min(1, 3200 / Math.max(image.naturalWidth, image.naturalHeight));
        const size = { width: image.naturalWidth * factor, height: image.naturalHeight * factor };
        setSource({
          kind: "image",
          name: file.name,
          pageCount: 1,
          image,
          imageBytes: bytes,
          imageType: extension === "png" ? "png" : "jpeg",
        });
        setPageSizes({ 1: size });
      }
      setCurrentPage(1);
      setZoom(1);
      setMarkups(openedMarkups);
      setPast([]);
      setFuture([]);
      setScales({});
      setSelectedId(null);
      setDraft(null);
      setRemovedSourceAnnotationRefs([]);
      setLayerVisibility((current) => ({ ...current, "Imported annotations": true }));
      setActiveProjectId(null);
      setProjectName(file.name.replace(/\.[^.]+$/, ""));
      setProjectSaveStatus("idle");
      return true;
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "The document could not be opened.");
      return false;
    } finally {
      setLoadingDocument(false);
    }
  }, []);

  useEffect(() => {
    if (!source?.pdf || pageSizes[currentPage]) return;
    let cancelled = false;
    source.pdf.getPage(currentPage).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1 });
      setPageSizes((sizes) => ({ ...sizes, [currentPage]: { width: viewport.width, height: viewport.height } }));
    });
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSizes, source]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !currentSize) return;
    const measure = () => {
      const width = Math.max(200, viewport.clientWidth - 48);
      const height = Math.max(200, viewport.clientHeight - 48);
      setFitScale(Math.max(0.05, Math.min(width / currentSize.width, height / currentSize.height, 1.5)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [currentSize]);

  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas || !source || !currentSize) return;
    const outputScale = canvasOutputScale(currentSize, displayScale);
    let cancelled = false;
    renderTaskRef.current?.cancel();

    const render = async () => {
      if (source.kind === "pdf" && source.pdf) {
        const page = await source.pdf.getPage(currentPage);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: displayScale });
        canvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
        canvas.height = Math.max(1, Math.floor(viewport.height * outputScale));
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] as [number, number, number, number, number, number] : undefined;
        const task = page.render({ canvasContext: context, viewport, transform, canvas, annotationMode: 0 });
        renderTaskRef.current = task;
        try {
          await task.promise;
        } catch (renderError) {
          if (!cancelled && !(renderError instanceof Error && renderError.name === "RenderingCancelledException")) {
            setError("This PDF page could not be rendered.");
          }
        }
      } else if (source.image) {
        canvas.width = Math.max(1, Math.floor(currentSize.width * displayScale * outputScale));
        canvas.height = Math.max(1, Math.floor(currentSize.height * displayScale * outputScale));
        canvas.style.width = `${currentSize.width * displayScale}px`;
        canvas.style.height = `${currentSize.height * displayScale}px`;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;
        context.setTransform(displayScale * outputScale, 0, 0, displayScale * outputScale, 0, 0);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(source.image, 0, 0, currentSize.width, currentSize.height);
      }
    };
    render();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [currentPage, currentSize, displayScale, source]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !currentSize) return;
    const outputScale = canvasOutputScale(currentSize, displayScale);
    canvas.width = Math.max(1, Math.floor(currentSize.width * displayScale * outputScale));
    canvas.height = Math.max(1, Math.floor(currentSize.height * displayScale * outputScale));
    canvas.style.width = `${currentSize.width * displayScale}px`;
    canvas.style.height = `${currentSize.height * displayScale}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(displayScale * outputScale, 0, 0, displayScale * outputScale, 0, 0);
    let count = 0;
    visiblePageMarkups.forEach((markup) => {
      if (markup.kind === "count") count += 1;
      drawMarkup(ctx, markup, currentScale, markup.id === selectedId, markup.kind === "count" ? count : undefined);
    });
    if (draft?.points.length) {
      const previewPoints =
        (MULTI_POINT_TOOLS.includes(draft.kind) || draft.kind === "angle") && hoverPoint ? [...draft.points, hoverPoint] : draft.points;
      if (draft.kind !== "reference") {
        const previewKind = draft.kind === "cutout" ? "area" : draft.kind as MarkupKind;
        const preview: Markup = {
          id: "draft",
          page: currentPage,
          kind: previewKind,
          points: previewPoints,
          subject: TOOL_LABELS[draft.kind],
          comment: "",
          author: "You",
          stroke,
          fill: ["area", "volume", "cutout"].includes(draft.kind) ? `${stroke}1f` : "transparent",
          strokeWidth: draft.kind === "highlight" ? 14 : strokeWidth,
          opacity: draft.kind === "highlight" ? 0.28 : opacity,
          visible: true,
          createdAt: new Date().toISOString(),
          lineStyle,
          fillStyle,
          fillColor,
          layer: activeLayer,
          depth: draft.kind === "volume" ? 1 : undefined,
          precision: measurementPrecision,
        };
        if (draft.kind === "cutout") {
          preview.stroke = "#ffffff";
          preview.fillStyle = "diagonal";
          preview.lineStyle = "dashed";
        }
        drawMarkup(ctx, preview, currentScale);
      } else {
        ctx.save();
        ctx.strokeStyle = "#26a7c7";
        ctx.fillStyle = "#26a7c7";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        const points = hoverPoint ? [...draft.points, hoverPoint] : draft.points;
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[1].x, points[1].y);
          ctx.stroke();
        }
        draft.points.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }
    }
    if (snapIndicator && activeTool !== "select" && activeTool !== "pan") {
      ctx.save();
      ctx.strokeStyle = "#26a7c7";
      ctx.fillStyle = "rgba(38,167,199,.18)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(snapIndicator.x, snapIndicator.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [activeLayer, activeTool, currentPage, currentScale, currentSize, displayScale, draft, fillColor, fillStyle, hoverPoint, lineStyle, measurementPrecision, opacity, selectedId, snapIndicator, stroke, strokeWidth, visiblePageMarkups]);

  const rawCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / displayScale, y: (event.clientY - rect.top) / displayScale };
  };

  const snappedCanvasPoint = (raw: Point) => {
    if (!snapEnabled) {
      setSnapIndicator(null);
      return raw;
    }
    const threshold = 10 / displayScale;
    const candidates = visiblePageMarkups.flatMap((markup) => [
      ...markup.points,
      ...(markup.holes || []).flat(),
    ]).concat(draft?.points || []);
    let best: Point | null = null;
    let bestDistance = threshold;
    candidates.forEach((candidate) => {
      const candidateDistance = distance(raw, candidate);
      if (candidateDistance < bestDistance) {
        best = candidate;
        bestDistance = candidateDistance;
      }
    });
    if (gridSnapEnabled && gridSpacing > 0) {
      const gridPoint = { x: Math.round(raw.x / gridSpacing) * gridSpacing, y: Math.round(raw.y / gridSpacing) * gridSpacing };
      const gridDistance = distance(raw, gridPoint);
      if (gridDistance < bestDistance) best = gridPoint;
    }
    setSnapIndicator(best);
    return best ? { ...best } : raw;
  };

  const finishMultiPoint = useCallback((pointsOverride?: Point[], draftOverride?: Draft) => {
    const workingDraft = draftOverride || draft;
    if (!workingDraft || !MULTI_POINT_TOOLS.includes(workingDraft.kind)) return;
    const completedPoints = pointsOverride || workingDraft.points;
    const minimum = workingDraft.kind === "polyline" ? 2 : 3;
    if (completedPoints.length < minimum) {
      setError(`Choose at least ${minimum} points before finishing ${TOOL_LABELS[workingDraft.kind].toLowerCase()}.`);
      return;
    }
    if (workingDraft.kind === "cutout") {
      const target = markups.find((markup) => markup.id === cutoutTargetId);
      if (!target || !["area", "volume"].includes(target.kind)) {
        setError("Select an Area or Volume before adding a cut-out.");
        setDraft(null);
        draftRef.current = null;
        setCutoutTargetId(null);
        setActiveTool("select");
        return;
      }
      commitMarkups(markups.map((markup) => markup.id === target.id
        ? { ...markup, holes: [...(markup.holes || []), completedPoints] }
        : markup));
      setSelectedId(target.id);
      setDraft(null);
      draftRef.current = null;
      setCutoutTargetId(null);
      setActiveTool("select");
      return;
    }
    addMarkup(workingDraft.kind as MarkupKind, completedPoints, undefined, workingDraft.kind === "volume" ? { depth: 1 } : undefined);
    setDraft(null);
    draftRef.current = null;
  }, [addMarkup, commitMarkups, cutoutTargetId, draft, markups]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!source || !currentSize || event.button !== 0) return;
    const rawPoint = rawCanvasPoint(event);
    let point = activeTool === "select" || activeTool === "pan" ? rawPoint : snappedCanvasPoint(rawPoint);
    if (event.shiftKey && draft?.points.length && (MULTI_POINT_TOOLS.includes(activeTool) || activeTool === "angle")) {
      point = constrainPoint(draft.points[draft.points.length - 1], point);
    }
    setHoverPoint(point);
    setError("");

    if (activeTool === "select") {
      const editableSelection = selectedMarkup && selectedMarkup.page === currentPage && !selectedMarkup.locked ? selectedMarkup : null;
      const vertexIndex = editableSelection?.points.findIndex((vertex) => distance(point, vertex) <= 10 / displayScale) ?? -1;
      if (editableSelection && vertexIndex >= 0) {
        vertexDragRef.current = { id: editableSelection.id, index: vertexIndex, original: structuredClone(markups), moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
      const hit = [...visiblePageMarkups]
        .reverse()
        .find((markup) => hitMarkup(point, markup, 8 / displayScale));
      setSelectedId(hit?.id || null);
      if (hit && !hit.locked) {
        dragRef.current = { id: hit.id, start: point, original: structuredClone(markups), moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }
    if (activeTool === "pan") {
      const viewport = viewportRef.current;
      if (viewport) {
        panRef.current = {
          x: event.clientX,
          y: event.clientY,
          left: viewport.scrollLeft,
          top: viewport.scrollTop,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }
    if (activeTool === "count") {
      addMarkup("count", [point]);
      setActiveTool("count");
      return;
    }
    if (activeTool === "text") {
      setTextEntry({ point, value: "", fontFamily: "Helvetica", fontSize: 15 });
      return;
    }
    if (MULTI_POINT_TOOLS.includes(activeTool)) {
      if (activeTool === "cutout" && !cutoutTargetId) {
        setError("Select an Area or Volume, then choose Add cut-out in the Inspector.");
        return;
      }
      setDraft((current) => {
        const next = current?.kind === activeTool
        ? distance(current.points[current.points.length - 1], point) > 1
          ? { ...current, points: [...current.points, point] }
          : current
        : { kind: activeTool, points: [point] };
        draftRef.current = next;
        return next;
      });
      return;
    }
    if (activeTool === "angle") {
      if (draft?.kind === "angle" && draft.points.length === 2) {
        addMarkup("angle", [...draft.points, point]);
        setDraft(null);
      } else if (draft?.kind === "angle") {
        setDraft({ kind: "angle", points: [...draft.points, point] });
      } else {
        setDraft({ kind: "angle", points: [point] });
      }
      return;
    }
    if (activeTool === "reference") {
      if (draft?.kind === "reference" && draft.points.length === 1) {
        setReferenceSetup({ points: [draft.points[0], point], value: "1", unit: currentScale?.unit || "m" });
        setDraft(null);
      } else {
        setDraft({ kind: "reference", points: [point] });
      }
      return;
    }
    setDraft({ kind: activeTool, points: activeTool === "freehand" ? [point] : [point, point] });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!source) return;
    if (activeTool === "pan" && panRef.current && viewportRef.current) {
      viewportRef.current.scrollLeft = panRef.current.left - (event.clientX - panRef.current.x);
      viewportRef.current.scrollTop = panRef.current.top - (event.clientY - panRef.current.y);
      return;
    }
    const rawPoint = rawCanvasPoint(event);
    let point = activeTool === "select" || activeTool === "pan" ? rawPoint : snappedCanvasPoint(rawPoint);
    if (event.shiftKey && draft?.points.length && (MULTI_POINT_TOOLS.includes(activeTool) || activeTool === "angle")) {
      point = constrainPoint(draft.points[draft.points.length - 1], point);
    }
    setHoverPoint(point);
    if (activeTool === "select" && vertexDragRef.current && event.buttons === 1) {
      const vertexDrag = vertexDragRef.current;
      const originalMarkup = vertexDrag.original.find((markup) => markup.id === vertexDrag.id);
      if (!originalMarkup) return;
      let nextPoint = point;
      if (event.shiftKey && originalMarkup.points.length > 1) {
        const anchorIndex = vertexDrag.index === 0 ? 1 : vertexDrag.index - 1;
        nextPoint = constrainPoint(originalMarkup.points[anchorIndex], point);
      }
      vertexDrag.moved = distance(originalMarkup.points[vertexDrag.index], nextPoint) > 0.5;
      setMarkups(vertexDrag.original.map((markup) => markup.id === vertexDrag.id
        ? { ...markup, points: markup.points.map((vertex, index) => index === vertexDrag.index ? nextPoint : vertex) }
        : markup));
      return;
    }
    if (activeTool === "select" && dragRef.current && event.buttons === 1) {
      let dx = point.x - dragRef.current.start.x;
      let dy = point.y - dragRef.current.start.y;
      if (event.shiftKey) {
        if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
        else dx = 0;
      }
      dragRef.current.moved = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
      setMarkups(dragRef.current.original.map((markup) =>
        markup.id === dragRef.current?.id
          ? { ...markup, points: markup.points.map((item) => ({ x: item.x + dx, y: item.y + dy })) }
          : markup,
      ));
      return;
    }
    if (!draft || MULTI_POINT_TOOLS.includes(draft.kind) || draft.kind === "angle" || draft.kind === "reference") return;
    if (draft.kind === "freehand") {
      if (event.buttons === 1) setDraft((current) => (current ? { ...current, points: [...current.points, point] } : current));
      return;
    }
    setDraft((current) => current
      ? { ...current, points: [current.points[0], event.shiftKey ? constrainPoint(current.points[0], point) : point] }
      : current);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    setSnapIndicator(null);
    if (activeTool === "select" && vertexDragRef.current) {
      const completedDrag = vertexDragRef.current;
      if (completedDrag.moved) {
        setPast((history) => [...history.slice(-39), completedDrag.original]);
        setFuture([]);
      }
      vertexDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    if (activeTool === "select" && dragRef.current) {
      const completedDrag = dragRef.current;
      if (completedDrag.moved) {
        setPast((history) => [...history.slice(-39), completedDrag.original]);
        setFuture([]);
      }
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    if (activeTool === "pan" && panRef.current) {
      panRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    if (!draft || MULTI_POINT_TOOLS.includes(draft.kind) || draft.kind === "angle" || draft.kind === "reference") return;
    const points = draft.points;
    setDraft(null);
    if (points.length > 1 && (draft.kind === "freehand" || distance(points[0], points[points.length - 1]) > 2)) {
      addMarkup(draft.kind as MarkupKind, points);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const currentDraft = draftRef.current;
    if (currentDraft && MULTI_POINT_TOOLS.includes(currentDraft.kind)) {
      const rect = event.currentTarget.getBoundingClientRect();
      const terminalPoint = { x: (event.clientX - rect.left) / displayScale, y: (event.clientY - rect.top) / displayScale };
      const completedPoints = distance(currentDraft.points[currentDraft.points.length - 1], terminalPoint) > 1
        ? [...currentDraft.points, terminalPoint]
        : currentDraft.points;
      finishMultiPoint(completedPoints, currentDraft);
      return;
    }
    if (activeTool !== "select") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: (event.clientX - rect.left) / displayScale, y: (event.clientY - rect.top) / displayScale };
    const hit = [...visiblePageMarkups].reverse().find((markup) => hitMarkup(point, markup, 8 / displayScale));
    if (!hit || !["text", "callout"].includes(hit.kind)) return;
    setSelectedId(hit.id);
    setInspectorTab("properties");
    setTextEntry({
      point: hit.points[0],
      value: hit.text || "",
      fontFamily: hit.fontFamily || "Helvetica",
      fontSize: hit.fontSize || 15,
      editingId: hit.id,
      kind: hit.kind as "text" | "callout",
    });
  };

  const selectTool = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
    setDraft(null);
    setSnapIndicator(null);
    if (tool !== "cutout") setCutoutTargetId(null);
    if (tool !== "select") setSelectedId(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (event.key === "Escape") {
        if (vertexDragRef.current) setMarkups(vertexDragRef.current.original);
        if (dragRef.current) setMarkups(dragRef.current.original);
        vertexDragRef.current = null;
        dragRef.current = null;
        setDraft(null);
        draftRef.current = null;
        setReferenceSetup(null);
        setTextEntry(null);
        setCutoutTargetId(null);
        setSnapIndicator(null);
        setActiveTool("select");
        return;
      }
      if (typing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteMarkup(selectedId);
      } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && selectedMarkup && !selectedMarkup.locked) {
        event.preventDefault();
        const amount = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0;
        const dy = event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0;
        commitMarkups(markups.map((markup) => markup.id === selectedMarkup.id
          ? { ...markup, points: markup.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) }
          : markup));
      } else if (event.key === "Enter") {
        finishMultiPoint();
      } else if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        const shortcut: Record<string, ActiveTool> = {
          v: "select", p: "pan", n: "text", c: "callout", l: "line", r: "rectangle",
          e: "ellipse", h: "highlight", m: "length", j: "polyline", q: "area", g: "angle", k: "count",
        };
        const tool = shortcut[event.key.toLowerCase()];
        if (tool) selectTool(tool);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commitMarkups, deleteMarkup, duplicateSelected, finishMultiPoint, markups, redo, selectTool, selectedId, selectedMarkup, undo]);

  const applyReferenceScale = () => {
    if (!referenceSetup) return;
    const knownLength = Number(referenceSetup.value);
    const pixelLength = distance(referenceSetup.points[0], referenceSetup.points[1]);
    if (!Number.isFinite(knownLength) || knownLength <= 0 || pixelLength <= 0) {
      setError("Enter a known distance greater than zero.");
      return;
    }
    setScales((current) => ({
      ...current,
      [currentPage]: {
        page: currentPage,
        pixelsPerUnit: pixelLength / knownLength,
        unit: referenceSetup.unit,
        source: "reference",
        label: "Two-point reference",
        referencedFrom: { points: referenceSetup.points, knownLength },
      },
    }));
    setReferenceSetup(null);
    setActiveTool("length");
  };

  const applyScalePreset = () => {
    const preset = SCALE_PRESETS.find((item) => item.id === scalePresetId);
    if (!preset || !source) return;
    setScales((current) => ({
      ...current,
      [currentPage]: {
        page: currentPage,
        pixelsPerUnit: preset.pixelsPerUnit,
        unit: preset.unit,
        source: "preset",
        label: preset.label,
      },
    }));
    setError("");
  };

  const applyCustomRatio = () => {
    if (!source) return;
    const ratio = Number(customScaleRatio);
    if (!Number.isFinite(ratio) || ratio <= 0) {
      setError("Enter a valid custom ratio, such as 75 for 1:75.");
      return;
    }
    setScales((current) => ({
      ...current,
      [currentPage]: {
        page: currentPage,
        pixelsPerUnit: 2834.645669 / ratio,
        unit: "m",
        source: "preset",
        label: `1:${ratio} · custom`,
      },
    }));
    setError("");
  };

  const submitTextEntry = () => {
    if (!textEntry) return;
    const value = textEntry.value.trim();
    if (!value) {
      setError("Enter note text before placing it.");
      return;
    }
    if (textEntry.editingId) {
      commitMarkups(markups.map((markup) => markup.id === textEntry.editingId
        ? { ...markup, text: value, fontFamily: textEntry.fontFamily, fontSize: textEntry.fontSize }
        : markup));
      setSelectedId(textEntry.editingId);
    } else {
      addMarkup("text", [textEntry.point], undefined, {
        text: value,
        subject: "Text note",
        fontFamily: textEntry.fontFamily,
        fontSize: textEntry.fontSize,
      });
    }
    setTextEntry(null);
  };

  const saveSelectedSymbol = () => {
    if (!selectedMarkup) return;
    const name = selectedMarkup.subject || TOOL_LABELS[selectedMarkup.kind];
    const symbol = { id: crypto.randomUUID(), name, markup: structuredClone(selectedMarkup) };
    const nextSymbols = [symbol, ...savedSymbols].slice(0, 200);
    setSavedSymbols(nextSymbols);
    setLibraryStatus("saving");
    try {
      window.localStorage.setItem(SYMBOL_STORAGE_KEY, JSON.stringify(nextSymbols));
      setLibraryStatus("saved");
    } catch {
      setLibraryStatus("temporary");
    }
  };

  const deleteSavedSymbol = (id: string) => {
    const nextSymbols = savedSymbols.filter((symbol) => symbol.id !== id);
    setSavedSymbols(nextSymbols);
    setLibraryStatus("saving");
    try {
      window.localStorage.setItem(SYMBOL_STORAGE_KEY, JSON.stringify(nextSymbols));
      setLibraryStatus("saved");
    } catch {
      setLibraryStatus("temporary");
    }
  };

  const placeSymbol = (symbol: SavedSymbol) => {
    if (!currentSize) return;
    const original = symbol.markup.points;
    const bounds = getBounds(original);
    const offset = {
      x: currentSize.width / 2 - (bounds.minX + bounds.maxX) / 2,
      y: currentSize.height / 2 - (bounds.minY + bounds.maxY) / 2,
    };
    addMarkup(
      symbol.markup.kind,
      original.map((point) => ({ x: point.x + offset.x, y: point.y + offset.y })),
      symbol.markup,
    );
  };

  const exportPdf = async () => {
    if (!source) return;
    setExporting(true);
    setError("");
    try {
      const sourceBytes = source.kind === "pdf" ? source.pdfBytes : source.imageBytes;
      if (!sourceBytes) {
        throw new Error("The current document is not ready to export.");
      }
      const output = await createEditablePdf({
        sourceBytes,
        sourceKind: source.kind === "pdf" ? "pdf" : source.imageType || "jpeg",
        pageSizes,
        markups,
        scales,
        removedSourceAnnotationRefs,
      });
      const base = source.name.replace(/\.[^.]+$/, "");
      downloadBytes(output, `${base}-structura-editable.pdf`);
      setExportNotice("Editable PDF created with individual annotation objects.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "The PDF could not be created.");
    } finally {
      setExporting(false);
    }
  };

  const exportFlattenedPdf = async () => {
    if (!source) return;
    setExporting(true);
    setError("");
    try {
      const sourceBytes = source.kind === "pdf" ? source.pdfBytes : source.imageBytes;
      if (!sourceBytes) throw new Error("The current document is not ready to export.");
      const pdf = source.kind === "pdf" ? await PDFDocument.load(sourceBytes.slice(0)) : await PDFDocument.create();
      if (source.kind === "image") {
        const size = pageSizes[1];
        const pageScale = Math.min(1, 1200 / Math.max(size.width, size.height));
        const page = pdf.addPage([size.width * pageScale, size.height * pageScale]);
        const image = source.imageType === "png" ? await pdf.embedPng(sourceBytes.slice(0)) : await pdf.embedJpg(sourceBytes.slice(0));
        page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      }
      for (let pageNumber = 1; pageNumber <= pdf.getPageCount(); pageNumber += 1) {
        const size = pageSizes[pageNumber];
        if (!size) continue;
        const page = pdf.getPage(pageNumber - 1);
        page.node.set(PDFName.of("Annots"), pdf.context.obj([]));
        const overlayBytes = await renderOverlayPng(
          size,
          markups.filter((markup) => markup.page === pageNumber && layerVisibility[markup.layer || "Structural"] !== false),
          scales[pageNumber],
        );
        const overlay = await pdf.embedPng(overlayBytes);
        const width = page.getWidth();
        const height = page.getHeight();
        const rotation = ((page.getRotation().angle % 360) + 360) % 360;
        if (rotation === 90) page.drawImage(overlay, { x: width, y: 0, width: height, height: width, rotate: degrees(90) });
        else if (rotation === 180) page.drawImage(overlay, { x: width, y: height, width, height, rotate: degrees(180) });
        else if (rotation === 270) page.drawImage(overlay, { x: 0, y: height, width: height, height: width, rotate: degrees(270) });
        else page.drawImage(overlay, { x: 0, y: 0, width, height });
      }
      const output = await pdf.save({ useObjectStreams: false });
      const base = source.name.replace(/\.[^.]+$/, "");
      downloadBytes(output, `${base}-structura-flattened.pdf`);
      setExportNotice("Flattened PDF created. Markups are fixed into the page content.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "The flattened PDF could not be created.");
    } finally {
      setExporting(false);
    }
  };

  const exportSummaryCsv = () => {
    if (!measurementSummary.length) return;
    const rows = [
      ["Layer", "Measurement", "Items", "Total", "Unit"],
      ...measurementSummary.map((row) => [row.layer, row.type, String(row.items), row.total.toFixed(row.precision), row.unit]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const base = source?.name.replace(/\.[^.]+$/, "") || "structura";
    downloadBytes(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${base}-measurement-summary.csv`, "text/csv");
    setExportNotice("Measurement summary CSV created.");
  };

  const exportQuantityReportPdf = async () => {
    if (!measurementSummary.length) return;
    setExporting(true);
    setError("");
    try {
      const report = await PDFDocument.create();
      const regular = await report.embedFont(StandardFonts.Helvetica);
      const bold = await report.embedFont(StandardFonts.HelveticaBold);
      const pageWidth = 842;
      const pageHeight = 595;
      const margin = 42;
      const navy = rgb(0.047, 0.094, 0.149);
      const amber = rgb(0.949, 0.694, 0.204);
      const ink = rgb(0.11, 0.16, 0.22);
      const muted = rgb(0.39, 0.45, 0.53);
      const line = rgb(0.86, 0.88, 0.91);
      const pale = rgb(0.96, 0.97, 0.98);
      let page = report.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      const drawPageHeader = (section: string) => {
        page.drawRectangle({ x: 0, y: pageHeight - 48, width: pageWidth, height: 48, color: navy });
        page.drawRectangle({ x: 0, y: pageHeight - 51, width: pageWidth, height: 3, color: amber });
        page.drawText("STRUCTURA", { x: margin, y: pageHeight - 30, font: bold, size: 13, color: rgb(1, 1, 1) });
        page.drawText(safePdfText(section).toUpperCase(), { x: pageWidth - margin - 170, y: pageHeight - 29, font: bold, size: 8, color: rgb(0.74, 0.82, 0.9) });
        y = pageHeight - 78;
      };

      const addReportPage = (section: string) => {
        page = report.addPage([pageWidth, pageHeight]);
        drawPageHeader(section);
      };

      const drawTableHeader = (columns: { label: string; width: number }[]) => {
        let x = margin;
        page.drawRectangle({ x: margin, y: y - 5, width: pageWidth - margin * 2, height: 22, color: navy });
        columns.forEach((column) => {
          page.drawText(column.label.toUpperCase(), { x: x + 5, y: y + 2, font: bold, size: 6.5, color: rgb(1, 1, 1) });
          x += column.width;
        });
        y -= 22;
      };

      const drawTableRow = (values: string[], columns: { label: string; width: number }[], shaded: boolean) => {
        if (y < 45) return false;
        let x = margin;
        if (shaded) page.drawRectangle({ x: margin, y: y - 5, width: pageWidth - margin * 2, height: 20, color: pale });
        columns.forEach((column, index) => {
          page.drawText(fitPdfText(values[index] || "-", column.width - 10, regular, 7), { x: x + 5, y: y + 1, font: regular, size: 7, color: ink });
          x += column.width;
        });
        page.drawLine({ start: { x: margin, y: y - 5 }, end: { x: pageWidth - margin, y: y - 5 }, thickness: 0.45, color: line });
        y -= 20;
        return true;
      };

      drawPageHeader("Quantity report");
      page.drawText(safePdfText(projectName || source?.name.replace(/\.[^.]+$/, "") || "Drawing measurement report"), { x: margin, y, font: bold, size: 19, color: navy });
      y -= 22;
      page.drawText(`Source: ${safePdfText(source?.name || "Current drawing")}  |  Generated: ${new Date().toLocaleString()}`, { x: margin, y, font: regular, size: 8, color: muted });
      y -= 26;

      const summaryColumns = [
        { label: "Layer", width: 165 },
        { label: "Measurement", width: 165 },
        { label: "Items", width: 80 },
        { label: "Total", width: 150 },
        { label: "Unit", width: 100 },
      ];
      page.drawText("MEASUREMENT SUMMARY", { x: margin, y, font: bold, size: 9, color: navy });
      y -= 18;
      drawTableHeader(summaryColumns);
      measurementSummary.forEach((row, index) => {
        if (!drawTableRow([row.layer, row.type, String(row.items), row.total.toFixed(row.precision), row.unit || "-"], summaryColumns, index % 2 === 1)) {
          addReportPage("Quantity summary continued");
          drawTableHeader(summaryColumns);
          drawTableRow([row.layer, row.type, String(row.items), row.total.toFixed(row.precision), row.unit || "-"], summaryColumns, index % 2 === 1);
        }
      });

      addReportPage("Measurement register");
      const detailColumns = [
        { label: "Page", width: 45 },
        { label: "Type", width: 92 },
        { label: "Layer", width: 105 },
        { label: "Subject", width: 165 },
        { label: "Measurement", width: 112 },
        { label: "Status", width: 82 },
        { label: "Author", width: 157 },
      ];
      drawTableHeader(detailColumns);
      markups.filter((markup) => MEASUREMENT_KINDS.includes(markup.kind)).forEach((markup, index) => {
        const values = [
          String(markup.page),
          TOOL_LABELS[markup.kind],
          markup.layer || "Structural",
          markup.subject || TOOL_LABELS[markup.kind],
          formatMeasurement(markup, scales[markup.page]),
          markup.status || "Open",
          markup.author || "-",
        ];
        if (!drawTableRow(values, detailColumns, index % 2 === 1)) {
          addReportPage("Measurement register continued");
          drawTableHeader(detailColumns);
          drawTableRow(values, detailColumns, index % 2 === 1);
        }
      });

      const pages = report.getPages();
      pages.forEach((reportPage, index) => {
        reportPage.drawText(`Page ${index + 1} of ${pages.length}`, { x: pageWidth - margin - 60, y: 20, font: regular, size: 7, color: muted });
        reportPage.drawText("Verify reference scales against a known dimension before relying on quantities.", { x: margin, y: 20, font: regular, size: 7, color: muted });
      });
      const output = await report.save();
      const base = source?.name.replace(/\.[^.]+$/, "") || "structura";
      downloadBytes(output, `${base}-quantity-report.pdf`);
      setExportNotice("Professional quantity report PDF created.");
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "The quantity report could not be created.");
    } finally {
      setExporting(false);
    }
  };

  const exportProject = () => {
    if (!source) return;
    const backup = {
      format: "structura-project",
      version: 2,
      source: { name: source.name, kind: source.kind, pageCount: source.pageCount },
      pageSizes,
      scales,
      markups,
      layers: { names: allLayers, visibility: layerVisibility, active: activeLayer },
      measurementSettings: { precision: measurementPrecision, snapEnabled, gridSnapEnabled, gridSpacing },
      removedSourceAnnotationRefs,
      savedPresets: savedSymbols,
      exportedAt: new Date().toISOString(),
      note: "This JSON preserves Structura edit data but does not contain the source PDF/photo bytes.",
    };
    const base = source.name.replace(/\.[^.]+$/, "");
    downloadBytes(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }), `${base}-structura-project.json`, "application/json");
    setExportNotice("Structura project backup created.");
  };

  const updateProjectSummaryList = useCallback((summary: LocalProjectSummary) => {
    const next = [summary, ...localProjectsRef.current.filter((project) => project.id !== summary.id)]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    localProjectsRef.current = next;
    setLocalProjects(next);
  }, []);

  const saveCurrentProject = async () => {
    if (!source) {
      setError("Open a drawing before saving a project.");
      return;
    }
    const sourceBytes = source.kind === "pdf" ? source.pdfBytes : source.imageBytes;
    if (!sourceBytes) {
      setError("The source drawing is not ready to save.");
      return;
    }
    setProjectSaveStatus("saving");
    try {
      const now = new Date().toISOString();
      const id = activeProjectId || crypto.randomUUID();
      const existing = localProjectsRef.current.find((project) => project.id === id);
      const summary: LocalProjectSummary = {
        id,
        name: projectName.trim() || source.name.replace(/\.[^.]+$/, ""),
        sourceName: source.name,
        sourceKind: source.kind,
        pageCount: source.pageCount,
        markupCount: markups.length,
        measurementCount: markups.filter((markup) => MEASUREMENT_KINDS.includes(markup.kind)).length,
        sourceSize: sourceBytes.byteLength,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      await saveLocalProject({
        summary,
        document: {
          sourceBytes: sourceBytes.slice(0),
          imageType: source.kind === "image" ? source.imageType : undefined,
        },
        state: getCurrentProjectState(),
      });
      updateProjectSummaryList(summary);
      setActiveProjectId(id);
      setProjectName(summary.name);
      setProjectSaveStatus("saved");
      setProjectStorageReady(true);
      setExportNotice(existing ? "Project saved on this device." : "Project added to your on-device workspace.");
    } catch (saveError) {
      setProjectSaveStatus("error");
      setProjectStorageReady(false);
      setError(saveError instanceof Error ? saveError.message : "The project could not be saved on this device.");
    }
  };

  const openSavedProject = async (id: string) => {
    setProjectBusyId(id);
    projectHydratingRef.current = true;
    setError("");
    try {
      const snapshot = await getLocalProject(id);
      if (!snapshot) throw new Error("This saved project could not be found.");
      const mimeType = snapshot.summary.sourceKind === "pdf"
        ? "application/pdf"
        : snapshot.document.imageType === "png" ? "image/png" : "image/jpeg";
      const file = new File([snapshot.document.sourceBytes.slice(0)], snapshot.summary.sourceName, { type: mimeType });
      const loaded = await loadFile(file);
      if (!loaded) return;
      setPageSizes(snapshot.state.pageSizes);
      setScales(snapshot.state.scales);
      setMarkups(snapshot.state.markups);
      setLayerVisibility(snapshot.state.layerVisibility);
      setActiveLayer(snapshot.state.activeLayer);
      setMeasurementPrecision(snapshot.state.measurementSettings.precision);
      setSnapEnabled(snapshot.state.measurementSettings.snapEnabled);
      setGridSnapEnabled(snapshot.state.measurementSettings.gridSnapEnabled);
      setGridSpacing(snapshot.state.measurementSettings.gridSpacing);
      setRemovedSourceAnnotationRefs(snapshot.state.removedSourceAnnotationRefs);
      setPast([]);
      setFuture([]);
      setSelectedId(null);
      setActiveProjectId(snapshot.summary.id);
      setProjectName(snapshot.summary.name);
      setProjectSaveStatus("saved");
      setProOpen(false);
      setExportNotice(`Opened ${snapshot.summary.name}.`);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "The saved project could not be opened.");
    } finally {
      setProjectBusyId(null);
      window.requestAnimationFrame(() => {
        projectHydratingRef.current = false;
      });
    }
  };

  const removeSavedProject = async (project: LocalProjectSummary) => {
    if (!window.confirm(`Delete the on-device project “${project.name}”? This cannot be undone.`)) return;
    setProjectBusyId(project.id);
    try {
      await deleteLocalProject(project.id);
      const next = localProjectsRef.current.filter((item) => item.id !== project.id);
      localProjectsRef.current = next;
      setLocalProjects(next);
      if (activeProjectId === project.id) {
        setActiveProjectId(null);
        setProjectSaveStatus("idle");
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The saved project could not be deleted.");
    } finally {
      setProjectBusyId(null);
    }
  };

  const importProjectBackup = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as {
        format?: string;
        source?: { name?: string };
        pageSizes?: Record<number, Size>;
        scales?: Record<number, PageScale>;
        markups?: Markup[];
        layers?: { visibility?: Record<string, boolean>; active?: string };
        measurementSettings?: LocalProjectState["measurementSettings"];
        removedSourceAnnotationRefs?: string[];
        savedPresets?: SavedSymbol[];
      };
      if (parsed.format !== "structura-project" || !Array.isArray(parsed.markups) || !parsed.pageSizes || !parsed.scales) {
        throw new Error("Choose a valid Structura project backup JSON file.");
      }
      if (!source) throw new Error("Open the original source drawing before restoring its project backup.");
      if (parsed.source?.name && parsed.source.name !== source.name) {
        throw new Error(`This backup expects “${parsed.source.name}”. Open that source drawing first.`);
      }
      setPageSizes(parsed.pageSizes);
      setScales(parsed.scales);
      setMarkups(parsed.markups);
      setLayerVisibility(parsed.layers?.visibility || layerVisibility);
      setActiveLayer(parsed.layers?.active || activeLayer);
      if (parsed.measurementSettings) {
        setMeasurementPrecision(parsed.measurementSettings.precision);
        setSnapEnabled(parsed.measurementSettings.snapEnabled);
        setGridSnapEnabled(parsed.measurementSettings.gridSnapEnabled);
        setGridSpacing(parsed.measurementSettings.gridSpacing);
      }
      setRemovedSourceAnnotationRefs(parsed.removedSourceAnnotationRefs || []);
      if (Array.isArray(parsed.savedPresets)) {
        setSavedSymbols(parsed.savedPresets);
        window.localStorage.setItem(SYMBOL_STORAGE_KEY, JSON.stringify(parsed.savedPresets));
      }
      setPast([]);
      setFuture([]);
      setSelectedId(null);
      setProjectSaveStatus("idle");
      setExportNotice("Project backup restored. Save it to the Pro workspace to keep it on this device.");
      setProOpen(false);
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : "The project backup could not be restored.");
    }
  };

  const exportPresetLibrary = () => {
    const library = {
      format: "structura-preset-library",
      version: 1,
      presets: savedSymbols,
      exportedAt: new Date().toISOString(),
    };
    downloadBytes(new Blob([JSON.stringify(library, null, 2)], { type: "application/json" }), "structura-preset-library.json", "application/json");
    setExportNotice("Reusable preset library downloaded.");
  };

  const importPresetLibrary = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { format?: string; presets?: SavedSymbol[] };
      if (parsed.format !== "structura-preset-library" || !Array.isArray(parsed.presets)) {
        throw new Error("Choose a valid Structura preset library JSON file.");
      }
      const valid = parsed.presets.filter((preset) =>
        preset && typeof preset.name === "string" && preset.markup && Array.isArray(preset.markup.points),
      );
      const imported = valid.map((preset) => ({ ...preset, id: crypto.randomUUID() }));
      const next = [...imported, ...savedSymbols].slice(0, 500);
      setSavedSymbols(next);
      window.localStorage.setItem(SYMBOL_STORAGE_KEY, JSON.stringify(next));
      setLibraryStatus("saved");
      setExportNotice(`${imported.length} preset${imported.length === 1 ? "" : "s"} added to this device.`);
    } catch (libraryError) {
      setError(libraryError instanceof Error ? libraryError.message : "The preset library could not be imported.");
    }
  };

  useEffect(() => {
    if (!autoSaveEnabled || !activeProjectId || !source || projectHydratingRef.current) return;
    const timer = window.setTimeout(() => {
      const existing = localProjectsRef.current.find((project) => project.id === activeProjectId);
      if (!existing) return;
      const sourceBytes = source.kind === "pdf" ? source.pdfBytes : source.imageBytes;
      const summary: LocalProjectSummary = {
        ...existing,
        name: projectName.trim() || existing.name,
        markupCount: markups.length,
        measurementCount: markups.filter((markup) => MEASUREMENT_KINDS.includes(markup.kind)).length,
        sourceSize: sourceBytes?.byteLength || existing.sourceSize,
        updatedAt: new Date().toISOString(),
      };
      setProjectSaveStatus("saving");
      void updateLocalProjectState(summary, getCurrentProjectState())
        .then(() => {
          updateProjectSummaryList(summary);
          setProjectSaveStatus("saved");
        })
        .catch((autosaveError) => {
          setProjectSaveStatus("error");
          setError(autosaveError instanceof Error ? autosaveError.message : "Autosave could not update this project.");
        });
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [activeProjectId, autoSaveEnabled, getCurrentProjectState, markups, projectName, source, updateProjectSummaryList]);

  const beginCutout = () => {
    if (!selectedMarkup || !["area", "volume"].includes(selectedMarkup.kind)) return;
    setCutoutTargetId(selectedMarkup.id);
    setActiveTool("cutout");
    setDraft(null);
    setSnapIndicator(null);
    setError("");
  };

  const removeLastCutout = () => {
    if (!selectedMarkup?.holes?.length) return;
    updateSelected({ holes: selectedMarkup.holes.slice(0, -1) });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!source || !viewportRef.current) return;
    event.preventDefault();
    const viewport = viewportRef.current;
    const rect = viewport.getBoundingClientRect();
    const anchorX = event.clientX - rect.left + viewport.scrollLeft;
    const anchorY = event.clientY - rect.top + viewport.scrollTop;
    const factor = Math.exp(-event.deltaY * 0.0015);
    const nextZoom = Math.max(0.25, Math.min(4, zoom * factor));
    const ratio = nextZoom / zoom;
    setZoom(nextZoom);
    requestAnimationFrame(() => {
      viewport.scrollLeft = anchorX * ratio - (event.clientX - rect.left);
      viewport.scrollTop = anchorY * ratio - (event.clientY - rect.top);
    });
  };

  const pageLabel = source ? `${currentPage} / ${source.pageCount}` : "0 / 0";
  const cursor = activeTool === "pan" ? "grab" : activeTool === "select" ? (selectedId ? "move" : "default") : "crosshair";

  return (
    <main
      className={`structura-app ${dropActive ? "is-dropping" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDropActive(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDropActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDropActive(false);
        const file = event.dataTransfer.files[0];
        if (file) loadFile(file);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) loadFile(file);
          event.target.value = "";
        }}
      />
      <input
        ref={projectBackupInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importProjectBackup(file);
          event.target.value = "";
        }}
      />
      <input
        ref={presetLibraryInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importPresetLibrary(file);
          event.target.value = "";
        }}
      />

      <header className="topbar">
        <Link className="brand-block" href="/" aria-label="Go to STRUCTURA home" title="Back to STRUCTURA home">
          <svg className="brand-mark" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <rect x="0" y="11.5" width="9" height="3" rx=".5" className="brand-mark-light" />
            <rect x="12.5" y="11.5" width="9" height="3" rx=".5" className="brand-mark-light" />
            <rect x="25" y="11.5" width="9" height="3" rx=".5" className="brand-mark-light" />
            <rect x="0" y="19.5" width="9" height="3" rx=".5" className="brand-mark-light" />
            <rect x="12.5" y="19.5" width="9" height="3" rx=".5" className="brand-mark-light" />
            <rect x="25" y="19.5" width="9" height="3" rx=".5" className="brand-mark-light" />
            <rect x="11.5" y="0" width="3" height="9" rx=".5" className="brand-mark-dark" />
            <rect x="11.5" y="12.5" width="3" height="9" rx=".5" className="brand-mark-dark" />
            <rect x="11.5" y="25" width="3" height="9" rx=".5" className="brand-mark-dark" />
            <rect x="19.5" y="0" width="3" height="9" rx=".5" className="brand-mark-dark" />
            <rect x="19.5" y="12.5" width="3" height="9" rx=".5" className="brand-mark-dark" />
            <rect x="19.5" y="25" width="3" height="9" rx=".5" className="brand-mark-dark" />
          </svg>
          <span className="brand-copy">
            <span className="brand-name">STRUCTURA</span>
            <span className="brand-product">Drawing Markup</span>
          </span>
        </Link>
        <button className="document-chip" type="button" onClick={() => fileInputRef.current?.click()}>
          {source?.kind === "image" ? <FileImage size={16} /> : <FileText size={16} />}
          <span>{source?.name || "Open a drawing"}</span>
          <ChevronDown size={14} />
        </button>
        <div className="topbar-spacer" />
        <div className="page-control" aria-label="Page controls">
          <button
            type="button"
            aria-label="Previous page"
            disabled={!source || currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            <ChevronLeft size={17} />
          </button>
          <span>{pageLabel}</span>
          <button
            type="button"
            aria-label="Next page"
            disabled={!source || currentPage >= source.pageCount}
            onClick={() => setCurrentPage((page) => Math.min(source?.pageCount || 1, page + 1))}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <span className={`scale-status ${currentScale ? "is-ready" : ""}`}>
          <span className="status-dot" />
          {currentScale ? `Scale · ${currentScale.label || currentScale.unit}` : "Scale not set"}
        </span>
        <button className="pro-workspace-button" type="button" onClick={() => setProOpen(true)} title="Open the Pro project workspace">
          <Cloud size={16} />
          <span>Pro workspace</span>
          {projectSaveStatus === "saving" && <small>Saving</small>}
          {projectSaveStatus === "saved" && <small>Saved</small>}
        </button>
        <button className="icon-button" type="button" aria-label="Undo" title="Undo (Ctrl+Z)" onClick={undo} disabled={!past.length}>
          <Undo2 size={17} />
        </button>
        <button className="icon-button" type="button" aria-label="Redo" title="Redo (Ctrl+Y)" onClick={redo} disabled={!future.length}>
          <Redo2 size={17} />
        </button>
        <button className="icon-button" type="button" aria-label="Help" title="Help" onClick={() => setHelpOpen(true)}>
          <HelpCircle size={18} />
        </button>
        <button className="icon-button" type="button" aria-label="Measurement summary" title="Measurement summary" onClick={() => setSummaryOpen(true)} disabled={!measurementSummary.length}>
          <ListChecks size={18} />
        </button>
        <button
          className="download-button flattened-button"
          type="button"
          onClick={exportFlattenedPdf}
          disabled={!source || exporting}
          title="Fixes visible markups into the page content for issue or archive"
        >
          <Download size={16} />
          Export fixed PDF
        </button>
        <button
          className="download-button"
          type="button"
          onClick={exportPdf}
          disabled={!source || exporting}
          title="Exports standard PDF annotations that remain selectable and editable in compatible desktop PDF editors"
        >
          <Download size={16} />
          {exporting ? "Preparing…" : "Export editable PDF"}
        </button>
      </header>

      <section className="workbench">
        <aside className="tool-chest" aria-label="Markup Library">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Workspace</span>
              <h2>Markup Library</h2>
            </div>
            <Library size={18} />
          </div>
          <div className="tool-scroll">
            {TOOL_GROUPS.map((group) => (
              <section className="tool-set" key={group.name}>
                <button
                  className="tool-set-heading"
                  type="button"
                  onClick={() => setExpandedSets((sets) => ({ ...sets, [group.name]: !sets[group.name] }))}
                >
                  <span>{group.name}</span>
                  {expandedSets[group.name] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedSets[group.name] && (
                  <div className="tool-grid">
                    {group.tools.map((tool) => (
                      <ToolButton key={tool} tool={tool} active={activeTool === tool} onClick={() => selectTool(tool)} />
                    ))}
                  </div>
                )}
              </section>
            ))}

            <section className="tool-set review-sets">
              <div className="tool-set-heading static-heading">
                <span>Discipline kits</span>
              </div>
              {DISCIPLINE_KITS.map((set) => (
                <button
                  type="button"
                  className="review-set"
                  key={set.name}
                  onClick={() => {
                    setStroke(set.color);
                    selectTool("callout");
                  }}
                >
                  <span className="review-avatar" style={{ background: set.color }}>{set.icon}</span>
                  <span>{set.name}</span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </section>

            <section className="tool-set">
              <button
                className="tool-set-heading"
                type="button"
                onClick={() => setExpandedSets((sets) => ({ ...sets, "Saved presets": !sets["Saved presets"] }))}
              >
                <span>Saved presets</span>
                <span className={`library-state ${libraryStatus}`}>
                  {libraryStatus === "loading" ? "Loading" : libraryStatus === "saving" ? "Saving" : libraryStatus === "saved" ? "This device" : "Unavailable"}
                </span>
              </button>
              {expandedSets["Saved presets"] && (
                savedSymbols.length ? (
                  <div className="saved-symbols">
                    {savedSymbols.map((symbol) => {
                      const Icon = TOOL_ICONS[symbol.markup.kind];
                      return (
                        <div className="saved-symbol-row" key={symbol.id}>
                          <button className="place-symbol" type="button" onClick={() => placeSymbol(symbol)} title={`Place ${symbol.name}`}>
                            <span style={{ color: symbol.markup.stroke }}><Icon size={18} /></span>
                            <span>{symbol.name}</span>
                          </button>
                          <button className="remove-symbol" type="button" onClick={() => deleteSavedSymbol(symbol.id)} aria-label={`Delete saved symbol ${symbol.name}`} title="Delete saved symbol">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="tool-empty">Select a markup, then save its style and geometry as a reusable preset.</p>
                )
              )}
            </section>
          </div>
        </aside>

        <section className="canvas-column">
          <div className="canvas-toolbar">
            <div className="active-tool-label">
              {(() => {
                const Icon = TOOL_ICONS[activeTool];
                return <Icon size={16} />;
              })()}
              <span>{TOOL_LABELS[activeTool]}</span>
              {draft && MULTI_POINT_TOOLS.includes(draft.kind) && <span className="instruction-pill">Double-click or press Enter to finish</span>}
              {draft?.kind === "angle" && <span className="instruction-pill">Choose vertex, then the second arm</span>}
              {draft?.kind === "reference" && <span className="instruction-pill cyan">Choose the second reference point</span>}
            </div>
            <div className="zoom-control" aria-label="Zoom controls">
              <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.25, value - 0.15))}><Minus size={15} /></button>
              <button type="button" className="zoom-value" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(4, value + 0.15))}><Plus size={15} /></button>
              <button type="button" aria-label="Fit drawing" title="Fit drawing" onClick={() => setZoom(1)}><Focus size={15} /></button>
            </div>
          </div>

          <div className="canvas-viewport" ref={viewportRef} onWheel={handleWheel}>
            {source && currentSize ? (
              <div
                className="document-canvas"
                style={{ width: currentSize.width * displayScale, height: currentSize.height * displayScale }}
              >
                <canvas ref={backgroundCanvasRef} aria-label={`Page ${currentPage} of ${source.name}`} />
                <canvas
                  ref={overlayCanvasRef}
                  className="markup-canvas"
                  style={{ cursor }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => {
                    if (vertexDragRef.current) setMarkups(vertexDragRef.current.original);
                    if (dragRef.current) setMarkups(dragRef.current.original);
                    setDraft(null);
                    draftRef.current = null;
                    setSnapIndicator(null);
                    dragRef.current = null;
                    vertexDragRef.current = null;
                  }}
                  onDoubleClick={handleCanvasDoubleClick}
                />
              </div>
            ) : (
              <div className="upload-state">
                <div className="upload-icon"><ImagePlus size={28} /></div>
                <span className="eyebrow">Private, local-first workspace</span>
                <h1>Open a drawing or site photo</h1>
                <p>Upload a PDF, JPG, or PNG. Set a trusted reference distance, then annotate and measure directly in your browser.</p>
                <div className="upload-actions">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loadingDocument}>
                    <Upload size={17} />
                    {loadingDocument ? "Opening document…" : "Choose a file"}
                  </button>
                </div>
                <span className="upload-meta">Up to 150 MB · files stay on this device while you work</span>
                <div className="workflow-strip" aria-label="Workflow">
                  <span><b>1</b> Upload</span>
                  <span><b>2</b> Set scale</span>
                  <span><b>3</b> Review</span>
                  <span><b>4</b> Export</span>
                </div>
              </div>
            )}
            {dropActive && (
              <div className="drop-overlay">
                <Upload size={30} />
                <strong>Drop the drawing here</strong>
                <span>PDF, PNG, JPG, or JPEG</span>
              </div>
            )}
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <OctagonAlert size={17} />
              <span>{error}</span>
              <button type="button" aria-label="Dismiss error" onClick={() => setError("")}><X size={15} /></button>
            </div>
          )}
          {exportNotice && (
            <div className="success-banner" role="status">
              <span>{exportNotice}</span>
              <button type="button" aria-label="Dismiss confirmation" onClick={() => setExportNotice("")}><X size={15} /></button>
            </div>
          )}
        </section>

        <aside className="inspector" aria-label="Inspector" tabIndex={0}>
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Selection</span>
              <h2>Inspector</h2>
            </div>
            <Layers3 size={17} />
          </div>

          <section className="inspector-section scale-card">
            <div className="section-title">
              <span>Reference scale</span>
              <span className={`mini-status ${currentScale ? "is-ready" : ""}`}>{currentScale ? "Ready" : "Not set"}</span>
            </div>
            {currentScale ? (
              <div className="scale-readout">
                <strong>{currentScale.label || `Custom · ${currentScale.unit}`}</strong>
                <span>1 {currentScale.unit} = {currentScale.pixelsPerUnit.toFixed(2)} page units</span>
              </div>
            ) : (
              <p>Choose a drawing scale or define one from a trusted distance.</p>
            )}
            <div className="scale-preset-row">
              <select value={scalePresetId} onChange={(event) => setScalePresetId(event.target.value)} disabled={!source} aria-label="Preset scale">
                {SCALE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
              </select>
              <button type="button" className="secondary-button" onClick={applyScalePreset} disabled={!source}>Set</button>
            </div>
            <div className="custom-scale-row">
              <span>1 :</span>
              <input
                type="number"
                min="1"
                step="1"
                value={customScaleRatio}
                onChange={(event) => setCustomScaleRatio(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") applyCustomRatio(); }}
                disabled={!source}
                aria-label="Custom scale denominator"
              />
              <button type="button" className="secondary-button" onClick={applyCustomRatio} disabled={!source}>Set custom</button>
            </div>
            <button type="button" className="secondary-button" onClick={() => selectTool("reference")} disabled={!source}>
              <Ruler size={15} /> Define from two points
            </button>
            <small>Verify the reference against a known dimension before relying on quantities. Photos should use two-point setup.</small>
          </section>

          <section className="inspector-section layers-card">
            <div className="section-title">
              <span>Layer stack</span>
              <Layers3 size={15} />
            </div>
            <div className="layer-list">
              {allLayers.map((layer) => (
                <label key={layer} className="layer-toggle">
                  <input
                    type="checkbox"
                    checked={layerVisibility[layer] !== false}
                    onChange={(event) => setLayerVisibility((current) => ({ ...current, [layer]: event.target.checked }))}
                  />
                  <span>{layer}</span>
                  <b>{markups.filter((markup) => (markup.layer || "Structural") === layer).length}</b>
                </label>
              ))}
            </div>
          </section>

          <section className="inspector-section precision-card">
            <div className="section-title">
              <span>Precision & snapping</span>
              <Focus size={15} />
            </div>
            <div className="snap-row">
              <label className="toggle-field">
                <input type="checkbox" checked={snapEnabled} onChange={(event) => setSnapEnabled(event.target.checked)} />
                Endpoints
              </label>
              <label className="toggle-field">
                <input type="checkbox" checked={gridSnapEnabled} onChange={(event) => setGridSnapEnabled(event.target.checked)} />
                Grid
              </label>
            </div>
            <div className="precision-fields">
              <label>
                Decimals
                <select value={measurementPrecision} onChange={(event) => setMeasurementPrecision(Number(event.target.value))}>
                  {[0, 1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                Grid spacing
                <input type="number" min="2" max="200" value={gridSpacing} onChange={(event) => setGridSpacing(Math.max(2, Math.min(200, Number(event.target.value) || 10)))} disabled={!gridSnapEnabled} />
              </label>
            </div>
          </section>

          {selectedMarkup ? (
            <div className="inspector-scroll">
              <section className="inspector-section">
                <div className="selected-kind">
                  {(() => {
                    const Icon = TOOL_ICONS[selectedMarkup.kind];
                    return <Icon size={17} />;
                  })()}
                  <span>{TOOL_LABELS[selectedMarkup.kind]}</span>
                  <span>Page {selectedMarkup.page}</span>
                </div>
                <div className="property-tabs" role="tablist" aria-label="Selected markup properties">
                  <button type="button" role="tab" aria-selected={inspectorTab === "properties"} className={inspectorTab === "properties" ? "is-active" : ""} onClick={() => setInspectorTab("properties")}>Details</button>
                  <button type="button" role="tab" aria-selected={inspectorTab === "appearance"} className={inspectorTab === "appearance" ? "is-active" : ""} onClick={() => setInspectorTab("appearance")}>Style</button>
                  {MEASUREMENT_KINDS.includes(selectedMarkup.kind) && (
                    <button type="button" role="tab" aria-selected={inspectorTab === "measurement"} className={inspectorTab === "measurement" ? "is-active" : ""} onClick={() => setInspectorTab("measurement")}>Measure</button>
                  )}
                </div>
                {inspectorTab === "properties" && (
                  <>
                <label>
                  Subject
                  <input value={selectedMarkup.subject} onChange={(event) => updateSelected({ subject: event.target.value })} />
                </label>
                {(selectedMarkup.kind === "text" || selectedMarkup.kind === "callout") && (
                  <>
                    <label>
                      Display text
                      <input value={selectedMarkup.text || ""} onChange={(event) => updateSelected({ text: event.target.value })} />
                    </label>
                    <div className="font-fields">
                      <label>
                        Font
                        <select value={selectedMarkup.fontFamily || "Helvetica"} onChange={(event) => updateSelected({ fontFamily: event.target.value as Markup["fontFamily"] })}>
                          <option>Helvetica</option>
                          <option>Times Roman</option>
                          <option>Courier</option>
                        </select>
                      </label>
                      <label>
                        Size
                        <input type="number" min="7" max="72" value={selectedMarkup.fontSize || 15} onChange={(event) => updateSelected({ fontSize: Math.max(7, Math.min(72, Number(event.target.value))) })} />
                      </label>
                    </div>
                  </>
                )}
                <label>
                  Comment
                  <textarea rows={3} value={selectedMarkup.comment} onChange={(event) => updateSelected({ comment: event.target.value })} placeholder="Add coordination notes…" />
                </label>
                <label>
                  Author
                  <input value={selectedMarkup.author} onChange={(event) => updateSelected({ author: event.target.value })} />
                </label>
                <label>
                  Review status
                  <select value={selectedMarkup.status || "Open"} onChange={(event) => updateSelected({ status: event.target.value as Markup["status"] })}>
                    <option>Open</option>
                    <option>In review</option>
                    <option>Resolved</option>
                  </select>
                </label>
                <label>
                  Layer
                  <select value={selectedMarkup.layer || "Structural"} onChange={(event) => updateSelected({ layer: event.target.value })}>
                    {allLayers.map((layer) => <option key={layer}>{layer}</option>)}
                  </select>
                </label>
                <label className="toggle-field">
                  <input type="checkbox" checked={Boolean(selectedMarkup.locked)} onChange={(event) => updateSelected({ locked: event.target.checked })} />
                  Lock position and deletion
                </label>
                  </>
                )}
              </section>

              {inspectorTab === "measurement" && MEASUREMENT_KINDS.includes(selectedMarkup.kind) && (
                <section className="inspector-section measurement-properties">
                  <div className="measurement-readout">
                    <div className="measurement-engine-row">
                      <span>Calculated value</span>
                      <b className={`engine-state is-${calculationStatus}`}>
                        {calculationStatus === "checking" ? "Checking" : calculationStatus === "verified" ? "Server verified" : calculationStatus === "unavailable" ? "Local result" : "Local"}
                      </b>
                    </div>
                    <strong>{serverMeasurement?.display || formatMeasurement(selectedMarkup, scales[selectedMarkup.page])}</strong>
                    <small>{scales[selectedMarkup.page] ? `Page scale: ${scales[selectedMarkup.page].label || scales[selectedMarkup.page].unit}` : "Set a page scale to calculate this measurement."}</small>
                    {serverMeasurement?.warnings?.map((warning) => <small key={warning} className="measurement-warning">{warning}</small>)}
                  </div>
                  {LINEAR_MEASUREMENT_KINDS.includes(selectedMarkup.kind) && (
                    <label>
                      {selectedMarkup.kind === "area" ? "Area unit" : selectedMarkup.kind === "volume" ? "Volume unit" : "Length unit"}
                      <select value={selectedMarkup.displayUnit || scales[selectedMarkup.page]?.unit || "m"} onChange={(event) => updateSelected({ displayUnit: event.target.value as Unit })}>
                        {UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}{selectedMarkup.kind === "area" ? " squared" : selectedMarkup.kind === "volume" ? " cubed" : ""}</option>)}
                      </select>
                    </label>
                  )}
                  {selectedMarkup.kind === "volume" && (
                    <div className="height-fields">
                      <label>
                        Height / depth
                        <input type="number" min="0" step="0.01" value={selectedMarkup.depth ?? 1} onChange={(event) => updateSelected({ depth: Math.max(0, Number(event.target.value) || 0) })} />
                      </label>
                      <label>
                        Height unit
                        <select value={selectedMarkup.depthUnit || scales[selectedMarkup.page]?.unit || "m"} onChange={(event) => updateSelected({ depthUnit: event.target.value as Unit })}>
                          {UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.value}</option>)}
                        </select>
                      </label>
                    </div>
                  )}
                  {selectedMarkup.kind === "angle" && (
                    <label>
                      Angle unit
                      <select value={selectedMarkup.angleUnit || "degrees"} onChange={(event) => updateSelected({ angleUnit: event.target.value as Markup["angleUnit"] })}>
                        <option value="degrees">Degrees (°)</option>
                        <option value="radians">Radians (rad)</option>
                      </select>
                    </label>
                  )}
                  {selectedMarkup.kind === "slope" && (
                    <label>
                      Slope format
                      <select value={selectedMarkup.slopeUnit || "percent"} onChange={(event) => updateSelected({ slopeUnit: event.target.value as Markup["slopeUnit"] })}>
                        <option value="percent">Percent (%)</option>
                        <option value="ratio">Ratio (1:n)</option>
                        <option value="degrees">Degrees (°)</option>
                      </select>
                    </label>
                  )}
                  {selectedMarkup.kind !== "count" && (
                    <label>
                      Display precision
                      <select value={selectedMarkup.precision ?? measurementPrecision} onChange={(event) => updateSelected({ precision: Number(event.target.value) })}>
                        {[0, 1, 2, 3, 4].map((value) => <option key={value} value={value}>{value} decimal{value === 1 ? "" : "s"}</option>)}
                      </select>
                    </label>
                  )}
                  <p className="measurement-help">Unit changes affect only this selected measurement. Geometry and the calibrated page scale remain unchanged.</p>
                </section>
              )}

              {inspectorTab === "appearance" && (
              <section className="inspector-section">
                <span className="field-title">Markup color</span>
                <div className="color-row">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Set color ${color}`}
                      className={selectedMarkup.stroke === color ? "is-active" : ""}
                      style={{ background: color }}
                      onClick={() => updateSelected({ stroke: color, fill: ["area", "volume"].includes(selectedMarkup.kind) ? `${color}1f` : selectedMarkup.fill })}
                    />
                  ))}
                </div>
                <label>
                  Stroke width <span>{selectedMarkup.strokeWidth}px</span>
                  <input type="range" min="1" max="16" value={selectedMarkup.strokeWidth} onChange={(event) => updateSelected({ strokeWidth: Number(event.target.value) })} />
                </label>
                <label>
                  Engineering line style
                  <select value={selectedMarkup.lineStyle || "solid"} onChange={(event) => updateSelected({ lineStyle: event.target.value as LineStyle })}>
                    {LINE_STYLES.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
                  </select>
                </label>
                {["rectangle", "area", "volume"].includes(selectedMarkup.kind) && (
                  <div className="fill-fields">
                    <label>
                      Fill or hatch
                      <select value={selectedMarkup.fillStyle || "none"} onChange={(event) => updateSelected({ fillStyle: event.target.value as FillStyle })}>
                        {FILL_STYLES.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
                      </select>
                    </label>
                    <label>
                      Fill colour
                      <input type="color" value={selectedMarkup.fillColor || selectedMarkup.stroke} onChange={(event) => updateSelected({ fillColor: event.target.value })} />
                    </label>
                  </div>
                )}
                <label>
                  Opacity <span>{Math.round(selectedMarkup.opacity * 100)}%</span>
                  <input type="range" min="0.1" max="1" step="0.05" value={selectedMarkup.opacity} onChange={(event) => updateSelected({ opacity: Number(event.target.value) })} />
                </label>
                {MEASUREMENT_KINDS.includes(selectedMarkup.kind) && selectedMarkup.kind !== "count" && (
                  <div className="font-fields">
                    <label>
                      Label font
                      <select value={selectedMarkup.fontFamily || "Helvetica"} onChange={(event) => updateSelected({ fontFamily: event.target.value as Markup["fontFamily"] })}>
                        <option>Helvetica</option>
                        <option>Times Roman</option>
                        <option>Courier</option>
                      </select>
                    </label>
                    <label>
                      Label size
                      <input type="number" min="7" max="72" value={selectedMarkup.fontSize || 11} onChange={(event) => updateSelected({ fontSize: Math.max(7, Math.min(72, Number(event.target.value))) })} />
                    </label>
                  </div>
                )}
              </section>
              )}

              <section className="inspector-section action-stack">
                {["area", "volume"].includes(selectedMarkup.kind) && (
                  <>
                    <button type="button" className="secondary-button" onClick={beginCutout}><Minus size={15} /> Add area cut-out</button>
                    {Boolean(selectedMarkup.holes?.length) && <button type="button" className="secondary-button" onClick={removeLastCutout}>Remove last cut-out ({selectedMarkup.holes?.length})</button>}
                  </>
                )}
                <button type="button" className="primary-button" onClick={saveSelectedSymbol}><Save size={15} /> Save as preset</button>
                <button type="button" className="secondary-button" onClick={duplicateSelected}><Copy size={15} /> Duplicate markup</button>
                <button type="button" className="danger-button" onClick={() => deleteMarkup(selectedMarkup.id)} disabled={selectedMarkup.locked}><Trash2 size={15} /> Delete markup</button>
              </section>
            </div>
          ) : (
            <section className="empty-selection">
              <BoxSelect size={28} />
              <strong>No markup selected</strong>
              <p>Choose Select, then click or drag a markup to edit, move, duplicate, lock, or delete it.</p>
              <div className="default-style">
                <span className="field-title">New markup color</span>
                <div className="color-row">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Set new markup color ${color}`}
                      className={stroke === color ? "is-active" : ""}
                      style={{ background: color }}
                      onClick={() => setStroke(color)}
                    />
                  ))}
                </div>
                <label>
                  New markup layer
                  <select value={activeLayer} onChange={(event) => setActiveLayer(event.target.value)}>
                    {allLayers.filter((layer) => layer !== "Imported annotations").map((layer) => <option key={layer}>{layer}</option>)}
                  </select>
                </label>
                <label>
                  New line style
                  <select value={lineStyle} onChange={(event) => setLineStyle(event.target.value as LineStyle)}>
                    {LINE_STYLES.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
                  </select>
                </label>
                <div className="fill-fields">
                  <label>
                    New fill
                    <select value={fillStyle} onChange={(event) => setFillStyle(event.target.value as FillStyle)}>
                      {FILL_STYLES.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
                    </select>
                  </label>
                  <label>
                    Fill colour
                    <input type="color" value={fillColor} onChange={(event) => setFillColor(event.target.value)} />
                  </label>
                </div>
              </div>
            </section>
          )}

          <div className="inspector-footer">
            <button type="button" onClick={exportProject} disabled={!source}><Download size={14} /> Project backup</button>
            <button type="button" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Replace file</button>
          </div>
        </aside>
      </section>

      <section className={`markups-drawer ${bottomOpen ? "is-open" : ""}`}>
        <button className="drawer-heading" type="button" onClick={() => setBottomOpen((open) => !open)}>
          <span className="drawer-title"><PenLine size={16} /> Review Register <b>{markups.length}</b></span>
          <span className="drawer-summary">{markups.filter((markup) => markup.visible).length} visible · {Object.keys(scales).length} scaled page{Object.keys(scales).length === 1 ? "" : "s"}</span>
          {bottomOpen ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
        </button>
        {bottomOpen && (
          <div className="markups-table-wrap">
            <div className="register-toolbar">
              <Search size={15} />
              <input value={registerQuery} onChange={(event) => setRegisterQuery(event.target.value)} placeholder="Filter by type, subject, layer, note, author, or status" aria-label="Filter review register" />
              {registerQuery && <button type="button" onClick={() => setRegisterQuery("")}><X size={14} /> Clear</button>}
            </div>
            {markups.length && filteredMarkups.length ? (
              <table className="markups-table">
                <thead>
                  <tr><th>Type</th><th>Subject</th><th>Layer</th><th>Page</th><th>Measurement</th><th>Status</th><th>Author</th><th>Comment</th><th><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {filteredMarkups.map((markup) => {
                    const Icon = TOOL_ICONS[markup.kind];
                    return (
                      <tr key={markup.id} className={selectedId === markup.id ? "is-selected" : ""} onClick={() => { setCurrentPage(markup.page); setSelectedId(markup.id); setActiveTool("select"); }}>
                        <td><span className="type-cell" style={{ color: markup.stroke }}><Icon size={15} /> {TOOL_LABELS[markup.kind]}</span></td>
                        <td>{markup.subject}</td>
                        <td>{markup.layer || "Structural"}</td>
                        <td>{markup.page}</td>
                        <td>{formatMeasurement(markup, scales[markup.page])}</td>
                        <td><span className={`status-chip status-${(markup.status || "Open").toLowerCase().replace(" ", "-")}`}>{markup.status || "Open"}</span></td>
                        <td>{markup.author}</td>
                        <td className="comment-cell">{markup.comment || "—"}</td>
                        <td className="row-actions">
                          <button type="button" aria-label={markup.visible ? "Hide markup" : "Show markup"} onClick={(event) => { event.stopPropagation(); commitMarkups(markups.map((item) => item.id === markup.id ? { ...item, visible: !item.visible } : item)); }}>
                            {markup.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button type="button" aria-label="Delete markup" onClick={(event) => { event.stopPropagation(); deleteMarkup(markup.id); }}><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="table-empty"><Search size={19} /><span>{markups.length ? "No review items match this filter." : "Review items will appear here as you work."}</span></div>
            )}
          </div>
        )}
      </section>

      {textEntry && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="text-note-title">
            <button className="dialog-close" type="button" aria-label="Cancel text note" onClick={() => setTextEntry(null)}><X size={17} /></button>
            <span className="dialog-icon"><Type size={21} /></span>
            <span className="eyebrow">{textEntry.editingId ? "Edit text" : "Text note"}</span>
            <h2 id="text-note-title">{textEntry.editingId ? "Update this note" : "Add a note to the drawing"}</h2>
            <p>Set the wording and typography. Double-click the note later to reopen this editor.</p>
            <label>
              Note text
              <textarea rows={3} value={textEntry.value} onChange={(event) => setTextEntry({ ...textEntry, value: event.target.value })} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") submitTextEntry(); }} placeholder="Type the coordination note…" />
            </label>
            <div className="font-fields">
              <label>
                Font
                <select value={textEntry.fontFamily} onChange={(event) => setTextEntry({ ...textEntry, fontFamily: event.target.value as NonNullable<Markup["fontFamily"]> })}>
                  <option>Helvetica</option><option>Times Roman</option><option>Courier</option>
                </select>
              </label>
              <label>
                Size
                <input type="number" min="7" max="72" value={textEntry.fontSize} onChange={(event) => setTextEntry({ ...textEntry, fontSize: Math.max(7, Math.min(72, Number(event.target.value))) })} />
              </label>
            </div>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setTextEntry(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={submitTextEntry}>{textEntry.editingId ? "Save changes" : "Place note"}</button>
            </div>
          </section>
        </div>
      )}

      {referenceSetup && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="reference-title">
            <button className="dialog-close" type="button" aria-label="Cancel reference setup" onClick={() => setReferenceSetup(null)}><X size={17} /></button>
            <span className="dialog-icon"><Ruler size={21} /></span>
            <span className="eyebrow">Two-point reference</span>
            <h2 id="reference-title">What distance did you mark?</h2>
            <p>Enter the real-world length between the two points you selected.</p>
            <div className="reference-fields">
              <label>
                Known distance
                <input inputMode="decimal" value={referenceSetup.value} onChange={(event) => setReferenceSetup({ ...referenceSetup, value: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") applyReferenceScale(); }} />
              </label>
              <label>
                Unit
                <select value={referenceSetup.unit} onChange={(event) => setReferenceSetup({ ...referenceSetup, unit: event.target.value as Unit })}>
                  <option value="mm">Millimetres</option>
                  <option value="cm">Centimetres</option>
                  <option value="m">Metres</option>
                  <option value="in">Inches</option>
                  <option value="ft">Feet</option>
                </select>
              </label>
            </div>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setReferenceSetup(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={applyReferenceScale}>Set reference scale</button>
            </div>
          </section>
        </div>
      )}

      {proOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog pro-dialog" role="dialog" aria-modal="true" aria-labelledby="pro-workspace-title">
            <button className="dialog-close" type="button" aria-label="Close Pro workspace" onClick={() => setProOpen(false)}><X size={17} /></button>
            <div className="pro-dialog-header">
              <span className="dialog-icon pro-dialog-icon"><Cloud size={21} /></span>
              <div>
                <span className="eyebrow">Pro workspace · early access</span>
                <h2 id="pro-workspace-title">Projects, reports and libraries</h2>
                <p>Keep complete drawings editable on this device, autosave active projects and prepare professional outputs.</p>
              </div>
            </div>

            <div className="pro-metrics" aria-label="Workspace summary">
              <div><strong>{localProjects.length}</strong><span>Saved projects</span></div>
              <div><strong>{markups.length}</strong><span>Current markups</span></div>
              <div><strong>{measurementSummary.reduce((total, row) => total + row.items, 0)}</strong><span>Measurements</span></div>
              <div><strong>{savedSymbols.length}</strong><span>Presets</span></div>
            </div>

            <section className="pro-section current-project-card">
              <div className="pro-section-heading">
                <div>
                  <span className="field-title">Current project</span>
                  <small>{source ? `${source.name} · ${source.pageCount} page${source.pageCount === 1 ? "" : "s"}` : "Open a drawing to create a project"}</small>
                </div>
                <span className={`project-save-state state-${projectSaveStatus}`}>
                  {projectSaveStatus === "saving" ? "Saving…" : projectSaveStatus === "saved" ? "Saved" : projectSaveStatus === "error" ? "Storage issue" : "Not saved"}
                </span>
              </div>
              <div className="project-name-row">
                <label>
                  Project name
                  <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. Ground floor coordination" disabled={!source} />
                </label>
                <button type="button" className="primary-button" onClick={() => void saveCurrentProject()} disabled={!source || projectSaveStatus === "saving"}>
                  <Save size={15} /> {activeProjectId ? "Save now" : "Save project"}
                </button>
              </div>
              <label className="autosave-toggle">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setAutoSaveEnabled(enabled);
                    window.localStorage.setItem(AUTOSAVE_STORAGE_KEY, enabled ? "on" : "off");
                  }}
                />
                <span><b>Autosave active project</b><small>Updates markups, scales, layers and measurement settings after changes.</small></span>
              </label>
            </section>

            <section className="pro-section">
              <div className="pro-section-heading">
                <div><span className="field-title">On-device projects</span><small>The source PDF or photo is included for one-click restoration.</small></div>
                <button type="button" className="text-button" onClick={() => void refreshLocalProjects()}>Refresh</button>
              </div>
              {!projectStorageReady ? (
                <div className="pro-empty warning"><OctagonAlert size={17} /><span>Browser project storage is unavailable. Portable JSON backups remain available.</span></div>
              ) : localProjects.length ? (
                <div className="project-list">
                  {localProjects.map((project) => (
                    <article className={`project-row ${activeProjectId === project.id ? "is-active" : ""}`} key={project.id}>
                      <span className="project-file-icon">{project.sourceKind === "pdf" ? <FileText size={18} /> : <FileImage size={18} />}</span>
                      <div className="project-row-copy">
                        <strong>{project.name}</strong>
                        <span>{project.sourceName} · {project.pageCount} page{project.pageCount === 1 ? "" : "s"} · {formatFileSize(project.sourceSize)}</span>
                        <small>{project.markupCount} markups · {project.measurementCount} measurements · {formatProjectDate(project.updatedAt)}</small>
                      </div>
                      <div className="project-row-actions">
                        <button type="button" className="secondary-button" onClick={() => void openSavedProject(project.id)} disabled={projectBusyId === project.id}>
                          {projectBusyId === project.id ? "Opening…" : "Open"}
                        </button>
                        <button type="button" className="icon-danger" aria-label={`Delete ${project.name}`} title="Delete project" onClick={() => void removeSavedProject(project)} disabled={projectBusyId === project.id}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="pro-empty"><Save size={18} /><span>Your saved projects will appear here.</span></div>
              )}
            </section>

            <section className="pro-section pro-output-section">
              <div className="pro-section-heading"><div><span className="field-title">Professional outputs</span><small>Reports and portable files stay under your control.</small></div></div>
              <div className="pro-action-grid">
                <button type="button" onClick={() => void exportQuantityReportPdf()} disabled={!measurementSummary.length || exporting}><ListChecks size={17} /><span><b>Quantity report PDF</b><small>Summary and itemised register</small></span></button>
                <button type="button" onClick={exportSummaryCsv} disabled={!measurementSummary.length}><Download size={17} /><span><b>Summary spreadsheet</b><small>CSV grouped by layer and unit</small></span></button>
                <button type="button" onClick={exportProject} disabled={!source}><Download size={17} /><span><b>Portable project backup</b><small>Markup data, scales and settings</small></span></button>
                <button type="button" onClick={() => projectBackupInputRef.current?.click()}><Upload size={17} /><span><b>Restore project backup</b><small>Requires its original source drawing</small></span></button>
                <button type="button" onClick={exportPresetLibrary} disabled={!savedSymbols.length}><Library size={17} /><span><b>Download preset library</b><small>Move symbols between devices</small></span></button>
                <button type="button" onClick={() => presetLibraryInputRef.current?.click()}><Upload size={17} /><span><b>Import preset library</b><small>Add reusable markup presets</small></span></button>
              </div>
            </section>

            <div className="pro-privacy-note">
              <Cloud size={17} />
              <div><strong>Private on-device storage</strong><p>No account or remote drawing upload is used in this early-access workspace. Secure cross-device cloud sync requires the separate account and database stage.</p></div>
            </div>
          </section>
        </div>
      )}

      {summaryOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog summary-dialog" role="dialog" aria-modal="true" aria-labelledby="summary-title">
            <button className="dialog-close" type="button" aria-label="Close measurement summary" onClick={() => setSummaryOpen(false)}><X size={17} /></button>
            <span className="dialog-icon"><ListChecks size={21} /></span>
            <span className="eyebrow">Quantity summary</span>
            <h2 id="summary-title">Measurements by layer</h2>
            <p>Totals are grouped by layer, measurement type, and unit. Lengths and areas without a valid scale are labelled unscaled.</p>
            <div className="summary-table-wrap">
              <table className="summary-table">
                <thead><tr><th>Layer</th><th>Measurement</th><th>Items</th><th>Total</th><th>Unit</th></tr></thead>
                <tbody>
                  {measurementSummary.map((row) => (
                    <tr key={`${row.layer}-${row.type}-${row.unit}`}>
                      <td>{row.layer}</td><td>{row.type}</td><td>{row.items}</td><td>{row.total.toFixed(row.precision)}</td><td>{row.unit || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setSummaryOpen(false)}>Close</button>
              <button type="button" className="secondary-button" onClick={() => void exportQuantityReportPdf()} disabled={exporting}><FileText size={15} /> Export PDF report</button>
              <button type="button" className="primary-button" onClick={exportSummaryCsv}><Download size={15} /> Export CSV</button>
            </div>
          </section>
        </div>
      )}

      {helpOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <button className="dialog-close" type="button" aria-label="Close help" onClick={() => setHelpOpen(false)}><X size={17} /></button>
            <span className="eyebrow">Quick guide</span>
            <h2 id="help-title">Review drawings with confidence</h2>
            <ol>
              <li><b>Upload</b><span>Open a PDF drawing or a JPG/PNG site photo. Files are processed locally while you work.</span></li>
              <li><b>Set scale</b><span>Apply a preset or custom ratio, or define the reference from two points across a known distance.</span></li>
              <li><b>Review</b><span>Add notes, highlights, revision clouds, engineering line styles, hatches, distance paths, perimeters, areas, volumes, diameter/radius, slope, angles, and tallies. Select an object and drag its blue vertex handles to reshape it.</span></li>
              <li><b>Edit</b><span>Imported standard PDF annotations and new markups can be selected, moved, restyled, layered, duplicated, locked, or deleted.</span></li>
              <li><b>Measure</b><span>Double-click or press Enter to finish paths and areas. Change units per measurement, enter volume height, and subtract cut-outs from Areas and Volumes.</span></li>
              <li><b>Summarise</b><span>Open Quantity Summary to review deterministic totals grouped by layer and export them as CSV.</span></li>
              <li><b>Export</b><span>Create an editable annotation PDF for continued review or a fixed PDF for issue and archive.</span></li>
            </ol>
            <div className="compatibility-note">
              <strong>Interoperability</strong>
              <p>Structura writes standard PDF annotation dictionaries and appearance streams. Keep a Structura project backup as an additional recovery record for scale, workflow, and library data.</p>
            </div>
            <p className="independent-note">Tip: scroll over the drawing to zoom around the pointer. Hold Shift while drawing lines for 45-degree constraints.</p>
            <button type="button" className="primary-button" onClick={() => setHelpOpen(false)}>Got it</button>
          </section>
        </div>
      )}
    </main>
  );
}
