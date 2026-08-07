import { NextResponse } from "next/server";
import {
  computeCalculation,
  getEngine,
  listEngineIds,
} from "@/lib/material-calculators/registry";
import type { NumericInputs } from "@/lib/material-calculators/types";

type ComputeBody = {
  calculatorId?: string;
  calculatorVersion?: string;
  projectId?: string | null;
  country?: string;
  language?: string;
  inputs?: NumericInputs;
  timestamp?: string;
};

/**
 * POST /api/calculations/compute
 * Runs a server-only calculation engine. Formulas are not shipped to the client.
 */
export async function POST(request: Request) {
  let body: ComputeBody;
  try {
    body = (await request.json()) as ComputeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const calculatorId = body.calculatorId;
  if (!calculatorId) {
    return NextResponse.json(
      { error: "calculatorId is required" },
      { status: 400 },
    );
  }

  const engine = getEngine(calculatorId);
  if (!engine) {
    return NextResponse.json(
      {
        error: `Calculator engine not available on server: ${calculatorId}`,
        available: listEngineIds(),
      },
      { status: 404 },
    );
  }

  if (!body.inputs || typeof body.inputs !== "object") {
    return NextResponse.json(
      { error: "inputs object is required" },
      { status: 400 },
    );
  }

  try {
    const result = computeCalculation(calculatorId, body.inputs);
    const bad =
      result.metrics.some((m) => !Number.isFinite(m.value)) ||
      result.materials.some(
        (m) => !Number.isFinite(m.exact) || !Number.isFinite(m.order),
      );
    if (bad) {
      return NextResponse.json(
        { error: "A calculation returned a non-finite result." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      calculatorId: engine.id,
      calculatorVersion: engine.version,
      title: engine.title,
      category: engine.category,
      projectId: body.projectId ?? null,
      country: body.country ?? null,
      language: body.language ?? null,
      inputs: body.inputs,
      results: {
        metrics: result.metrics,
        materials: result.materials,
        notes: result.notes,
      },
      steps: result.steps,
      assumptions: result.assumptions,
      timestamp: body.timestamp || new Date().toISOString(),
      computedAt: new Date().toISOString(),
      source: "server-engine",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/calculations/compute",
    method: "POST",
    availableEngines: listEngineIds(),
    note: "Calculation formulas execute only on the server.",
  });
}
