import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchUsdArsFromMonedapi } from "@/lib/monedapi";

const jsonHeaders = { "content-type": "application/json" } as const;

function createMonedapiResponse({
  sellPrice,
  updatedAt,
  extra = {}
}: {
  sellPrice: number | string;
  updatedAt: string;
  extra?: Record<string, unknown>;
}) {
  return new Response(
    JSON.stringify({
      moneda: "USD",
      origen: "BNA",
      compra: typeof sellPrice === "number" ? sellPrice - 20 : 0,
      venta: sellPrice,
      actualizado: updatedAt,
      ...extra
    }),
    { status: 200, headers: jsonHeaders }
  );
}

describe("fetchUsdArsFromMonedapi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("obtiene la cotización USD desde Monedapi", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMonedapiResponse({ sellPrice: 965.5, updatedAt: "2024-06-05T10:00:00Z" })
    );

    const result = await fetchUsdArsFromMonedapi();
    expect(result).toEqual({ rate: 965.5, dateISO: "2024-06-05", source: "monedapi" });
  });

});
