import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.calculatorId) {
    return NextResponse.json(
      { error: "calculatorId is required" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    status: "accepted",
    reportId: `rpt_${Date.now().toString(36)}`,
    message:
      "Report payload accepted. Client-side StructuraReport.print remains the primary PDF path for Stage 1.",
    receivedAt: new Date().toISOString(),
    calculatorId: body.calculatorId,
    calculatorVersion: body.calculatorVersion || null,
  });
}
