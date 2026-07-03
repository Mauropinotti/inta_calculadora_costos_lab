"use client";

import type { Screen } from "@/app/page";

// next/image no prepende el basePath a `src` de string cuando images.unoptimized
// está activo (export estático). Lo resolvemos con un <img> y el basePath explícito.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const STEPS: { id: Screen; label: string }[] = [
  { id: "dashboard", label: "Inicio" },
  { id: "nivel1",    label: "Directos" },
  { id: "nivel2",    label: "Indirectos" },
  { id: "nivel3",    label: "Acreditación" },
  { id: "resumen",   label: "Resumen" },
];

const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

interface StickyHeaderProps {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  grandTotal: number;
  exchangeRate: number;
  progressPercent: number;
  doneScreens: Set<Screen>;
}

export function StickyHeader({ screen, onNavigate, grandTotal, exchangeRate, progressPercent, doneScreens }: StickyHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-inta-gray-200 shadow-[0_2px_8px_rgba(0,84,143,0.08)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src={`${BASE_PATH}/img/INTA_300x300.jpg`}
            alt="Logo INTA"
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg object-contain shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-inta-blue leading-[1.15]">
              Calculadora de Costos de Servicios Rutinarios de Laboratorio
            </div>
            <div className="text-[10px] uppercase tracking-wide text-inta-gray-500 leading-tight">
              INTA Labs · Prototipos
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] text-inta-gray-500 leading-none">Costo unitario estimado</div>
          <div className={`text-xl font-bold tracking-tight leading-snug ${grandTotal > 0 ? "text-inta-green" : "text-inta-gray-400"}`}>
            {fmtARS(grandTotal)}
          </div>
          {grandTotal > 0 && exchangeRate > 0 && (
            <div className="text-[11px] text-inta-gray-400">≈ {fmtUSD(grandTotal / exchangeRate)}</div>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-[3px] bg-inta-gray-100">
        <div
          className="h-full bg-gradient-to-r from-inta-blue to-inta-green transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step nav */}
      <nav className="flex overflow-x-auto scrollbar-hide px-1">
        {STEPS.map((step, i) => {
          const isActive = screen === step.id;
          const isDone = doneScreens.has(step.id);
          return (
            <button
              key={step.id}
              onClick={() => onNavigate(step.id)}
              className={`
                flex-none flex flex-col items-center gap-0.5 px-4 py-2 pb-2.5
                text-[11px] whitespace-nowrap border-b-2 transition-colors duration-150
                ${isActive
                  ? "border-inta-blue text-inta-blue font-semibold"
                  : isDone
                    ? "border-transparent text-inta-green"
                    : "border-transparent text-inta-gray-400"}
              `}
            >
              <span className={`
                w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center
                text-[10px] font-bold transition-all duration-150
                ${isActive
                  ? "bg-inta-blue border-inta-blue text-white"
                  : isDone
                    ? "bg-inta-green border-inta-green text-white"
                    : "bg-white border-inta-gray-300 text-inta-gray-400"}
              `}>
                {isDone && !isActive ? "✓" : i}
              </span>
              {step.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
