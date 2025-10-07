import { describe, expect, it } from "vitest";

import { HourlyRateSchema, QuoteCreateSchema, QuoteLineCreateSchema } from "@/src/lib/validation";

describe("QuoteCreateSchema", () => {
  it("parses valid payload", () => {
    const payload = {
      title: "Proyecto A",
      dm: 1.5,
      base_currency: "ARS"
    };

    expect(() => QuoteCreateSchema.parse(payload)).not.toThrow();
  });

  it("rejects invalid dm", () => {
    expect(() =>
      QuoteCreateSchema.parse({
        title: "Test",
        dm: 0,
        base_currency: "ARS"
      })
    ).toThrowError();
  });
});

describe("QuoteLineCreateSchema", () => {
  it("requires level within range", () => {
    expect(() =>
      QuoteLineCreateSchema.parse({
        quote_id: "6a9c4af4-b933-47aa-9fb9-9e254e2f774d",
        level: 5,
        category: "energia",
        name: "Luz",
        currency: "ARS",
        cost_period: 100,
        periodicity: "mensual",
        months: 1,
        determinations: 1,
        meta: {}
      })
    ).toThrowError();
  });
});

describe("HourlyRateSchema", () => {
  it("parses valid payload", () => {
    const payload = {
      profile_code: "dev",
      profile_name: "Desarrollador",
      hourly_rate_ars: 1000,
      valid_from: "2024-01-01"
    };

    expect(() => HourlyRateSchema.parse(payload)).not.toThrow();
  });

  it("rejects invalid date", () => {
    expect(() =>
      HourlyRateSchema.parse({
        profile_code: "dev",
        profile_name: "Desarrollador",
        hourly_rate_ars: 1000,
        valid_from: "2024-13-01"
      })
    ).toThrowError();
  });
});
