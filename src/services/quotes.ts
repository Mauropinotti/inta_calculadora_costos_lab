import { count, desc, eq, ilike } from "drizzle-orm";

import { db, quote, quoteLine } from "@/src/db";
import { DbError, NotFoundError } from "@/src/lib/errors";
import { logger } from "@/src/lib/logger";
import type { QuoteCreateInput, QuoteUpdateInput } from "@/src/lib/validation";

export async function createQuote(input: QuoteCreateInput) {
  try {
    const [created] = await db
      .insert(quote)
      .values({
        title: input.title,
        dm: input.dm,
        baseCurrency: input.base_currency,
        exchangeRate: input.exchange_rate,
        exchangeSource: input.exchange_source,
        exchangeDate: input.exchange_date ?? null,
        depreciationMethod: input.depreciation_method,
        notes: input.notes,
        status: "draft"
      })
      .returning();

    logger.info("Quote created", { id: created.id });
    return created;
  } catch (error) {
    logger.error("Failed to create quote", { error: logger.serializeError(error) });
    throw new DbError("No se pudo crear la cotización");
  }
}

type ListQuotesOptions = {
  page: number;
  limit: number;
  search?: string;
};

export async function listQuotes(options: ListQuotesOptions) {
  const page = Math.max(options.page, 1);
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const offset = (page - 1) * limit;

  try {
    const filter = options.search
      ? ilike(quote.title, `%${options.search.trim()}%`)
      : undefined;

    let listQuery = db.select().from(quote).orderBy(desc(quote.createdAt)).limit(limit).offset(offset);
    let countQuery = db.select({ value: count() }).from(quote);

    if (filter) {
      listQuery = listQuery.where(filter);
      countQuery = countQuery.where(filter);
    }

    const [items, totalResult] = await Promise.all([listQuery, countQuery]);

    const total = totalResult[0]?.value ?? 0;
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: total === 0 ? 0 : Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error("Failed to list quotes", { error: logger.serializeError(error) });
    throw new DbError("No se pudo obtener el listado de cotizaciones");
  }
}

export async function getQuoteByIdWithLines(id: string) {
  try {
    const [existing] = await db.select().from(quote).where(eq(quote.id, id)).limit(1);
    if (!existing) {
      throw new NotFoundError("La cotización no existe");
    }

    const lines = await db
      .select()
      .from(quoteLine)
      .where(eq(quoteLine.quoteId, id))
      .orderBy(quoteLine.level, quoteLine.sublevel);

    const aggregations = lines.reduce(
      (acc, line) => {
        const levelKey = `level_${line.level}`;
        const amount = Number(line.costPeriod ?? 0) * Number(line.determinations ?? 0);
        acc.levels[levelKey] = (acc.levels[levelKey] ?? 0) + amount;
        acc.total += amount;
        return acc;
      },
      { levels: {} as Record<string, number>, total: 0 }
    );

    return { quote: existing, lines, totals: aggregations };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error("Failed to fetch quote", { error: logger.serializeError(error) });
    throw new DbError("No se pudo obtener la cotización solicitada");
  }
}

export async function updateQuote(id: string, input: QuoteUpdateInput) {
  try {
    const updates: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (input.title !== undefined) updates.title = input.title;
    if (input.dm !== undefined) updates.dm = input.dm;
    if (input.base_currency !== undefined) updates.baseCurrency = input.base_currency;
    if (input.exchange_rate !== undefined) updates.exchangeRate = input.exchange_rate;
    if (input.exchange_source !== undefined) updates.exchangeSource = input.exchange_source;
    if (input.exchange_date !== undefined) updates.exchangeDate = input.exchange_date ?? null;
    if (input.depreciation_method !== undefined) updates.depreciationMethod = input.depreciation_method;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.status !== undefined) updates.status = input.status;

    const [updated] = await db
      .update(quote)
      .set(updates)
      .where(eq(quote.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundError("La cotización no existe");
    }

    logger.info("Quote updated", { id: updated.id });
    return updated;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error("Failed to update quote", { error: logger.serializeError(error) });
    throw new DbError("No se pudo actualizar la cotización");
  }
}

export async function deleteQuote(id: string) {
  try {
    await db.delete(quoteLine).where(eq(quoteLine.quoteId, id));
    const result = await db.delete(quote).where(eq(quote.id, id)).returning({ id: quote.id });
    const removed = result[0];
    if (!removed) {
      throw new NotFoundError("La cotización no existe");
    }

    logger.info("Quote deleted", { id: removed.id });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error("Failed to delete quote", { error: logger.serializeError(error) });
    throw new DbError("No se pudo eliminar la cotización");
  }
}
