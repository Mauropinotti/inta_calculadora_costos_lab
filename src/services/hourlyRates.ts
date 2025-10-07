import { randomUUID } from "crypto";

import { and, gte, isNull, lte, or } from "drizzle-orm";

import { db, hourlyRate } from "@/src/db";
import { DbError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";
import type { HourlyRateInput } from "@/src/lib/validation";

export async function listHourlyRates(active?: boolean) {
  try {
    if (!active) {
      return db.select().from(hourlyRate);
    }

    const today = new Date().toISOString().slice(0, 10);
    return db
      .select()
      .from(hourlyRate)
      .where(
        and(
          lte(hourlyRate.validFrom, today),
          or(isNull(hourlyRate.validTo), gte(hourlyRate.validTo, today))
        )
      );
  } catch (error) {
    logger.error("Failed to list hourly rates", { error: logger.serializeError(error) });
    throw new DbError("No se pudieron obtener los valores hora");
  }
}

export async function createOrUpdateHourlyRate(input: HourlyRateInput) {
  try {
    const [upserted] = await db
      .insert(hourlyRate)
      .values({
        id: randomUUID(),
        profileCode: input.profile_code,
        profileName: input.profile_name,
        hourlyRateArs: input.hourly_rate_ars,
        validFrom: input.valid_from,
        validTo: input.valid_to ?? null,
        source: "api"
      })
      .onConflictDoUpdate({
        target: [hourlyRate.profileCode, hourlyRate.validFrom],
        set: {
          profileName: input.profile_name,
          hourlyRateArs: input.hourly_rate_ars,
          validTo: input.valid_to ?? null,
          source: "api"
        }
      })
      .returning();

    logger.info("Hourly rate upserted", { id: upserted.id, profileCode: upserted.profileCode });
    return upserted;
  } catch (error) {
    logger.error("Failed to upsert hourly rate", { error: logger.serializeError(error) });
    throw new DbError("No se pudo guardar el valor hora");
  }
}
