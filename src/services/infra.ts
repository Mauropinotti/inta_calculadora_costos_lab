import { db, infraCategory } from "@/src/db";
import { DbError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";

export async function listInfraCategories() {
  try {
    return await db.select().from(infraCategory).orderBy(infraCategory.label);
  } catch (error) {
    logger.error("Failed to list infrastructure categories", { error: logger.serializeError(error) });
    throw new DbError("No se pudieron obtener las categorías de infraestructura");
  }
}
