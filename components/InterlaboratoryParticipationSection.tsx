"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { useExchangeRate } from "@/contexts/ExchangeRateContext";
import {
  SharedResourceCostItem,
  SharedResourceSublevelState,
  calculateIndirectSublevelSubtotal,
  currencyFormatter
} from "@/lib/cost-calculation";

import { PlusIcon } from "./icons";

type SublevelAppearance = {
  container: string;
  header: string;
  description: string;
  tableHead: string;
  form: string;
  badge: string;
};

interface InterlaboratoryParticipationSectionProps {
  sublevel: SharedResourceSublevelState;
  onChange: (updated: SharedResourceSublevelState) => void;
  appearance: SublevelAppearance;
  globalDeterminations: number;
}

const tipoCanonOptions = [
  { value: "anual", label: "Anual" },
  { value: "totalPeriodo", label: "Total del período" }
] as const;

const monedaOptions = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" }
] as const;

const interlabItemSchema = z.object({
  formId: z.string().optional(),
  contraparte: z
    .string({ required_error: "Ingresá la contraparte interlaboratorio" })
    .min(1, "Ingresá la contraparte interlaboratorio"),
  tipoCanon: z.enum(["anual", "totalPeriodo"], {
    required_error: "Seleccioná el tipo de canon"
  }),
  canon: z.preprocess(
    (value) => {
      if (typeof value === "number") {
        return Number.isNaN(value) ? undefined : value;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
          return undefined;
        }

        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? undefined : parsed;
      }

      return undefined;
    },
    z
      .number({
        required_error: "Ingresá el monto del canon",
        invalid_type_error: "Ingresá el monto del canon"
      })
      .gt(0, "El canon debe ser mayor a cero")
  ),
  moneda: z.enum(["ARS", "USD"], {
    required_error: "Seleccioná la moneda"
  }),
  anios: z.preprocess(
    (value) => {
      if (typeof value === "number") {
        return Number.isNaN(value) ? undefined : value;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
          return undefined;
        }

        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? undefined : parsed;
      }

      return undefined;
    },
    z
      .number({
        required_error: "Ingresá el período en años",
        invalid_type_error: "Ingresá el período en años"
      })
      .gt(0, "El período debe ser mayor a cero")
  ),
  detMensuales: z.preprocess(
    (value) => {
      if (typeof value === "number") {
        return Number.isNaN(value) ? undefined : value;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
          return undefined;
        }

        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? undefined : parsed;
      }

      return undefined;
    },
    z
      .number({
        required_error: "Ingresá las determinaciones mensuales",
        invalid_type_error: "Ingresá las determinaciones mensuales"
      })
      .gt(0, "Las determinaciones deben ser mayores a cero")
  )
});

const interlabFormSchema = z.object({
  participations: z.array(interlabItemSchema)
});

type InterlabFormValues = {
  participations: Array<{
    formId?: string;
    contraparte?: string;
    tipoCanon?: "anual" | "totalPeriodo";
    canon?: string | number;
    moneda?: "ARS" | "USD";
    anios?: string | number;
    detMensuales?: string | number;
  }>;
};

type InterlabDraftValues = {
  contraparte?: string;
  tipoCanon?: "anual" | "totalPeriodo";
  canon?: string | number;
  moneda?: "ARS" | "USD";
  anios?: string | number;
  detMensuales?: string | number;
};

type InterlabComputation = {
  index: number;
  formId?: string;
  contraparte: string;
  tipoCanon?: "anual" | "totalPeriodo";
  canon?: number;
  moneda?: "ARS" | "USD";
  anios?: number;
  detMensuales?: number;
  canonArs?: number;
  canonAnualArs?: number;
  costoMensualArs?: number;
  costoUnitarioArs?: number | null;
  isValid: boolean;
};

type ValidInterlabComputation = InterlabComputation & {
  tipoCanon: "anual" | "totalPeriodo";
  canon: number;
  moneda: "ARS" | "USD";
  anios: number;
  detMensuales: number;
  canonArs: number;
  canonAnualArs: number;
  costoMensualArs: number;
  costoUnitarioArs: number | null;
  isValid: true;
};

const numberFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function createItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function roundForComparison(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 1e6) / 1e6;
}

type NormalizedInterlabItem = {
  id: string;
  concept: string;
  monthlyCost: number;
  determinations: number;
  interlaboratoryDetails: {
    contraparte: string;
    tipoCanon: "anual" | "totalPeriodo";
    canon: number;
    moneda: "ARS" | "USD";
    anios: number;
    detMensuales: number;
  } | null;
};

function normalizeInterlabItem(
  item: SharedResourceCostItem
): NormalizedInterlabItem {
  const details = item.interlaboratoryDetails;

  return {
    id: item.id,
    concept: item.concept ?? "",
    monthlyCost: roundForComparison(item.monthlyCost ?? 0),
    determinations: roundForComparison(item.determinations ?? 0),
    interlaboratoryDetails: details
      ? {
          contraparte: details.contraparte ?? "",
          tipoCanon: details.tipoCanon,
          canon: roundForComparison(details.canon ?? 0),
          moneda: details.moneda,
          anios: roundForComparison(details.anios ?? 0),
          detMensuales: roundForComparison(details.detMensuales ?? 0)
        }
      : null
  };
}

function isValidInterlab(
  item: InterlabComputation
): item is ValidInterlabComputation {
  return item.isValid;
}

export function InterlaboratoryParticipationSection({
  sublevel,
  onChange,
  appearance,
  globalDeterminations: _globalDeterminations
}: InterlaboratoryParticipationSectionProps) {
  const subtotal = useMemo(
    () => calculateIndirectSublevelSubtotal(sublevel),
    [sublevel]
  );
  const {
    state: { rate: exchangeRate }
  } = useExchangeRate();

  const defaultValues = useMemo<InterlabFormValues>(
    () => ({
      participations: sublevel.items.map((item) => {
        const details = item.interlaboratoryDetails;
        const resolvedTipoCanon = details?.tipoCanon ?? "anual";
        const resolvedAnios =
          typeof details?.anios === "number" && Number.isFinite(details.anios)
            ? details.anios.toString()
            : resolvedTipoCanon === "totalPeriodo"
              ? ""
              : "1";

        return {
          formId: item.id,
          contraparte: details?.contraparte ?? item.concept ?? "",
          tipoCanon: resolvedTipoCanon,
          canon:
            typeof details?.canon === "number" && Number.isFinite(details.canon)
              ? details.canon.toString()
              : "",
          moneda: details?.moneda ?? "ARS",
          anios: resolvedAnios,
          detMensuales:
            typeof details?.detMensuales === "number" &&
            Number.isFinite(details.detMensuales)
              ? details.detMensuales.toString()
              : item.determinations
                ? item.determinations.toString()
                : ""
        };
      })
    }),
    [sublevel]
  );

  const { control, register, watch, reset } = useForm<InterlabFormValues>({
    resolver: zodResolver(interlabFormSchema),
    mode: "onChange",
    defaultValues
  });

  const { fields, remove } = useFieldArray({
    control,
    name: "participations"
  });

  const {
    register: registerDraft,
    handleSubmit: handleSubmitDraft,
    watch: watchDraft,
    reset: resetDraft,
    formState: { errors: draftErrors }
  } = useForm<InterlabDraftValues>({
    resolver: zodResolver(interlabItemSchema),
    mode: "onChange",
    defaultValues: {
      contraparte: "",
      tipoCanon: "anual",
      canon: "",
      moneda: "ARS",
      anios: "1",
      detMensuales: ""
    }
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedParticipations = watch("participations");
  const draftValues = watchDraft();
  const skipNextSyncRef = useRef(false);
  const serializedCurrentItems = useMemo(
    () => JSON.stringify(sublevel.items.map(normalizeInterlabItem)),
    [sublevel.items]
  );

  const computations = useMemo<InterlabComputation[]>(() => {
    return watchedParticipations.map((item, index) => {
      const contraparte =
        typeof item?.contraparte === "string" ? item.contraparte.trim() : "";
      const tipoCanon =
        item?.tipoCanon === "anual" || item?.tipoCanon === "totalPeriodo"
          ? item.tipoCanon
          : undefined;
      const canon = parseNumber(item?.canon);
      const moneda =
        item?.moneda === "ARS" || item?.moneda === "USD" ? item.moneda : undefined;
      const aniosRaw = parseNumber(item?.anios);
      const anios =
        tipoCanon === "anual"
          ? 1
          : aniosRaw != null && aniosRaw > 0
            ? aniosRaw
            : undefined;
      const detMensuales = parseNumber(item?.detMensuales);

      const canonArs =
        canon != null && moneda
          ? moneda === "ARS"
            ? canon
            : canon * exchangeRate
          : undefined;

      const canonAnualArs =
        canonArs != null && tipoCanon
          ? tipoCanon === "anual"
            ? canonArs
            : anios && anios > 0
              ? canonArs / anios
              : undefined
          : undefined;

      const costoMensualArs =
        canonAnualArs != null ? canonAnualArs / 12 : undefined;

      const costoUnitarioArs =
        costoMensualArs != null && detMensuales != null && detMensuales > 0
          ? costoMensualArs / detMensuales
          : null;

      const isValid =
        contraparte.length > 0 &&
        Boolean(tipoCanon) &&
        typeof canon === "number" &&
        canon > 0 &&
        Boolean(moneda) &&
        typeof anios === "number" &&
        anios > 0 &&
        typeof detMensuales === "number" &&
        detMensuales > 0 &&
        typeof canonArs === "number" &&
        typeof canonAnualArs === "number" &&
        typeof costoMensualArs === "number";

      return {
        index,
        formId: item?.formId,
        contraparte,
        tipoCanon,
        canon: canon ?? undefined,
        moneda,
        anios: anios ?? undefined,
        detMensuales: detMensuales ?? undefined,
        canonArs,
        canonAnualArs,
        costoMensualArs,
        costoUnitarioArs,
        isValid
      } satisfies InterlabComputation;
    });
  }, [exchangeRate, watchedParticipations]);

  const validComputations = useMemo(
    () => computations.filter(isValidInterlab),
    [computations]
  );

  const totalMonthly = useMemo(
    () =>
      validComputations.reduce(
        (acc, item) => acc + (item.costoMensualArs ?? 0),
        0
      ),
    [validComputations]
  );

  const handleAddParticipation = handleSubmitDraft((rawData) => {
    const data = interlabItemSchema.parse(rawData);
    const effectiveAnios = data.tipoCanon === "anual" ? 1 : data.anios;
    const canonArs =
      data.moneda === "ARS" ? data.canon : data.canon * exchangeRate;
    const canonAnualArs =
      data.tipoCanon === "anual" ? canonArs : canonArs / effectiveAnios;
    const costoMensualArs = canonAnualArs / 12;

    const newItem: SharedResourceCostItem = {
      id: createItemId(),
      concept: data.contraparte,
      monthlyCost: costoMensualArs,
      determinations: data.detMensuales,
      interlaboratoryDetails: {
        contraparte: data.contraparte,
        tipoCanon: data.tipoCanon,
        canon: data.canon,
        moneda: data.moneda,
        anios: effectiveAnios,
        detMensuales: data.detMensuales
      }
    };

    skipNextSyncRef.current = true;
    onChange({ ...sublevel, items: [...sublevel.items, newItem] });
    resetDraft({
      contraparte: "",
      tipoCanon: "anual",
      canon: "",
      moneda: "ARS",
      anios: "1",
      detMensuales: ""
    });
  });

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    if (validComputations.length !== watchedParticipations.length) {
      return;
    }

    const items: SharedResourceCostItem[] = validComputations.map(
      (item, index) => {
        const currentItem = sublevel.items[index];
        const id = item.formId ?? currentItem?.id ?? createItemId();

        return {
          id,
          concept: item.contraparte,
          monthlyCost: item.costoMensualArs,
          determinations: item.detMensuales,
          interlaboratoryDetails: {
            contraparte: item.contraparte,
            tipoCanon: item.tipoCanon,
            canon: item.canon,
            moneda: item.moneda,
            anios: item.anios,
            detMensuales: item.detMensuales
          }
        } satisfies SharedResourceCostItem;
      }
    );

    const serializedNextItems = JSON.stringify(
      items.map(normalizeInterlabItem)
    );

    if (serializedNextItems === serializedCurrentItems) {
      return;
    }

    onChange({ ...sublevel, items });
  }, [
    onChange,
    sublevel,
    validComputations,
    watchedParticipations,
    serializedCurrentItems
  ]);

  const draftContraparteError = draftErrors.contraparte;
  const draftTipoCanonError = draftErrors.tipoCanon;
  const draftCanonError = draftErrors.canon;
  const draftMonedaError = draftErrors.moneda;
  const draftAniosError = draftErrors.anios;
  const draftDetMensualesError = draftErrors.detMensuales;

  const draftCanonArs = (() => {
    const canon = parseNumber(draftValues.canon);
    const moneda =
      draftValues.moneda === "ARS" || draftValues.moneda === "USD"
        ? draftValues.moneda
        : null;

    if (canon == null || !moneda) {
      return null;
    }

    return moneda === "ARS" ? canon : canon * exchangeRate;
  })();

  const draftCanonAnualArs = (() => {
    if (draftCanonArs == null) {
      return null;
    }

    const tipoCanon =
      draftValues.tipoCanon === "anual" || draftValues.tipoCanon === "totalPeriodo"
        ? draftValues.tipoCanon
        : null;

    if (!tipoCanon) {
      return null;
    }

    if (tipoCanon === "anual") {
      return draftCanonArs;
    }

    const anios = parseNumber(draftValues.anios);
    if (anios == null || anios <= 0) {
      return null;
    }

    return draftCanonArs / anios;
  })();

  const draftCostoMensualArs =
    draftCanonAnualArs != null ? draftCanonAnualArs / 12 : null;

  const draftCostoUnitarioArs = (() => {
    if (draftCostoMensualArs == null) {
      return null;
    }

    const detMensuales = parseNumber(draftValues.detMensuales);
    if (detMensuales == null || detMensuales <= 0) {
      return null;
    }

    return draftCostoMensualArs / detMensuales;
  })();

  return (
    <section
      className={`space-y-4 rounded-xl border p-4 shadow-sm ${appearance.container}`}
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={`text-lg font-semibold ${appearance.header}`}>
            {sublevel.name}
          </h3>
          <span className="text-base font-semibold text-inta-green">
            {currencyFormatter.format(subtotal)}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${appearance.description}`}>
          {sublevel.description}
        </p>
        <p className="text-xs text-emerald-700">
          El sistema periodiza automáticamente cada canon según el intervalo
          indicado para estimar su costo mensual y la incidencia por
          determinación.
        </p>
      </header>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-emerald-200 bg-white/70 p-4 text-sm text-emerald-800">
          Aún no agregaste participaciones interlaboratorio. Usá el formulario
          inferior para registrar la primera.
        </p>
      ) : null}

      {fields.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-white">
          <table className="min-w-full divide-y divide-emerald-100 text-sm text-emerald-900">
            <thead className={`bg-emerald-50 ${appearance.tableHead}`}>
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  #
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Contraparte interlaboratorio
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Tipo de canon
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Canon
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Moneda
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Período (años)
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Canon anual (ARS)
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Costo mensual (ARS)
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Det. mensuales
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Costo unitario (ARS/det)
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {fields.map((field, index) => {
                const computation = computations[index];
                const defaultContraparte =
                  typeof field.contraparte === "string" ? field.contraparte : "";
                const defaultTipoCanon =
                  field.tipoCanon === "anual" || field.tipoCanon === "totalPeriodo"
                    ? field.tipoCanon
                    : "anual";
                const defaultCanon =
                  typeof field.canon === "string" || typeof field.canon === "number"
                    ? String(field.canon)
                    : "";
                const defaultMoneda =
                  field.moneda === "ARS" || field.moneda === "USD"
                    ? field.moneda
                    : "ARS";
                const defaultAnios =
                  typeof field.anios === "string" || typeof field.anios === "number"
                    ? String(field.anios)
                    : "";
                const defaultDetMensuales =
                  typeof field.detMensuales === "string" ||
                  typeof field.detMensuales === "number"
                    ? String(field.detMensuales)
                    : "";

                const canonDisplay =
                  computation?.canon != null
                    ? numberFormatter.format(computation.canon)
                    : "—";
                const canonAnualDisplay =
                  computation?.canonAnualArs != null
                    ? currencyFormatter.format(computation.canonAnualArs)
                    : "—";
                const costoMensualDisplay =
                  computation?.costoMensualArs != null
                    ? currencyFormatter.format(computation.costoMensualArs)
                    : "—";
                const costoUnitarioDisplay =
                  typeof computation?.costoUnitarioArs === "number"
                    ? currencyFormatter.format(computation.costoUnitarioArs)
                    : "—";
                const detMensualesDisplay =
                  computation?.detMensuales != null
                    ? numberFormatter.format(computation.detMensuales)
                    : "—";

                return (
                  <tr key={field.id}>
                    <td className="px-3 py-2">
                      <input
                        type="hidden"
                        defaultValue={field.id}
                        {...register(`participations.${index}.formId` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={defaultContraparte}
                        {...register(`participations.${index}.contraparte` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={defaultTipoCanon}
                        {...register(`participations.${index}.tipoCanon` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={defaultCanon}
                        {...register(`participations.${index}.canon` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={defaultMoneda}
                        {...register(`participations.${index}.moneda` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={defaultAnios}
                        {...register(`participations.${index}.anios` as const)}
                      />
                      <input
                        type="hidden"
                        defaultValue={defaultDetMensuales}
                        {...register(`participations.${index}.detMensuales` as const)}
                      />
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">{defaultContraparte || "—"}</td>
                    <td className="px-3 py-2">
                      {defaultTipoCanon === "anual" ? "Anual" : "Total del período"}
                    </td>
                    <td className="px-3 py-2 text-right">{canonDisplay}</td>
                    <td className="px-3 py-2">{defaultMoneda}</td>
                    <td className="px-3 py-2 text-right">{defaultAnios || "—"}</td>
                    <td className="px-3 py-2 text-right">{canonAnualDisplay}</td>
                    <td className="px-3 py-2 text-right">{costoMensualDisplay}</td>
                    <td className="px-3 py-2 text-right">{detMensualesDisplay}</td>
                    <td className="px-3 py-2 text-right">{costoUnitarioDisplay}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-sm font-medium text-rose-600 transition hover:text-rose-500"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50/70 font-medium text-emerald-900">
                <td className="px-3 py-2" colSpan={7}>
                  Totales mensuales (ARS)
                </td>
                <td className="px-3 py-2 text-right">
                  {currencyFormatter.format(totalMonthly)}
                </td>
                <td className="px-3 py-2" colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}

      <form
        onSubmit={handleAddParticipation}
        className={`space-y-3 rounded-lg border p-4 ${appearance.form}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className={`text-base font-semibold ${appearance.header}`}>
            Nueva participación interlaboratorio
          </h4>
          <span className="text-xs text-emerald-700">
            Los campos se limpian al guardar
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-emerald-900">
              Contraparte interlaboratorio
            </span>
            <input
              type="text"
              {...registerDraft("contraparte")}
              className="rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-inta-blue focus:outline-none focus:ring-1 focus:ring-inta-blue"
            />
            {draftContraparteError ? (
              <span className="text-xs text-rose-600">
                {draftContraparteError.message}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-emerald-900">Tipo de canon</span>
            <select
              {...registerDraft("tipoCanon")}
              className="rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-inta-blue focus:outline-none focus:ring-1 focus:ring-inta-blue"
            >
              {tipoCanonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {draftTipoCanonError ? (
              <span className="text-xs text-rose-600">
                {draftTipoCanonError.message}
              </span>
            ) : (
              <span className="text-xs text-emerald-700">
                Indicá si el canon se abona anualmente o cubre todo el período.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-emerald-900">Canon</span>
            <input
              type="number"
              step="0.01"
              min={0}
              {...registerDraft("canon")}
              className="rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-inta-blue focus:outline-none focus:ring-1 focus:ring-inta-blue"
            />
            {draftCanonError ? (
              <span className="text-xs text-rose-600">
                {draftCanonError.message}
              </span>
            ) : (
              <span className="text-xs text-emerald-700">
                Considerá el monto informado por la organización coordinadora.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-emerald-900">Moneda</span>
            <select
              {...registerDraft("moneda")}
              className="rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-inta-blue focus:outline-none focus:ring-1 focus:ring-inta-blue"
            >
              {monedaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {draftMonedaError ? (
              <span className="text-xs text-rose-600">
                {draftMonedaError.message}
              </span>
            ) : (
              <span className="text-xs text-emerald-700">
                El tipo de cambio USD→ARS se toma del panel superior.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-emerald-900">Período (años)</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              {...registerDraft("anios")}
              className="rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-inta-blue focus:outline-none focus:ring-1 focus:ring-inta-blue"
              disabled={draftValues.tipoCanon === "anual"}
            />
            {draftAniosError ? (
              <span className="text-xs text-rose-600">
                {draftAniosError.message}
              </span>
            ) : (
              <span className="text-xs text-emerald-700">
                Solo se utiliza si cargás un canon por el total del período.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-emerald-900">
              Determinaciones mensuales
            </span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              {...registerDraft("detMensuales")}
              className="rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-inta-blue focus:outline-none focus:ring-1 focus:ring-inta-blue"
            />
            {draftDetMensualesError ? (
              <span className="text-xs text-rose-600">
                {draftDetMensualesError.message}
              </span>
            ) : (
              <span className="text-xs text-emerald-700">
                Indicá la carga mensual promedio que cubre esta participación.
              </span>
            )}
          </label>
        </div>

        <dl className="grid gap-2 rounded-md bg-white/80 p-3 text-sm text-emerald-900 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <dt className="font-medium">Canon anual equivalente (ARS)</dt>
            <dd>
              {draftCanonAnualArs != null
                ? currencyFormatter.format(draftCanonAnualArs)
                : "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-medium">Costo mensual estimado (ARS)</dt>
            <dd>
              {draftCostoMensualArs != null
                ? currencyFormatter.format(draftCostoMensualArs)
                : "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="font-medium">Costo unitario (ARS/determinación)</dt>
            <dd>
              {draftCostoUnitarioArs != null
                ? currencyFormatter.format(draftCostoUnitarioArs)
                : "—"}
            </dd>
          </div>
        </dl>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-md bg-inta-blue px-3 py-2 text-sm font-medium text-white transition hover:bg-inta-blue/90"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar
        </button>
      </form>
    </section>
  );
}

