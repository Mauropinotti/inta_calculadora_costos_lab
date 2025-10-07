import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { createOrUpdateHourlyRate, listHourlyRates } from "@/src/services/hourlyRates";
import { ensureAppInitialized } from "@/src/lib/startup";
import { HourlyRateSchema } from "@/src/lib/validation";
import { AppError, ValidationError } from "@/src/lib/errors";
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
  const active = request.nextUrl.searchParams.get("active") === "true";

  try {
    const rates = await listHourlyRates(active);
    return NextResponse.json(rates, {
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

    logger.error("Unexpected error listing hourly rates", { error: logger.serializeError(error) });
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
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
    const parsed = HourlyRateSchema.parse(payload);
    const result = await createOrUpdateHourlyRate(parsed);
    return NextResponse.json(result, {
      status: 201,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AppError) {
      logger.warn("Hourly rate mutation failed", { error: logger.serializeError(error) });
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

    logger.error("Unexpected error creating hourly rate", { error: logger.serializeError(error) });
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
