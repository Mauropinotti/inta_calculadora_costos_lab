import { sql } from "drizzle-orm";

import { db } from "./index";
import { logger } from "@/src/lib/logger";

type DbHealthChecks = {
  connection: boolean;
  tables: {
    quote: boolean;
    quote_line: boolean;
  };
};

export type DbHealth = {
  ok: boolean;
  checks: DbHealthChecks;
  timestamp: string;
};

export async function checkDbHealth(): Promise<DbHealth> {
  const checks: DbHealthChecks = {
    connection: false,
    tables: {
      quote: false,
      quote_line: false
    }
  };

  try {
    await db.execute(sql`select 1`);
    checks.connection = true;
  } catch (error) {
    logger.error("Database connectivity check failed", {
      error: logger.serializeError(error)
    });
  }

  try {
    const result = await db.execute(
      sql`select tablename from pg_catalog.pg_tables where schemaname = 'public' and tablename in ('quote', 'quote_line')`
    );
    const tables = Array.isArray(result)
      ? result
      : (result as unknown as { rows: Array<{ tablename: string }> }).rows ?? [];
    const names = new Set(tables.map((row: any) => row.tablename));
    checks.tables.quote = names.has("quote");
    checks.tables.quote_line = names.has("quote_line");
  } catch (error) {
    logger.error("Database table check failed", {
      error: logger.serializeError(error)
    });
  }

  return {
    ok: checks.connection && checks.tables.quote && checks.tables.quote_line,
    checks,
    timestamp: new Date().toISOString()
  };
}
