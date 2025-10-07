import { randomUUID } from "crypto";

import { and, eq } from "drizzle-orm";

import { db, hourlyRate, infraCategory } from "./index";
import { logger } from "@/src/lib/logger";

const infraCategories = [
  { key: "energia", label: "Energía" },
  { key: "gas", label: "Gas" },
  { key: "agua", label: "Agua" },
  { key: "limpieza", label: "Limpieza" },
  { key: "administracion", label: "Administración" },
  { key: "comunicaciones", label: "Comunicaciones" }
];

const hourlyRates = [
  {
    profileCode: "professional",
    profileName: "Profesional investigador",
    hourlyRateArs: 12000,
    validFrom: "2024-01-01",
    validTo: null
  },
  {
    profileCode: "technician",
    profileName: "Técnico",
    hourlyRateArs: 8000,
    validFrom: "2024-01-01",
    validTo: null
  }
];

async function seedInfraCategories() {
  for (const category of infraCategories) {
    await db
      .insert(infraCategory)
      .values(category)
      .onConflictDoNothing();
  }
}

async function seedHourlyRates() {
  for (const rate of hourlyRates) {
    const existing = await db
      .select()
      .from(hourlyRate)
      .where(and(eq(hourlyRate.profileCode, rate.profileCode), eq(hourlyRate.validFrom, rate.validFrom)))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    await db.insert(hourlyRate).values({
      id: randomUUID(),
      profileCode: rate.profileCode,
      profileName: rate.profileName,
      hourlyRateArs: rate.hourlyRateArs,
      validFrom: rate.validFrom,
      validTo: rate.validTo,
      source: "seed"
    });
  }
}

async function main() {
  try {
    await seedInfraCategories();
    logger.info("Infra categories seed completed");
    await seedHourlyRates();
    logger.info("Hourly rates seed completed");
  } catch (error) {
    logger.error("Seeding failed", { error: logger.serializeError(error) });
    process.exit(1);
  }
}

void main();
