import polygonClipping, { type MultiPolygon, type Pair, type Polygon, type Ring } from "polygon-clipping";
import type { Markup, PageScale, Point, Unit } from "./pdf-annotation-engine";

const UNIT_IN_METERS: Record<Unit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  in: 0.0254,
  ft: 0.3048,
};

const MEASUREMENT_KINDS = new Set([
  "length", "polyline", "perimeter", "area", "volume", "diameter", "radius", "slope", "angle", "count",
]);

export type QuantityResult = {
  id: string;
  kind: Markup["kind"];
  value: number | null;
  unit: string;
  display: string;
  valid: boolean;
  warnings: string[];
  pixelArea?: number;
};

export type QuantitySummaryRow = {
  layer: string;
  kind: Markup["kind"];
  unit: string;
  items: number;
  total: number;
};

function convertUnit(value: number, from: Unit, to: Unit, power = 1) {
  return value * (UNIT_IN_METERS[from] / UNIT_IN_METERS[to]) ** power;
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pathLength(points: Point[], closed = false) {
  if (points.length < 2) return 0;
  const path = closed ? [...points, points[0]] : points;
  return path.slice(1).reduce((total, point, index) => total + distance(path[index], point), 0);
}

function angleDegrees(points: Point[]) {
  if (points.length < 3) return 0;
  const [a, vertex, c] = points;
  const first = Math.atan2(a.y - vertex.y, a.x - vertex.x);
  const second = Math.atan2(c.y - vertex.y, c.x - vertex.x);
  let value = Math.abs((second - first) * 180 / Math.PI);
  if (value > 180) value = 360 - value;
  return value;
}

function ring(points: Point[]): Ring {
  const pairs = points.map((point) => [point.x, point.y] as Pair);
  if (pairs.length && (pairs[0][0] !== pairs[pairs.length - 1][0] || pairs[0][1] !== pairs[pairs.length - 1][1])) {
    pairs.push([...pairs[0]] as Pair);
  }
  return pairs;
}

function ringArea(points: Ring) {
  if (points.length < 4) return 0;
  return Math.abs(points.slice(1).reduce((total, point, index) => {
    const previous = points[index];
    return total + previous[0] * point[1] - point[0] * previous[1];
  }, 0) / 2);
}

function multiPolygonArea(multiPolygon: MultiPolygon) {
  return multiPolygon.reduce((total, polygon) => {
    const outer = polygon[0] ? ringArea(polygon[0]) : 0;
    const holes = polygon.slice(1).reduce((sum, hole) => sum + ringArea(hole), 0);
    return total + Math.max(0, outer - holes);
  }, 0);
}

export function clippedArea(points: Point[], holes: Point[][] = []) {
  if (points.length < 3) return { area: 0, geometry: [] as MultiPolygon };
  const subject: Polygon = [ring(points)];
  const clips = holes.filter((hole) => hole.length >= 3).map((hole) => [ring(hole)] as Polygon);
  const geometry = clips.length ? polygonClipping.difference(subject, ...clips) : [subject];
  return { area: multiPolygonArea(geometry), geometry };
}

function precision(markup: Markup) {
  return Math.max(0, Math.min(4, markup.precision ?? 2));
}

function result(markup: Markup, value: number | null, unit: string, warnings: string[] = [], pixelArea?: number): QuantityResult {
  const valid = value !== null && Number.isFinite(value) && warnings.length === 0;
  const display = value === null
    ? "Set scale"
    : unit === "ratio"
      ? `1:${value.toFixed(Math.max(1, precision(markup)))}`
      : `${value.toFixed(markup.kind === "angle" ? Math.max(1, precision(markup)) : precision(markup))} ${unit}`;
  return { id: markup.id, kind: markup.kind, value, unit, display, valid, warnings, pixelArea };
}

export function calculateQuantity(markup: Markup, scale?: PageScale): QuantityResult {
  const warnings: string[] = [];
  if (!MEASUREMENT_KINDS.has(markup.kind)) return result(markup, null, "unsupported", ["This object is not a measurement."]);
  if (!markup.points.length || markup.points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    return result(markup, null, "invalid", ["Measurement geometry is invalid."]);
  }
  if (markup.kind === "count") return result(markup, 1, "items");
  if (markup.kind === "angle") {
    if (markup.points.length < 3) return result(markup, null, "°", ["Angle requires three points."]);
    const degrees = angleDegrees(markup.points);
    return markup.angleUnit === "radians" ? result(markup, degrees * Math.PI / 180, "rad") : result(markup, degrees, "°");
  }
  if (markup.kind === "slope") {
    if (markup.points.length < 2) return result(markup, null, "%", ["Slope requires two points."]);
    const run = Math.abs(markup.points[1].x - markup.points[0].x);
    const rise = Math.abs(markup.points[1].y - markup.points[0].y);
    if (!run) return result(markup, null, "vertical", ["Slope has no horizontal run."]);
    const slope = rise / run;
    if (markup.slopeUnit === "ratio") return result(markup, slope > 0 ? 1 / slope : 0, "ratio");
    if (markup.slopeUnit === "degrees") return result(markup, Math.atan(slope) * 180 / Math.PI, "°");
    return result(markup, slope * 100, "%");
  }
  if (!scale || !Number.isFinite(scale.pixelsPerUnit) || scale.pixelsPerUnit <= 0) {
    return result(markup, null, "unscaled", ["A valid page scale is required."]);
  }

  const outputUnit = markup.displayUnit || scale.unit;
  if (["length", "diameter", "radius"].includes(markup.kind)) {
    if (markup.points.length < 2) return result(markup, null, outputUnit, ["This measurement requires two points."]);
    return result(markup, convertUnit(distance(markup.points[0], markup.points[1]) / scale.pixelsPerUnit, scale.unit, outputUnit), outputUnit);
  }
  if (["polyline", "perimeter"].includes(markup.kind)) {
    if (markup.points.length < 2) return result(markup, null, outputUnit, ["This path requires at least two points."]);
    const value = pathLength(markup.points, markup.kind === "perimeter") / scale.pixelsPerUnit;
    return result(markup, convertUnit(value, scale.unit, outputUnit), outputUnit);
  }
  if (["area", "volume"].includes(markup.kind)) {
    if (markup.points.length < 3) return result(markup, null, `${outputUnit}²`, ["Area geometry requires at least three points."]);
    const clipped = clippedArea(markup.points, markup.holes);
    const area = clipped.area / scale.pixelsPerUnit ** 2;
    if (markup.kind === "area") return result(markup, convertUnit(area, scale.unit, outputUnit, 2), `${outputUnit}²`, warnings, clipped.area);
    if (!Number.isFinite(markup.depth) || (markup.depth || 0) <= 0) warnings.push("Enter a height/depth greater than zero.");
    const depth = convertUnit(Math.max(0, markup.depth || 0), markup.depthUnit || scale.unit, scale.unit);
    return result(markup, convertUnit(area * depth, scale.unit, outputUnit, 3), `${outputUnit}³`, warnings, clipped.area);
  }
  return result(markup, null, "unsupported", ["Measurement type is not supported."]);
}

export function calculateQuantityBatch(markups: Markup[], scales: Record<number, PageScale>) {
  const results = markups.filter((markup) => MEASUREMENT_KINDS.has(markup.kind)).map((markup) => calculateQuantity(markup, scales[markup.page]));
  const grouped = new Map<string, QuantitySummaryRow>();
  results.forEach((item) => {
    const markup = markups.find((candidate) => candidate.id === item.id);
    if (!markup || item.value === null || !Number.isFinite(item.value)) return;
    const layer = markup.layer || "Structural";
    const key = `${layer}|${item.kind}|${item.unit}`;
    const current = grouped.get(key) || { layer, kind: item.kind, unit: item.unit, items: 0, total: 0 };
    current.items += 1;
    current.total += item.value;
    grouped.set(key, current);
  });
  return { results, summary: [...grouped.values()] };
}

export function runPolygonOperation(mode: "union" | "intersection" | "difference" | "xor", polygons: Point[][]) {
  const geometry = polygons.filter((polygon) => polygon.length >= 3).map((polygon) => [ring(polygon)] as Polygon);
  if (!geometry.length) return { geometry: [] as MultiPolygon, pixelArea: 0 };
  const [first, ...rest] = geometry;
  const output = rest.length ? polygonClipping[mode](first, ...rest) : [first];
  return { geometry: output, pixelArea: multiPolygonArea(output) };
}
