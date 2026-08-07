import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  return NextResponse.json({
    projectId,
    projectName: null,
    client: null,
    location: null,
    source: "stub",
    note: "Project persistence is not wired yet; client localStorage remains authoritative.",
  });
}
