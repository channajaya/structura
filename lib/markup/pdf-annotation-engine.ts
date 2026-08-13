import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRef,
  PDFString,
  StandardFonts,
  type PDFFont,
} from "pdf-lib";

export type Unit = "mm" | "cm" | "m" | "in" | "ft";
export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type MarkupKind =
  | "text"
  | "callout"
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "cloud"
  | "freehand"
  | "highlight"
  | "length"
  | "polyline"
  | "perimeter"
  | "area"
  | "volume"
  | "diameter"
  | "radius"
  | "slope"
  | "angle"
  | "count";

export type LineStyle = "solid" | "dashed" | "dotted" | "dashdot" | "center" | "hidden";
export type FillStyle = "none" | "solid" | "diagonal" | "crosshatch";

export type PageScale = {
  page: number;
  pixelsPerUnit: number;
  unit: Unit;
  source?: "reference" | "preset";
  label?: string;
  referencedFrom?: { points: [Point, Point]; knownLength: number };
};

export type Markup = {
  id: string;
  page: number;
  kind: MarkupKind;
  points: Point[];
  text?: string;
  subject: string;
  comment: string;
  author: string;
  stroke: string;
  fill?: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  createdAt: string;
  fontFamily?: "Helvetica" | "Times Roman" | "Courier";
  fontSize?: number;
  status?: "Open" | "In review" | "Resolved";
  locked?: boolean;
  lineStyle?: LineStyle;
  fillStyle?: FillStyle;
  fillColor?: string;
  layer?: string;
  sourceAnnotationRef?: string;
  sourceAnnotationName?: string;
  holes?: Point[][];
  depth?: number;
  depthUnit?: Unit;
  displayUnit?: Unit;
  angleUnit?: "degrees" | "radians";
  slopeUnit?: "percent" | "ratio" | "degrees";
  precision?: number;
};

type ExportInput = {
  sourceBytes: ArrayBuffer;
  sourceKind: "pdf" | "png" | "jpeg";
  pageSizes: Record<number, Size>;
  markups: Markup[];
  scales: Record<number, PageScale>;
  removedSourceAnnotationRefs?: string[];
};

type PdfPoint = { x: number; y: number };
type Rect = [number, number, number, number];

const safeNumber = (value: number) => Math.round(value * 1000) / 1000;

function rgb(hex: string) {
  const normalized = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  return [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
}

function colorOperators(hex: string) {
  return rgb(hex).map(safeNumber).join(" ");
}

function pdfDate(value: string) {
  const date = new Date(value);
  const valid = Number.isNaN(date.getTime()) ? new Date() : date;
  const pad = (part: number) => String(part).padStart(2, "0");
  return `D:${valid.getUTCFullYear()}${pad(valid.getUTCMonth() + 1)}${pad(valid.getUTCDate())}${pad(valid.getUTCHours())}${pad(valid.getUTCMinutes())}${pad(valid.getUTCSeconds())}Z`;
}

function encodeAppearanceText(font: PDFFont, value: string) {
  try {
    return font.encodeText(value).toString();
  } catch {
    return font.encodeText(value.replace(/[^\x20-\x7E]/g, "?")).toString();
  }
}

function bounds(points: PdfPoint[], padding = 0): Rect {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return [
    Math.min(...xs) - padding,
    Math.min(...ys) - padding,
    Math.max(...xs) + padding,
    Math.max(...ys) + padding,
  ];
}

function localize(point: PdfPoint, rect: Rect): PdfPoint {
  return { x: point.x - rect[0], y: point.y - rect[1] };
}

function pointsArray(points: PdfPoint[]) {
  return points.flatMap((point) => [safeNumber(point.x), safeNumber(point.y)]);
}

function arrowPath(from: PdfPoint, to: PdfPoint, size: number, closed: boolean) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const left = {
    x: to.x - size * Math.cos(angle - Math.PI / 6),
    y: to.y - size * Math.sin(angle - Math.PI / 6),
  };
  const right = {
    x: to.x - size * Math.cos(angle + Math.PI / 6),
    y: to.y - size * Math.sin(angle + Math.PI / 6),
  };
  return `${safeNumber(left.x)} ${safeNumber(left.y)} m ${safeNumber(to.x)} ${safeNumber(to.y)} l ${safeNumber(right.x)} ${safeNumber(right.y)} l ${closed ? "h f" : "S"}`;
}

function circlePath(center: PdfPoint, radius: number) {
  const k = radius * 0.5522848;
  return [
    `${safeNumber(center.x + radius)} ${safeNumber(center.y)} m`,
    `${safeNumber(center.x + radius)} ${safeNumber(center.y + k)} ${safeNumber(center.x + k)} ${safeNumber(center.y + radius)} ${safeNumber(center.x)} ${safeNumber(center.y + radius)} c`,
    `${safeNumber(center.x - k)} ${safeNumber(center.y + radius)} ${safeNumber(center.x - radius)} ${safeNumber(center.y + k)} ${safeNumber(center.x - radius)} ${safeNumber(center.y)} c`,
    `${safeNumber(center.x - radius)} ${safeNumber(center.y - k)} ${safeNumber(center.x - k)} ${safeNumber(center.y - radius)} ${safeNumber(center.x)} ${safeNumber(center.y - radius)} c`,
    `${safeNumber(center.x + k)} ${safeNumber(center.y - radius)} ${safeNumber(center.x + radius)} ${safeNumber(center.y - k)} ${safeNumber(center.x + radius)} ${safeNumber(center.y)} c S`,
  ].join(" ");
}

function dashOperator(style: LineStyle | undefined, width: number) {
  if (style === "dashed") return `[${safeNumber(width * 4)} ${safeNumber(width * 2)}] 0 d`;
  if (style === "dotted") return `[${safeNumber(width)} ${safeNumber(width * 2)}] 0 d`;
  if (style === "dashdot") return `[${safeNumber(width * 4)} ${safeNumber(width * 2)} ${safeNumber(width)} ${safeNumber(width * 2)}] 0 d`;
  if (style === "center") return `[${safeNumber(width * 7)} ${safeNumber(width * 2)} ${safeNumber(width * 1.5)} ${safeNumber(width * 2)}] 0 d`;
  if (style === "hidden") return `[${safeNumber(width * 2)} ${safeNumber(width * 2)}] 0 d`;
  return `[] 0 d`;
}

function dashArray(style: LineStyle | undefined, width: number) {
  if (style === "dashed") return [width * 4, width * 2];
  if (style === "dotted") return [width, width * 2];
  if (style === "dashdot") return [width * 4, width * 2, width, width * 2];
  if (style === "center") return [width * 7, width * 2, width * 1.5, width * 2];
  if (style === "hidden") return [width * 2, width * 2];
  return undefined;
}

function hatchAppearance(width: number, height: number, color: string, style: FillStyle | undefined) {
  if (style === "none" || !style) return "";
  if (style === "solid") return `${color} rg 0 0 ${safeNumber(width)} ${safeNumber(height)} re f`;
  const spacing = 10;
  const lines: string[] = [];
  for (let offset = -height; offset < width + height; offset += spacing) {
    lines.push(`${safeNumber(offset)} 0 m ${safeNumber(offset + height)} ${safeNumber(height)} l S`);
    if (style === "crosshatch") lines.push(`${safeNumber(offset)} ${safeNumber(height)} m ${safeNumber(offset + height)} 0 l S`);
  }
  return `${color} RG 0.7 w ${lines.join(" ")}`;
}

function cloudAppearance(width: number, height: number, color: string, lineWidth: number) {
  const radius = Math.max(3, Math.min(10, Math.min(width, height) / 7));
  const centers: PdfPoint[] = [];
  const addEdge = (start: PdfPoint, end: PdfPoint) => {
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const count = Math.max(2, Math.ceil(length / (radius * 1.55)));
    for (let index = 0; index < count; index += 1) {
      const amount = index / count;
      centers.push({ x: start.x + (end.x - start.x) * amount, y: start.y + (end.y - start.y) * amount });
    }
  };
  addEdge({ x: radius, y: radius }, { x: width - radius, y: radius });
  addEdge({ x: width - radius, y: radius }, { x: width - radius, y: height - radius });
  addEdge({ x: width - radius, y: height - radius }, { x: radius, y: height - radius });
  addEdge({ x: radius, y: height - radius }, { x: radius, y: radius });
  const k = radius * 0.5522848;
  const circles = centers.map(({ x, y }) => [
    `${safeNumber(x + radius)} ${safeNumber(y)} m`,
    `${safeNumber(x + radius)} ${safeNumber(y + k)} ${safeNumber(x + k)} ${safeNumber(y + radius)} ${safeNumber(x)} ${safeNumber(y + radius)} c`,
    `${safeNumber(x - k)} ${safeNumber(y + radius)} ${safeNumber(x - radius)} ${safeNumber(y + k)} ${safeNumber(x - radius)} ${safeNumber(y)} c`,
    `${safeNumber(x - radius)} ${safeNumber(y - k)} ${safeNumber(x - k)} ${safeNumber(y - radius)} ${safeNumber(x)} ${safeNumber(y - radius)} c`,
    `${safeNumber(x + k)} ${safeNumber(y - radius)} ${safeNumber(x + radius)} ${safeNumber(y - k)} ${safeNumber(x + radius)} ${safeNumber(y)} c S`,
  ].join(" ")).join(" ");
  return `${color} RG ${safeNumber(lineWidth)} w ${circles}`;
}

const UNIT_IN_METERS: Record<Unit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  in: 0.0254,
  ft: 0.3048,
};

function convertUnit(value: number, from: Unit, to: Unit, power = 1) {
  return value * (UNIT_IN_METERS[from] / UNIT_IN_METERS[to]) ** power;
}

function formatMeasurement(markup: Markup, scale?: PageScale) {
  const precision = Math.max(0, Math.min(4, markup.precision ?? 2));
  if (markup.kind === "count") return "1 item";
  if (markup.kind === "angle" && markup.points.length > 2) {
    const [a, vertex, c] = markup.points;
    const first = Math.atan2(a.y - vertex.y, a.x - vertex.x);
    const second = Math.atan2(c.y - vertex.y, c.x - vertex.x);
    let degrees = Math.abs((second - first) * 180 / Math.PI);
    if (degrees > 180) degrees = 360 - degrees;
    if (markup.angleUnit === "radians") return `${(degrees * Math.PI / 180).toFixed(Math.max(2, precision))} rad`;
    return `${degrees.toFixed(Math.max(1, precision))}°`;
  }
  if (markup.kind === "slope" && markup.points.length > 1) {
    const [a, b] = markup.points;
    const run = Math.abs(b.x - a.x);
    const rise = Math.abs(b.y - a.y);
    if (run <= 0) return "Vertical";
    const ratio = rise / run;
    if (markup.slopeUnit === "ratio") return ratio > 0 ? `1:${(1 / ratio).toFixed(Math.max(1, precision))}` : "1:0";
    if (markup.slopeUnit === "degrees") return `${(Math.atan(ratio) * 180 / Math.PI).toFixed(Math.max(1, precision))}°`;
    return `${(ratio * 100).toFixed(precision)}%`;
  }
  if (!scale) return "Scale required";
  const outputUnit = markup.displayUnit || scale.unit;
  if (["length", "diameter", "radius"].includes(markup.kind) && markup.points.length > 1) {
    const [a, b] = markup.points;
    const value = convertUnit(Math.hypot(b.x - a.x, b.y - a.y) / scale.pixelsPerUnit, scale.unit, outputUnit);
    return `${value.toFixed(precision)} ${outputUnit}`;
  }
  if (["polyline", "perimeter"].includes(markup.kind) && markup.points.length > 1) {
    const points = markup.kind === "perimeter" ? [...markup.points, markup.points[0]] : markup.points;
    const length = points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
    return `${convertUnit(length / scale.pixelsPerUnit, scale.unit, outputUnit).toFixed(precision)} ${outputUnit}`;
  }
  if (["area", "volume"].includes(markup.kind) && markup.points.length > 2) {
    const polygon = (points: Point[]) => Math.abs(points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2);
    const area = Math.max(0, polygon(markup.points) - (markup.holes || []).reduce((sum, hole) => sum + polygon(hole), 0));
    if (markup.kind === "volume") {
      const baseArea = area / scale.pixelsPerUnit ** 2;
      const depthInScaleUnit = convertUnit(Math.max(0, markup.depth || 0), markup.depthUnit || scale.unit, scale.unit);
      return `${convertUnit(baseArea * depthInScaleUnit, scale.unit, outputUnit, 3).toFixed(precision)} ${outputUnit}³`;
    }
    return `${convertUnit(area / scale.pixelsPerUnit ** 2, scale.unit, outputUnit, 2).toFixed(precision)} ${outputUnit}²`;
  }
  return markup.subject;
}

function measurementLabelAppearance(
  text: string,
  center: PdfPoint,
  fontSize: number,
  font: PDFFont,
  color: string,
) {
  const labelSize = Math.max(7, Math.min(36, fontSize));
  const width = Math.max(30, font.widthOfTextAtSize(text, labelSize) + 10);
  const height = labelSize + 7;
  const left = center.x - width / 2;
  const bottom = center.y - height / 2;
  return `q 1 1 1 rg ${safeNumber(left)} ${safeNumber(bottom)} ${safeNumber(width)} ${safeNumber(height)} re f ${color} RG 0.8 w ${safeNumber(left)} ${safeNumber(bottom)} ${safeNumber(width)} ${safeNumber(height)} re S BT /F1 ${safeNumber(labelSize)} Tf ${color} rg 1 0 0 1 ${safeNumber(left + 5)} ${safeNumber(bottom + 3)} Tm ${encodeAppearanceText(font, text)} Tj ET Q`;
}

function addAnnotation(
  pdf: PDFDocument,
  pageIndex: number,
  markup: Markup,
  sourceSize: Size,
  scale: PageScale | undefined,
  fonts: Record<NonNullable<Markup["fontFamily"]>, PDFFont>,
  layerRefs: Map<string, PDFRef>,
  tallyNumber: number,
) {
  const page = pdf.getPage(pageIndex);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;
  const rotated = rotation === 90 || rotation === 270;
  const sx = (rotated ? pageHeight : pageWidth) / sourceSize.width;
  const sy = (rotated ? pageWidth : pageHeight) / sourceSize.height;
  const outputUnit = markup.displayUnit || scale?.unit;
  const measurementFactor = scale && outputUnit ? UNIT_IN_METERS[scale.unit] / UNIT_IN_METERS[outputUnit] : 1;
  const map = (point: Point): PdfPoint => {
    const viewportX = point.x * sx;
    const viewportY = point.y * sy;
    if (rotation === 90) return { x: viewportY, y: viewportX };
    if (rotation === 180) return { x: pageWidth - viewportX, y: viewportY };
    if (rotation === 270) return { x: pageWidth - viewportY, y: pageHeight - viewportX };
    return { x: viewportX, y: pageHeight - viewportY };
  };
  const mapped = markup.points.map(map);
  const mappedHoles = (markup.holes || []).map((hole) => hole.map(map));
  if (!mapped.length) return;

  const stroke = colorOperators(markup.stroke);
  const lineWidth = Math.max(0.5, markup.strokeWidth * ((sx + sy) / 2));
  const opacity = Math.max(0.05, Math.min(1, markup.opacity));
  const fontSize = Math.max(7, (markup.fontSize || 15) * sy);
  const fontRef = fonts[markup.fontFamily || "Helvetica"];
  const fontResource = markup.fontFamily === "Courier" ? "StructuraCourier" : markup.fontFamily === "Times Roman" ? "StructuraTimes" : "StructuraHelvetica";
  page.node.setFontDictionary(PDFName.of(fontResource), fontRef.ref);
  const text = markup.text || markup.comment || markup.subject;
  const context = pdf.context;
  const common = {
    Type: "Annot",
    T: PDFHexString.fromText(markup.author || "Structura user"),
    Subj: PDFHexString.fromText(markup.subject || markup.kind),
    Contents: PDFHexString.fromText(
      ["length", "polyline", "perimeter", "area", "volume", "diameter", "radius", "slope", "angle"].includes(markup.kind)
        ? formatMeasurement(markup, scale)
        : text,
    ),
    NM: PDFHexString.fromText(markup.id),
    M: PDFString.of(pdfDate(markup.createdAt)),
    F: 4,
    C: rgb(markup.stroke),
    CA: opacity,
    BS: { W: lineWidth, S: markup.lineStyle && markup.lineStyle !== "solid" ? "D" : "S", D: dashArray(markup.lineStyle, lineWidth) },
    OC: markup.layer ? layerRefs.get(markup.layer) : undefined,
    StructuraDisplayUnit: markup.displayUnit ? PDFHexString.fromText(markup.displayUnit) : undefined,
    StructuraDepthUnit: markup.depthUnit ? PDFHexString.fromText(markup.depthUnit) : undefined,
    StructuraAngleUnit: markup.angleUnit ? PDFHexString.fromText(markup.angleUnit) : undefined,
    StructuraSlopeUnit: markup.slopeUnit ? PDFHexString.fromText(markup.slopeUnit) : undefined,
  };

  let rect: Rect;
  let subtype = "Line";
  let annotationExtras: Record<string, unknown> = {};
  let appearance = "";

  if (markup.kind === "text") {
    const start = mapped[0];
    const width = Math.max(72, text.length * fontSize * 0.62 + 18);
    const height = fontSize + 14;
    rect = [start.x - 4, start.y - height + 5, start.x + width, start.y + 7];
    const w = rect[2] - rect[0];
    const h = rect[3] - rect[1];
    appearance = `q /GS0 gs 1 1 1 rg 0 0 ${safeNumber(w)} ${safeNumber(h)} re f ${stroke} RG ${safeNumber(lineWidth)} w 0.5 0.5 ${safeNumber(w - 1)} ${safeNumber(h - 1)} re S BT /F1 ${safeNumber(fontSize)} Tf ${stroke} rg 1 0 0 1 8 ${safeNumber((h - fontSize) / 2 + 2)} Tm ${encodeAppearanceText(fontRef, text)} Tj ET Q`;
    subtype = "FreeText";
    annotationExtras = {
      DA: PDFString.of(`/${fontResource} ${safeNumber(fontSize)} Tf ${stroke} rg`),
      Q: 0,
      IT: "FreeText",
    };
  } else if (markup.kind === "callout") {
    const anchor = mapped[0];
    const label = mapped[1] || mapped[0];
    const boxWidth = Math.max(84, text.length * fontSize * 0.58 + 18);
    const boxHeight = fontSize + 16;
    const boxPoints = [label, { x: label.x + boxWidth, y: label.y + boxHeight }];
    rect = bounds([...mapped, ...boxPoints], 6);
    const a = localize(anchor, rect);
    const l = localize(label, rect);
    appearance = `q /GS0 gs ${stroke} RG ${safeNumber(lineWidth)} w ${safeNumber(a.x)} ${safeNumber(a.y)} m ${safeNumber(l.x)} ${safeNumber(l.y)} l S 1 1 1 rg ${safeNumber(l.x)} ${safeNumber(l.y)} ${safeNumber(boxWidth)} ${safeNumber(boxHeight)} re f ${stroke} RG ${safeNumber(l.x)} ${safeNumber(l.y)} ${safeNumber(boxWidth)} ${safeNumber(boxHeight)} re S BT /F1 ${safeNumber(fontSize)} Tf ${stroke} rg 1 0 0 1 ${safeNumber(l.x + 8)} ${safeNumber(l.y + 5)} Tm ${encodeAppearanceText(fontRef, text)} Tj ET Q`;
    subtype = "FreeText";
    annotationExtras = {
      DA: PDFString.of(`/${fontResource} ${safeNumber(fontSize)} Tf ${stroke} rg`),
      IT: "FreeTextCallout",
      CL: pointsArray([anchor, label]),
      LE: "OpenArrow",
    };
  } else if (markup.kind === "rectangle" || markup.kind === "ellipse" || markup.kind === "cloud" || markup.kind === "highlight") {
    rect = bounds(mapped, Math.max(2, lineWidth));
    const w = rect[2] - rect[0];
    const h = rect[3] - rect[1];
    if (markup.kind === "ellipse") {
      const k = 0.5522848;
      const cx = w / 2;
      const cy = h / 2;
      const rx = Math.max(1, w / 2 - lineWidth);
      const ry = Math.max(1, h / 2 - lineWidth);
      appearance = `q /GS0 gs ${stroke} RG ${safeNumber(lineWidth)} w ${safeNumber(cx + rx)} ${safeNumber(cy)} m ${safeNumber(cx + rx)} ${safeNumber(cy + k * ry)} ${safeNumber(cx + k * rx)} ${safeNumber(cy + ry)} ${safeNumber(cx)} ${safeNumber(cy + ry)} c ${safeNumber(cx - k * rx)} ${safeNumber(cy + ry)} ${safeNumber(cx - rx)} ${safeNumber(cy + k * ry)} ${safeNumber(cx - rx)} ${safeNumber(cy)} c ${safeNumber(cx - rx)} ${safeNumber(cy - k * ry)} ${safeNumber(cx - k * rx)} ${safeNumber(cy - ry)} ${safeNumber(cx)} ${safeNumber(cy - ry)} c ${safeNumber(cx + k * rx)} ${safeNumber(cy - ry)} ${safeNumber(cx + rx)} ${safeNumber(cy - k * ry)} ${safeNumber(cx + rx)} ${safeNumber(cy)} c S Q`;
      subtype = "Circle";
    } else if (markup.kind === "highlight") {
      appearance = `q /GS0 gs ${stroke} rg 0 0 ${safeNumber(w)} ${safeNumber(h)} re f Q`;
      subtype = "Highlight";
      annotationExtras = {
        QuadPoints: [rect[0], rect[3], rect[2], rect[3], rect[0], rect[1], rect[2], rect[1]],
      };
    } else if (markup.kind === "cloud") {
      appearance = `q /GS0 gs ${cloudAppearance(w, h, stroke, lineWidth)} Q`;
      subtype = "Square";
      annotationExtras = { BE: { S: "C", I: 2 } };
    } else {
      const fillColor = colorOperators(markup.fillColor || markup.stroke);
      const fill = hatchAppearance(w, h, fillColor, markup.fillStyle);
      appearance = `q /GS0 gs ${fill} ${stroke} RG ${safeNumber(lineWidth)} w ${dashOperator(markup.lineStyle, lineWidth)} ${safeNumber(lineWidth / 2)} ${safeNumber(lineWidth / 2)} ${safeNumber(w - lineWidth)} ${safeNumber(h - lineWidth)} re S Q`;
      subtype = "Square";
    }
  } else if (markup.kind === "freehand") {
    rect = bounds(mapped, Math.max(3, lineWidth));
    const local = mapped.map((point) => localize(point, rect));
    appearance = `q /GS0 gs ${stroke} RG ${safeNumber(lineWidth)} w ${dashOperator(markup.lineStyle, lineWidth)} 1 J 1 j ${safeNumber(local[0].x)} ${safeNumber(local[0].y)} m ${local.slice(1).map((point) => `${safeNumber(point.x)} ${safeNumber(point.y)} l`).join(" ")} S Q`;
    subtype = "Ink";
    annotationExtras = { InkList: [pointsArray(mapped)] };
  } else if (markup.kind === "area" || markup.kind === "volume") {
    rect = bounds(mapped, Math.max(3, lineWidth));
    const local = mapped.map((point) => localize(point, rect));
    const localHoles = mappedHoles.map((hole) => hole.map((point) => localize(point, rect)));
    const path = (points: PdfPoint[]) => `${safeNumber(points[0].x)} ${safeNumber(points[0].y)} m ${points.slice(1).map((point) => `${safeNumber(point.x)} ${safeNumber(point.y)} l`).join(" ")} h`;
    const allPaths = [path(local), ...localHoles.filter((hole) => hole.length > 2).map(path)].join(" ");
    const fillColor = colorOperators(markup.fillColor || markup.stroke);
    const fill = markup.fillStyle === "solid"
      ? `${fillColor} rg ${allPaths} f*`
      : markup.fillStyle && markup.fillStyle !== "none"
        ? `q ${allPaths} W* n ${hatchAppearance(rect[2] - rect[0], rect[3] - rect[1], fillColor, markup.fillStyle)} Q`
        : "";
    const outlines = [local, ...localHoles].filter((points) => points.length > 2).map((points) => `${path(points)} S`).join(" ");
    const labelCenter = local.reduce((sum, point) => ({ x: sum.x + point.x / local.length, y: sum.y + point.y / local.length }), { x: 0, y: 0 });
    appearance = `q /GS0 gs ${fill} ${stroke} RG ${safeNumber(lineWidth)} w ${dashOperator(markup.lineStyle, lineWidth)} ${outlines} Q ${measurementLabelAppearance(formatMeasurement(markup, scale), labelCenter, fontSize, fontRef, stroke)}`;
    subtype = "Polygon";
    annotationExtras = {
      Vertices: pointsArray(mapped),
      IT: "PolygonDimension",
      StructuraHoles: mappedHoles.filter((hole) => hole.length > 2).map(pointsArray),
      StructuraDepth: markup.kind === "volume" ? Math.max(0, markup.depth || 0) : undefined,
      StructuraDepthUnit: markup.kind === "volume" ? PDFHexString.fromText(markup.depthUnit || scale?.unit || "m") : undefined,
      StructuraPrecision: markup.precision,
      Measure: scale ? {
        Type: "Measure",
        Subtype: "RL",
        R: PDFHexString.fromText(scale.label || `1 ${scale.unit}`),
        X: [{ Type: "NumberFormat", U: PDFHexString.fromText(outputUnit || scale.unit), C: measurementFactor / (scale.pixelsPerUnit * sx) }],
        A: [{ Type: "NumberFormat", U: PDFHexString.fromText(`${outputUnit || scale.unit}²`), C: measurementFactor ** 2 / ((scale.pixelsPerUnit * sx) ** 2) }],
        V: markup.kind === "volume" ? [{ Type: "NumberFormat", U: PDFHexString.fromText(`${outputUnit || scale.unit}³`), C: measurementFactor ** 3 / ((scale.pixelsPerUnit * sx) ** 3) }] : undefined,
      } : undefined,
    };
  } else if (markup.kind === "polyline" || markup.kind === "perimeter") {
    const closed = markup.kind === "perimeter";
    rect = bounds(mapped, Math.max(4, lineWidth));
    const local = mapped.map((point) => localize(point, rect));
    const path = `${safeNumber(local[0].x)} ${safeNumber(local[0].y)} m ${local.slice(1).map((point) => `${safeNumber(point.x)} ${safeNumber(point.y)} l`).join(" ")} ${closed ? "h" : ""} S`;
    const labelPoint = closed
      ? local.reduce((sum, point) => ({ x: sum.x + point.x / local.length, y: sum.y + point.y / local.length }), { x: 0, y: 0 })
      : local[Math.floor(local.length / 2)];
    appearance = `q /GS0 gs ${stroke} RG ${safeNumber(lineWidth)} w ${dashOperator(markup.lineStyle, lineWidth)} ${path} Q ${measurementLabelAppearance(formatMeasurement(markup, scale), labelPoint, fontSize, fontRef, stroke)}`;
    subtype = closed ? "Polygon" : "PolyLine";
    annotationExtras = {
      Vertices: pointsArray(mapped),
      IT: closed ? "PolygonDimension" : "PolyLineDimension",
      StructuraPrecision: markup.precision,
      Measure: scale ? {
        Type: "Measure",
        Subtype: "RL",
        R: PDFHexString.fromText(scale.label || `1 ${scale.unit}`),
        X: [{ Type: "NumberFormat", U: PDFHexString.fromText(outputUnit || scale.unit), C: measurementFactor / (scale.pixelsPerUnit * sx) }],
        D: [{ Type: "NumberFormat", U: PDFHexString.fromText(outputUnit || scale.unit), C: measurementFactor / (scale.pixelsPerUnit * sx) }],
      } : undefined,
    };
  } else if (markup.kind === "angle") {
    rect = bounds(mapped, Math.max(10, lineWidth));
    const [armA, vertex, armB] = mapped.map((point) => localize(point, rect));
    const radius = Math.min(28, Math.hypot(armA.x - vertex.x, armA.y - vertex.y) / 3, Math.hypot(armB.x - vertex.x, armB.y - vertex.y) / 3);
    const startAngle = Math.atan2(armA.y - vertex.y, armA.x - vertex.x);
    const endAngle = Math.atan2(armB.y - vertex.y, armB.x - vertex.x);
    const arcPoints: PdfPoint[] = [];
    for (let step = 0; step <= 12; step += 1) {
      const angle = startAngle + (endAngle - startAngle) * (step / 12);
      arcPoints.push({ x: vertex.x + Math.cos(angle) * radius, y: vertex.y + Math.sin(angle) * radius });
    }
    appearance = `q /GS0 gs ${stroke} RG ${safeNumber(lineWidth)} w ${dashOperator(markup.lineStyle, lineWidth)} ${safeNumber(armA.x)} ${safeNumber(armA.y)} m ${safeNumber(vertex.x)} ${safeNumber(vertex.y)} l ${safeNumber(armB.x)} ${safeNumber(armB.y)} l S ${safeNumber(arcPoints[0].x)} ${safeNumber(arcPoints[0].y)} m ${arcPoints.slice(1).map((point) => `${safeNumber(point.x)} ${safeNumber(point.y)} l`).join(" ")} S Q ${measurementLabelAppearance(formatMeasurement(markup, scale), { x: vertex.x, y: vertex.y + radius + fontSize }, fontSize, fontRef, stroke)}`;
    subtype = "PolyLine";
    annotationExtras = { Vertices: pointsArray(mapped) };
  } else if (markup.kind === "count") {
    const center = mapped[0];
    const radius = 13 * ((sx + sy) / 2);
    rect = [center.x - radius, center.y - radius, center.x + radius, center.y + radius];
    const d = radius * 2;
    const k = 0.5522848;
    appearance = `q /GS0 gs ${stroke} rg ${safeNumber(d)} ${safeNumber(radius)} m ${safeNumber(d)} ${safeNumber(radius + k * radius)} ${safeNumber(radius + k * radius)} ${safeNumber(d)} ${safeNumber(radius)} ${safeNumber(d)} c ${safeNumber(radius - k * radius)} ${safeNumber(d)} 0 ${safeNumber(radius + k * radius)} 0 ${safeNumber(radius)} c 0 ${safeNumber(radius - k * radius)} ${safeNumber(radius - k * radius)} 0 ${safeNumber(radius)} 0 c ${safeNumber(radius + k * radius)} 0 ${safeNumber(d)} ${safeNumber(radius - k * radius)} ${safeNumber(d)} ${safeNumber(radius)} c f BT /F1 ${safeNumber(radius)} Tf 1 1 1 rg 1 0 0 1 ${safeNumber(radius * 0.7)} ${safeNumber(radius * 0.58)} Tm ${encodeAppearanceText(fontRef, String(tallyNumber))} Tj ET Q`;
    subtype = "Stamp";
    annotationExtras = { Name: "StructuraTally" };
  } else {
    rect = bounds(mapped, Math.max(4, lineWidth));
    const start = localize(mapped[0], rect);
    const end = localize(mapped[mapped.length - 1], rect);
    const decorations = markup.kind === "arrow"
      ? `${stroke} rg ${arrowPath(start, end, Math.max(8, lineWidth * 3), true)}`
      : ["length", "diameter", "radius"].includes(markup.kind)
        ? `${arrowPath(end, start, Math.max(7, lineWidth * 3), false)} ${arrowPath(start, end, Math.max(7, lineWidth * 3), false)}`
        : "";
    const measurementShape = markup.kind === "diameter"
      ? circlePath({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, Math.hypot(end.x - start.x, end.y - start.y) / 2)
      : markup.kind === "radius"
        ? circlePath(start, Math.hypot(end.x - start.x, end.y - start.y))
        : markup.kind === "slope"
          ? `${safeNumber(start.x)} ${safeNumber(start.y)} m ${safeNumber(end.x)} ${safeNumber(start.y)} l ${safeNumber(end.x)} ${safeNumber(end.y)} l S`
          : "";
    const measurementLabel = ["length", "diameter", "radius", "slope"].includes(markup.kind)
      ? measurementLabelAppearance(formatMeasurement(markup, scale), { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, fontSize, fontRef, stroke)
      : "";
    appearance = `q /GS0 gs ${stroke} RG ${safeNumber(lineWidth)} w ${dashOperator(markup.lineStyle, lineWidth)} ${safeNumber(start.x)} ${safeNumber(start.y)} m ${safeNumber(end.x)} ${safeNumber(end.y)} l S ${measurementShape} ${decorations} Q ${measurementLabel}`;
    subtype = "Line";
    annotationExtras = {
      L: pointsArray([mapped[0], mapped[mapped.length - 1]]),
      LE: markup.kind === "arrow" ? ["None", "ClosedArrow"] : ["length", "diameter", "radius"].includes(markup.kind) ? ["OpenArrow", "OpenArrow"] : ["None", "None"],
      IT: ["length", "diameter", "radius", "slope"].includes(markup.kind) ? "LineDimension" : "LineArrow",
      Cap: ["length", "diameter", "radius", "slope"].includes(markup.kind) ? true : undefined,
      StructuraMeasurement: ["diameter", "radius", "slope"].includes(markup.kind) ? PDFHexString.fromText(markup.kind) : undefined,
      StructuraPrecision: markup.precision,
      Measure: ["length", "diameter", "radius"].includes(markup.kind) && scale ? {
        Type: "Measure",
        Subtype: "RL",
        R: PDFHexString.fromText(scale.label || `1 ${scale.unit}`),
        X: [{ Type: "NumberFormat", U: PDFHexString.fromText(outputUnit || scale.unit), C: measurementFactor / (scale.pixelsPerUnit * sx) }],
        D: [{ Type: "NumberFormat", U: PDFHexString.fromText(outputUnit || scale.unit), C: measurementFactor / (scale.pixelsPerUnit * sx) }],
      } : undefined,
    };
  }

  const width = Math.max(1, rect[2] - rect[0]);
  const height = Math.max(1, rect[3] - rect[1]);
  const appearanceStream = context.flateStream(appearance, {
    Type: "XObject",
    Subtype: "Form",
    BBox: [0, 0, width, height],
    Matrix: [1, 0, 0, 1, 0, 0],
    Resources: {
      Font: { F1: fontRef.ref },
      ExtGState: { GS0: { Type: "ExtGState", CA: opacity, ca: opacity } },
    },
  });
  const appearanceRef = context.register(appearanceStream);
  const annotation = context.obj({
    ...common,
    Subtype: subtype,
    Rect: rect.map(safeNumber),
    ...annotationExtras,
    AP: { N: appearanceRef },
  });
  const annotationRef = context.register(annotation);
  let annotations = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
  if (!annotations) {
    annotations = context.obj([]) as PDFArray;
    page.node.set(PDFName.of("Annots"), annotations);
  }
  annotations.push(annotationRef);
}

function removeReplacedAnnotations(pdf: PDFDocument, pageNumber: number, refs: Set<string>, names: Set<string>) {
  if (!refs.size && !names.size) return;
  const normalizedRefs = new Set([...refs].map((value) => value.replace(/\s+/g, "").toLowerCase()));
  const page = pdf.getPage(pageNumber - 1);
  const annotations = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
  if (!annotations) return;
  for (let index = annotations.size() - 1; index >= 0; index -= 1) {
    const raw = annotations.get(index);
    const dictionary = pdf.context.lookupMaybe(raw, PDFDict);
    const name = dictionary?.lookupMaybe(PDFName.of("NM"), PDFString, PDFHexString)?.decodeText();
    if (normalizedRefs.has(raw.toString().replace(/\s+/g, "").toLowerCase()) || Boolean(name && names.has(name))) annotations.remove(index);
  }
}

function createLayerReferences(pdf: PDFDocument, layers: string[]) {
  const context = pdf.context;
  const layerRefs = new Map<string, PDFRef>();
  const uniqueLayers = [...new Set(layers.filter(Boolean))];
  if (!uniqueLayers.length) return layerRefs;

  const existingProperties = pdf.catalog.lookupMaybe(PDFName.of("OCProperties"), PDFDict);
  const properties = existingProperties || context.obj({});
  const groups = properties.lookupMaybe(PDFName.of("OCGs"), PDFArray) || context.obj([]) as PDFArray;
  const defaults = properties.lookupMaybe(PDFName.of("D"), PDFDict) || context.obj({});
  const order = defaults.lookupMaybe(PDFName.of("Order"), PDFArray) || context.obj([]) as PDFArray;
  const on = defaults.lookupMaybe(PDFName.of("ON"), PDFArray) || context.obj([]) as PDFArray;

  for (const layer of uniqueLayers) {
    const group = context.obj({ Type: "OCG", Name: PDFHexString.fromText(layer) });
    const ref = context.register(group);
    groups.push(ref);
    order.push(ref);
    on.push(ref);
    layerRefs.set(layer, ref);
  }
  defaults.set(PDFName.of("Order"), order);
  defaults.set(PDFName.of("ON"), on);
  properties.set(PDFName.of("OCGs"), groups);
  properties.set(PDFName.of("D"), defaults);
  if (!existingProperties) pdf.catalog.set(PDFName.of("OCProperties"), properties);
  return layerRefs;
}

export async function createEditablePdf(input: ExportInput) {
  const pdf = input.sourceKind === "pdf"
    ? await PDFDocument.load(input.sourceBytes.slice(0))
    : await PDFDocument.create();

  if (input.sourceKind !== "pdf") {
    const sourceSize = input.pageSizes[1];
    const pageScale = Math.min(1, 1200 / Math.max(sourceSize.width, sourceSize.height));
    const page = pdf.addPage([sourceSize.width * pageScale, sourceSize.height * pageScale]);
    const image = input.sourceKind === "png"
      ? await pdf.embedPng(input.sourceBytes.slice(0))
      : await pdf.embedJpg(input.sourceBytes.slice(0));
    page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
  }

  const fonts = {
    Helvetica: await pdf.embedFont(StandardFonts.Helvetica),
    "Times Roman": await pdf.embedFont(StandardFonts.TimesRoman),
    Courier: await pdf.embedFont(StandardFonts.Courier),
  };
  const layerRefs = createLayerReferences(pdf, input.markups.map((markup) => markup.layer || ""));
  for (let pageNumber = 1; pageNumber <= pdf.getPageCount(); pageNumber += 1) {
    const sourceSize = input.pageSizes[pageNumber];
    if (!sourceSize) continue;
    const pageMarkups = input.markups.filter((item) => item.page === pageNumber);
    removeReplacedAnnotations(
      pdf,
      pageNumber,
      new Set([
        ...(input.removedSourceAnnotationRefs || []),
        ...pageMarkups.map((markup) => markup.sourceAnnotationRef).filter((value): value is string => Boolean(value)),
      ]),
      new Set(pageMarkups.map((markup) => markup.sourceAnnotationName).filter((value): value is string => Boolean(value))),
    );
    let tally = 0;
    for (const markup of pageMarkups.filter((item) => item.visible)) {
      if (markup.kind === "count") tally += 1;
      addAnnotation(pdf, pageNumber - 1, markup, sourceSize, input.scales[pageNumber], fonts, layerRefs, tally);
    }
  }

  return pdf.save({ useObjectStreams: false });
}
