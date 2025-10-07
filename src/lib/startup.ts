import { inArray } from "drizzle-orm";

import { db, infraCategory } from "@/src/db";
import { checkDbHealth } from "@/src/db/health";
import { env } from "./env";
import { logger } from "./logger";

const requiredInfra = [
  { key: "energia", label: "Energía" },
  { key: "gas", label: "Gas" },
  { key: "agua", label: "Agua" },
  { key: "limpieza", label: "Limpieza" },
  { key: "administracion", label: "Administración" },
  { key: "comunicaciones", label: "Comunicaciones" }
];

let initialized = false;
let initializing: Promise<void> | null = null;

async function ensureInfraCategoriesSeeded() {
  const rows = await db
    .select({ key: infraCategory.key })
    .from(infraCategory)
    .where(inArray(infraCategory.key, requiredInfra.map((item) => item.key)));

  const existingKeys = new Set(rows.map((row) => row.key));
  const missing = requiredInfra.filter((item) => !existingKeys.has(item.key));

  if (missing.length === 0) {
    return;
  }

  await db
    .insert(infraCategory)
    .values(missing)
    .onConflictDoNothing();

  logger.info("Seeded missing infrastructure categories", { missing: missing.map((item) => item.key) });
}

async function initialize() {
  if (env.NODE_ENV !== "development") {
    initialized = true;
    return;
  }

  try {
    const health = await checkDbHealth();
    if (!health.ok) {
      logger.error("Database health degraded", { checks: health.checks });
    } else {
      logger.info("Database health check completed", { timestamp: health.timestamp });
    }
  } catch (error) {
    logger.error("Database health check failed during startup", {
      error: logger.serializeError(error)
    });
  }

  try {
    await ensureInfraCategoriesSeeded();
  } catch (error) {
    logger.error("Failed to ensure infra categories", {
      error: logger.serializeError(error)
    });
  }

  initialized = true;
}

export async function ensureAppInitialized() {
  if (initialized) {
    return;
  }

  if (!initializing) {
    initializing = initialize().finally(() => {
      initializing = null;
    });
  }

  await initializing;
}
