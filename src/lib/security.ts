import { ValidationError } from "./errors";

const DENY_LIST = [/select\s+/i, /insert\s+/i, /update\s+/i, /delete\s+/i, /drop\s+/i];

export function sanitizeString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  for (const pattern of DENY_LIST) {
    if (pattern.test(trimmed)) {
      throw new ValidationError(`${fieldName} contains forbidden patterns`);
    }
  }

  return trimmed;
}

export function assertSafeNumber(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number } = {}
): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }

  if (options.min !== undefined && numeric < options.min) {
    throw new ValidationError(`${fieldName} must be greater than or equal to ${options.min}`);
  }

  if (options.max !== undefined && numeric > options.max) {
    throw new ValidationError(`${fieldName} must be less than or equal to ${options.max}`);
  }

  return numeric;
}

type RateLimiterEntry = {
  count: number;
  resetAt: number;
};

type RateLimiterConfig = {
  windowMs: number;
  max: number;
};

const defaultLimiter: RateLimiterConfig = {
  windowMs: 5 * 60 * 1000,
  max: 30
};

const limiterState = new Map<string, RateLimiterEntry>();

export function rateLimit(identifier: string, config: RateLimiterConfig = defaultLimiter): boolean {
  const now = Date.now();
  const entry = limiterState.get(identifier);

  if (!entry || entry.resetAt <= now) {
    limiterState.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.max) {
    return false;
  }

  entry.count += 1;
  limiterState.set(identifier, entry);
  return true;
}

export function getRateLimiterReset(identifier: string): number | null {
  const entry = limiterState.get(identifier);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  return entry.resetAt > now ? entry.resetAt : null;
}

export function assertTrustedOrigin(headers: Headers, expectedHost: string, extraAllowedOrigins: string[] = []) {
  const origin = headers.get("origin") ?? headers.get("referer");
  if (!origin) {
    return;
  }

  try {
    const parsed = new URL(origin);
    const allowedHosts = new Set([expectedHost, ...extraAllowedOrigins]);
    if (!allowedHosts.has(parsed.host)) {
      throw new ValidationError("Origen no autorizado");
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError("Origen inválido");
  }
}
