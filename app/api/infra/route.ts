import { NextRequest, NextResponse } from "next/server";

import { listInfraCategories } from "@/src/services/infra";
import { ensureAppInitialized } from "@/src/lib/startup";
import { AppError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  await ensureAppInitialized();

  try {
    const categories = await listInfraCategories();
    return NextResponse.json(categories, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    logger.error("Unexpected error listing infra categories", { error: logger.serializeError(error) });
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
