# CLAUDE.md — Contexto del Proyecto

## Qué es este proyecto

Calculadora web de costos de servicios de laboratorio para el INTA (Instituto Nacional de Tecnología Agropecuaria). Su propósito es estimar con precisión y trazabilidad el costo unitario de un ensayo analítico, siguiendo una metodología de costeo en cinco niveles acumulativos.

No es una app CRUD con backend: toda la lógica vive en el cliente (React + Next.js App Router). Los únicos endpoints de servidor son proxies hacia APIs externas de tipo de cambio.

## Regla de oro para modificaciones

**Nunca modificar la lógica de cálculo ni la composición de los cinco niveles sin instrucción explícita del usuario.** El motor matemático en `lib/cost-calculation.ts` es el núcleo funcional crítico; cambios ahí pueden introducir errores presupuestarios silenciosos. Toda modificación de lógica de negocio debe ir acompañada de tests que validen los resultados numéricos.

## Arquitectura

```
app/
  page.tsx              # Orquestador principal: inicializa el estado de los 5 niveles y
                        # renderiza el formulario dinámico. Aquí están los valores por defecto.
  layout.tsx            # Providers de Context (ExchangeRate, HourlyRates)
  globals.css
  api/
    cotizacion/bna/     # Scraping de cotización desde BNA (fallback legacy)
    monedapi/usd/       # Proxy hacia monedapi.ar con caché LRU + reintentos

components/
  LevelOneCard.tsx      # Nivel 1: insumos, mano de obra, equipamiento específico
  IndirectLevelCard.tsx # Nivel 2: costos indirectos con prorrateo por determinaciones
  DirectLevelCard.tsx   # Nivel genérico para niveles tipo "direct"
  PercentageLevelCard.tsx          # Nivel genérico tipo porcentaje simple
  SequentialPercentageLevelCard.tsx # Nivel 5: porcentajes secuenciales
  InstitutionalPricingPanel.tsx    # Nivel 4: afectación institucional (EEA + Centro)
  ThirdPartyAccreditationSection.tsx # Sublevel d.1: acreditaciones (OAA, SENASA, etc.)
  InterlaboratoryParticipationSection.tsx # Sublevel d.3: ensayos interlaboratorio
  ConfigurationPanel.tsx  # Configuraciones globales: tipo de cambio, determinaciones, nombres
  SummaryPanel.tsx        # Resumen económico final + exportación PDF/JSON
  IntroPanel.tsx          # Presentación y guía de uso
  icons.tsx               # SVGs inline

contexts/
  ExchangeRateContext.tsx # Estado global del tipo de cambio USD→ARS (manual o automático)
  HourlyRatesContext.tsx  # Tarifas horarias por perfil, persistidas en localStorage

lib/
  cost-calculation.ts     # MOTOR CRÍTICO: tipos discriminados + función calculateTotals()
  hourlyRates.ts          # Gestión de tarifas horarias (parse, serialize, localStorage)
  monedapi.ts             # Cliente de monedapi.ar con caché LRU en memoria
  money.ts                # Utilitario round2() para redondeo monetario
  app-config.ts           # Constantes de configuración (LABOR_MONTHLY_HOURS, etc.)

__tests__/                # Vitest + Testing Library
docs/features/            # Especificaciones Gherkin de cada feature funcional
```

## Los cinco niveles de cálculo

| Nivel | Tipo de estado | Componente principal |
|-------|---------------|----------------------|
| 1 – Costos Directos | `DirectLevelGroupState` | `LevelOneCard` |
| 2 – Costos Indirectos | `IndirectLevelGroupState` | `IndirectLevelCard` |
| 3 – Acreditación y Monitoreo | `IndirectLevelGroupState` | `IndirectLevelCard` |
| 4 – Afectación Institucional | `SequentialPercentageLevelState` | `InstitutionalPricingPanel` |
| 5 – Gestión Estratégica y Margen | `SequentialPercentageLevelState` | `SequentialPercentageLevelCard` |

El estado de cada nivel es una **unión discriminada** definida en `lib/cost-calculation.ts`. El renderizado dinámico en `app/page.tsx` elige el componente según el campo `type` del estado.

## Lógica de negocio clave

- **Insumos directos**: `(precioFormato / cantidadFormato) × cantidadUsada`. Soporta conversión de unidades (g↔kg, mL↔L) vía `convert-units`.
- **Mano de obra**: `tarifaHoraria × horas × cantidadPersonas`. Tarifa horaria = `salarioMensual / 176` (176 = 22 días × 8 h). Las tarifas vienen de `HourlyRatesContext`.
- **Equipamiento (depreciación lineal)**: `(costo − valorResidual) / vidaÚtilAnios / 12`.
- **Prorrateo (niveles 2 y 3)**: `costoMensual / determinacionesMensuales`. Cada ítem puede tener sus propias determinaciones o heredar el global.
- **Niveles 4 y 5**: Aplicación secuencial de porcentajes sobre base acumulada.

Toda aritmética usa `decimal.js` para evitar errores de punto flotante.

## Estado de la aplicación

El estado completo de los cinco niveles vive en `app/page.tsx` como un array de `LevelState[]`. No hay base de datos. La persistencia es mínima: solo las tarifas horarias se guardan en `localStorage` (clave `lab_hourly_rates_v1`). La exportación de supuestos se hace a JSON descargable.

## Integración de tipo de cambio

`/api/monedapi/usd` es el endpoint principal. Proxy hacia `monedapi.ar/api/usd/bna` con:
- Timeout: 4 segundos (AbortController)
- Caché LRU en memoria: 60 min de validez, retención de emergencia hasta 24 h
- Fallback: si Monedapi falla pero hay caché, responde con `source: "cache"` y aviso en UI
- Si no hay datos ni en live ni en caché, devuelve `503 MONEDAPI_UNAVAILABLE` y la UI conserva el valor manual

## Testing

```bash
npm test          # Vitest (jsdom)
npm run lint      # ESLint (next/core-web-vitals + reglas personalizadas)
npx tsc --noEmit  # Type-check
```

Los tests de `__tests__/cost-calculation.test.ts` son los más críticos: validan la aritmética presupuestaria. Ante cualquier cambio en `lib/cost-calculation.ts`, deben seguir pasando (o actualizarse con justificación explícita).

## Stack técnico

- **Framework**: Next.js 13.5.6 (App Router)
- **UI**: React 18, Tailwind CSS 3
- **Lenguaje**: TypeScript 5 (strict)
- **Aritmética**: Decimal.js (precisión decimal)
- **Formularios**: react-hook-form + Zod
- **Unidades**: convert-units
- **Exportación**: html2pdf.js (lazy-loaded), papaparse (CSV)
- **Tests**: Vitest + @testing-library/react
- **Despliegue**: Vercel (serverless edge)

## Historial y contexto

El proyecto nació de la colaboración humano-IA: el usuario (Mauro Pinotti, INTA) ofició de Product Owner, y agentes de IA (Claude Code) generaron el código mediante PRs incrementales bajo el prefijo de rama `Mauropinotti/codex/*`. Tras ~70 PRs mergeados sobre `main`, todas las ramas históricas fueron eliminadas y el proyecto continúa únicamente en `main`.

El archivo `analisis_documental.md.resolved` contiene un análisis técnico detallado del proyecto, útil para entender decisiones de diseño tomadas en etapas previas.
