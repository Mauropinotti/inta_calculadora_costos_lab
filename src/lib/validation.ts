import { z } from "zod";

const currencyEnum = z.enum(["ARS", "USD"]);
const periodicityEnum = z.enum([
  "mensual",
  "bimestral",
  "trimestral",
  "semestral",
  "anual",
  "puntual"
]);

const isoDateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}, "Fecha inválida");

const isoDateTimeSchema = z.string().refine((value) => {
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}, "Fecha y hora inválidas");

export const QuoteCreateSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  dm: z.coerce.number().positive("El DM debe ser mayor que cero"),
  base_currency: currencyEnum,
  exchange_rate: z.coerce.number().positive().optional(),
  exchange_source: z.string().min(1).optional(),
  exchange_date: isoDateTimeSchema.optional(),
  depreciation_method: z.string().min(1).optional(),
  notes: z.string().optional()
});

export const QuoteUpdateSchema = QuoteCreateSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional()
});

export const QuoteLineCreateSchema = z.object({
  quote_id: z.string().uuid(),
  level: z.coerce.number().int().min(1).max(4),
  sublevel: z.string().max(100).optional(),
  category: z.string().min(1),
  name: z.string().min(1),
  currency: currencyEnum,
  cost_period: z.coerce.number().nonnegative(),
  periodicity: periodicityEnum,
  months: z.coerce
    .number()
    .int()
    .refine((value) => [1, 2, 3, 6, 12].includes(value), {
      message: "Los meses deben ser 1, 2, 3, 6 o 12"
    }),
  determinations: z.coerce.number().nonnegative(),
  meta: z.record(z.any()).default({})
});

export const HourlyRateSchema = z.object({
  profile_code: z.string().min(1),
  profile_name: z.string().min(1),
  hourly_rate_ars: z.coerce.number().nonnegative(),
  valid_from: isoDateSchema,
  valid_to: isoDateSchema.optional().nullable()
});

export type QuoteCreateInput = z.infer<typeof QuoteCreateSchema>;
export type QuoteUpdateInput = z.infer<typeof QuoteUpdateSchema>;
export type QuoteLineCreateInput = z.infer<typeof QuoteLineCreateSchema>;
export type HourlyRateInput = z.infer<typeof HourlyRateSchema>;
