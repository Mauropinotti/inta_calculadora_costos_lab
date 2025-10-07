import { env } from "./env";

type LogLevel = "error" | "warn" | "info" | "debug";

type LogMethod = (message: string, context?: Record<string, unknown>) => void;

const levelOrder: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const configuredLevel = (() => {
  const level = env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (!level) {
    return "info";
  }
  return level in levelOrder ? level : "info";
})();

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] <= levelOrder[configuredLevel];
}

function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === "string" && value.toLowerCase().includes("database_url")) {
      redacted[key] = "[REDACTED]";
      continue;
    }

    if (typeof value === "string" && value.includes("postgresql://")) {
      redacted[key] = "[REDACTED]";
      continue;
    }

    redacted[key] = value;
  }

  return redacted;
}

function baseLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const sanitized = sanitizeContext(context);
  const payload = sanitized ? `${message} ${JSON.stringify(sanitized)}` : message;

  switch (level) {
    case "error":
      console.error(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    case "info":
      console.info(payload);
      break;
    case "debug":
      console.debug(payload);
      break;
  }
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: env.NODE_ENV === "development" ? error.stack : undefined
    };
  }

  return { message: String(error) };
}

export const logger: Record<LogLevel, LogMethod> & { serializeError: typeof serializeError } = {
  error: (message, context) => baseLog("error", message, context),
  warn: (message, context) => baseLog("warn", message, context),
  info: (message, context) => baseLog("info", message, context),
  debug: (message, context) => baseLog("debug", message, context),
  serializeError
};
