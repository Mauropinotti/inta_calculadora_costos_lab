import { z } from "zod";

const EnvSchema = z
  .object({
    DATABASE_URL: z
      .string({ required_error: "DATABASE_URL is required" })
      .min(1, "DATABASE_URL must not be empty")
      .refine((value) => /sslmode=require/.test(value), {
        message: "DATABASE_URL must include sslmode=require"
      }),
    NODE_ENV: z
      .enum(["development", "test", "production"]).optional()
      .default("development"),
    LOG_LEVEL: z.string().optional().default("info")
  })
  .transform((value) => ({
    ...value,
    DATABASE_URL: value.DATABASE_URL.trim()
  }));

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.flatten();
  const message = `Invalid environment variables: ${JSON.stringify(
    formattedErrors.fieldErrors
  )}`;
  throw new Error(message);
}

export const env = parsedEnv.data;

export function getRedactedDatabaseUrl(): string {
  const url = env.DATABASE_URL;
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    if (parsed.username) {
      parsed.username = "***";
    }
    return parsed.toString();
  } catch {
    return "postgresql://***";
  }
}
