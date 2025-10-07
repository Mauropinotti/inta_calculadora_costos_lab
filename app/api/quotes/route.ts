import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { createQuote, listQuotes } from "@/src/services/quotes";
import { ensureAppInitialized } from "@/src/lib/startup";
import { QuoteCreateSchema } from "@/src/lib/validation";
import { ValidationError, AppError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";
import { assertTrustedOrigin, getRateLimiterReset, rateLimit } from "@/src/lib/security";

export const runtime = "nodejs";

function getClientIdentifier(request: NextRequest): string {
  return (
    request.ip ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function GET(request: NextRequest) {
  await ensureAppInitialized();

  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const rawSearch = searchParams.get("search");
  const normalizedSearch = rawSearch?.trim();

  try {
    const result = await listQuotes({
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
      search: normalizedSearch ? normalizedSearch : undefined
    });
    return NextResponse.json(result, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        {
          status: error.status,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    logger.error("Unexpected error listing quotes", {
      error: logger.serializeError(error)
    });
    return NextResponse.json(
      { message: "Error interno" },
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  await ensureAppInitialized();

  const identifier = getClientIdentifier(request);
  if (!rateLimit(identifier)) {
    const resetAt = getRateLimiterReset(identifier);
    return NextResponse.json(
      { message: "Demasiadas solicitudes" },
      {
        status: 429,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": resetAt ? Math.ceil((resetAt - Date.now()) / 1000).toString() : "60"
        }
      }
    );
  }

  try {
    assertTrustedOrigin(request.headers, request.nextUrl.host);
    const payload = await request.json();
    const parsed = QuoteCreateSchema.parse(payload);
    const quote = await createQuote(parsed);
    return NextResponse.json(quote, {
      status: 201,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AppError) {
      logger.warn("Quote creation failed", {
        error: logger.serializeError(error)
      });
      return NextResponse.json(
        { message: error.message, details: error instanceof ValidationError ? error.details : undefined },
        {
          status: error.status,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    if (error instanceof ZodError) {
      logger.warn("Validation failed", { error: error.issues });
      return NextResponse.json(
        { message: "Payload inválido", issues: error.issues },
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        }
      );
    }

    logger.error("Unexpected error creating quote", {
      error: logger.serializeError(error)
    });
    return NextResponse.json(
      { message: "Error interno" },
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }
}
