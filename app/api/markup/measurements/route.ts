import { calculateQuantityBatch, runPolygonOperation } from "@/lib/markup/quantity-engine";
import type { Markup, PageScale, Point } from "@/lib/markup/pdf-annotation-engine";

type CalculatePayload = {
  operation?: "calculate";
  markups?: Markup[];
  scales?: Record<number, PageScale>;
};

type BooleanPayload = {
  operation: "boolean";
  mode?: "union" | "intersection" | "difference" | "xor";
  polygons?: Point[][];
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return jsonError("Send measurement data as JSON.", 415);
    }
    const payload = await request.json() as CalculatePayload | BooleanPayload;
    if (payload.operation === "boolean") {
      const mode = payload.mode;
      const polygons = payload.polygons;
      if (!mode || !["union", "intersection", "difference", "xor"].includes(mode)) return jsonError("Choose a valid polygon operation.", 400);
      if (!Array.isArray(polygons) || polygons.length < 1 || polygons.length > 50) return jsonError("Provide between 1 and 50 polygons.", 400);
      if (polygons.some((polygon) => !Array.isArray(polygon) || polygon.length < 3 || polygon.length > 5_000)) return jsonError("Polygon geometry is invalid or too large.", 400);
      return Response.json({ operation: mode, ...runPolygonOperation(mode, polygons) });
    }

    const markups = payload.markups;
    const scales = payload.scales || {};
    if (!Array.isArray(markups) || markups.length < 1 || markups.length > 500) return jsonError("Provide between 1 and 500 measurements.", 400);
    if (markups.some((markup) => !markup || typeof markup.id !== "string" || markup.id.length > 120 || !Array.isArray(markup.points) || markup.points.length > 10_000)) {
      return jsonError("Measurement geometry is invalid or too large.", 400);
    }
    return Response.json({ engine: "deterministic-geometry-v1", ...calculateQuantityBatch(markups, scales) });
  } catch {
    return jsonError("The measurement request could not be processed.", 400);
  }
}
