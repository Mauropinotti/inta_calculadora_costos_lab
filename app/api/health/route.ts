import { NextResponse } from "next/server";

import { checkDbHealth } from "@/src/db/health";

export const runtime = "nodejs";

export async function GET() {
  const dbStatus = await checkDbHealth();
  const cacheHeaders = { "Cache-Control": "no-store" };

  if (!dbStatus.ok) {
    return NextResponse.json(
      {
        status: dbStatus.checks.connection ? "degraded" : "down",
        details: { db: dbStatus }
      },
      { status: 503, headers: cacheHeaders }
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      db: dbStatus
    },
    { status: 200, headers: cacheHeaders }
  );
}
