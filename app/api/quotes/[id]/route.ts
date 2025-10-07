import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { deleteQuote, getQuoteByIdWithLines, updateQuote } from "@/src/services/quotes";
import { ensureAppInitialized } from "@/src/lib/startup";
import { QuoteUpdateSchema } from "@/src/lib/validation";
import { AppError, ValidationError, NotFoundError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";
import { assertTrustedOrigin, getRateLimiterReset, rateLimit } from "@/src/lib/security";

export const runtime = "nodejs";

type RouteParams = {
  params: { id: string };
};

function getClientIdentifier(request: NextRequest): string {
  return (
    request.ip ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  await ensureAppInitialized();

  try {
    const result = await getQuoteByIdWithLines(params.id);
    return NextResponse.json(result, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    logger.error("Unexpected error fetching quote", { error: logger.serializeError(error) });
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const parsed = QuoteUpdateSchema.parse(payload);
    const result = await updateQuote(params.id, parsed);
    return NextResponse.json(result, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    if (error instanceof ValidationError || error instanceof AppError) {
      logger.warn("Quote update failed", { error: logger.serializeError(error) });
      return NextResponse.json(
        { message: error.message },
        { status: error.status, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    if (error instanceof ZodError) {
      logger.warn("Validation failed", { error: error.issues });
      return NextResponse.json(
        { message: "Payload inválido", issues: error.issues },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    logger.error("Unexpected error updating quote", { error: logger.serializeError(error) });
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    await deleteQuote(params.id);
    return new NextResponse(null, {
      status: 204
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    logger.error("Unexpected error deleting quote", { error: logger.serializeError(error) });
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
