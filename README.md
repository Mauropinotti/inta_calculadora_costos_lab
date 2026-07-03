<div align="center">

<img src="public/img/INTA_300x300.jpg" alt="Logo INTA" width="120" height="120" />

# Calculadora de Costos de Servicios de Laboratorio

Estimación de costos rutinarios de laboratorio en **cinco niveles acumulativos**, con trazabilidad y precisión decimal.

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-00548F.svg)](LICENSE)
[![Estado: prototipo](https://img.shields.io/badge/Estado-prototipo%20funcional-F39200.svg)](#estado-y-alcance)
[![Next.js](https://img.shields.io/badge/Next.js-13-000000.svg)](https://nextjs.org/)

</div>

---

> ### ⚠️ Aviso de carácter NO oficial
>
> Esta es una herramienta **no oficial**. Es un **prototipo funcional e independiente**, desarrollado
> por personal del INTA a título personal, que **no representa una posición, un aval ni un producto
> oficial** del Instituto Nacional de Tecnología Agropecuaria. Se ofrece "tal cual" (_as-is_), sin
> garantías, bajo el espíritu de generar valor público abierto a partir de una iniciativa interna.
>
> El uso de la marca y los colores institucionales del INTA es meramente contextual y de atribución
> a la metodología de origen; no implica respaldo institucional.

---

## Qué es

Calculadora web que estima el **costo unitario** de un ensayo o servicio analítico de laboratorio,
descomponiéndolo en cinco niveles de costeo acumulativos. Toda la lógica corre en el cliente
(React + Next.js): no hay backend ni base de datos, salvo un proxy a una API pública de tipo de cambio.

Sirve para construir escenarios económicos reproducibles, documentar los supuestos de una estimación
y exportarlos para respaldo o revisión.

## Atribución metodológica

Esta aplicación es una **interpretación** de un documento **público** del INTA:

> **Guía metodológica para el costeo de servicios rutinarios en laboratorios de INTA**
> Autores: **Mercedes Goizueta** y **Andrés Castellano** — INTA EEA Marcos Juárez.
> Publicada en [Argentina.gob.ar](https://www.argentina.gob.ar/inta/cr-cordoba/guia-metodologica-para-el-costeo-de-servicios-rutinarios-en-laboratorios-de-inta).

La **idea, la metodología y su marco conceptual pertenecen a sus autoras/es**. Esta calculadora es
una implementación de software que interpreta esa metodología; puede diferir en detalles de la
formulación original. Para consultas sobre **la Guía o la metodología** (no sobre el software),
el contacto de referencia es **Mercedes Goizueta** — `[goizueta.mercedes@inta.gob.ar]`.

## Los cinco niveles de cálculo

| Nivel | Nombre                           | Qué agrupa                                                               |
| ----: | -------------------------------- | ------------------------------------------------------------------------ |
|     1 | **Costos Directos**              | Insumos/reactivos, mano de obra y equipamiento específico (depreciación) |
|     2 | **Costos Indirectos**            | Costos compartidos prorrateados por determinaciones mensuales            |
|     3 | **Acreditación y Monitoreo**     | Aranceles, auditorías, ensayos interlaboratorio y acreditaciones         |
|     4 | **Afectación Institucional**     | Porcentajes secuenciales de EEA/Instituto y Centro Regional              |
|     5 | **Gestión Estratégica y Margen** | Porcentajes secuenciales finales de gestión y margen                     |

Cada nivel alimenta un resumen económico global. Toda la aritmética usa **Decimal.js** para evitar
errores de punto flotante. El detalle de cada campo y fórmula está en el **[Manual de usuario](docs/MANUAL.md)**.

## Estado y alcance

Prototipo **funcional y operativo**, en primera versión pública (v1.0.0). No es un producto con
soporte formal ni garantías de disponibilidad. La persistencia es mínima (tarifas horarias en
`localStorage`); los supuestos se exportan a JSON/PDF descargable.

## Stack técnico

- **Framework:** Next.js 13 (App Router) · **UI:** React 18 + Tailwind CSS 3
- **Lenguaje:** TypeScript 5 (strict) · **Aritmética:** Decimal.js
- **Formularios:** react-hook-form + Zod · **Unidades:** convert-units
- **Exportación:** html2pdf.js (lazy), papaparse · **Tests:** Vitest + Testing Library
- **Despliegue:** Vercel

## Desarrollo local

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo → http://localhost:3000
npm run lint      # análisis estático (ESLint)
npm test          # suite de pruebas (Vitest)
npx tsc --noEmit  # verificación de tipos
```

## Despliegue en Vercel

Importar el repositorio en Vercel con los valores por defecto de Next.js:

- **Framework:** Next.js · **Build:** `npm run build` · **Salida:** `.next`

## Tipo de cambio (Monedapi)

La app obtiene el tipo de cambio oficial minorista USD → ARS desde **Monedapi**
(`https://monedapi.ar`). El endpoint interno `/api/monedapi/usd` encapsula la consulta con:

- Timeout de 4 s (`AbortController`).
- Caché LRU en memoria: 60 min de validez, retención de emergencia hasta 24 h.
- Fallback: ante caída del servicio responde desde caché (`source: "cache"`) con aviso en la UI.
- Si no hay datos live ni en caché, devuelve `503 MONEDAPI_UNAVAILABLE` y la UI conserva el valor manual.

## Cómo participar

Este repositorio está **abierto a reportes de errores y sugerencias** vía
[GitHub Issues](../../issues). Por ahora **no se invitan Pull Requests de código de terceros**, pero
los _forks_ para experimentar son bienvenidos (la licencia MIT lo permite). Ver **[CONTRIBUTING.md](CONTRIBUTING.md)**
y el **[Código de Conducta](CODE_OF_CONDUCT.md)**.

## Licencia y términos de uso

Distribuido bajo licencia **[MIT](LICENSE)**.
© 2026 Mauro H. Pinotti, Mercedes Goizueta, Andrés Castellano.

El uso de la aplicación está sujeto a los **[Términos y condiciones](docs/TERMINOS_Y_CONDICIONES.md)**
(prototipo no oficial, resultados orientativos), que también se muestran y se aceptan dentro de la
propia herramienta en el primer uso.

## Autores y contacto

| Rol                     | Persona               | Ámbito                                                                  | Contacto                      |
| ----------------------- | --------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| Desarrollo del software | **Mauro H. Pinotti**  | Gerencia de Gestión Estratégica de la Investigación y Desarrollo (INTA) | `[pinotti.mauro@inta.gob.ar]` |
| Autoría metodológica    | **Mercedes Goizueta** | INTA EEA Marcos Juárez                                                  | `[completar email]`           |
| Autoría metodológica    | **Andrés Castellano** | INTA EEA Marcos Juárez                                                  | _ver Guía metodológica_       |

Para cuestiones del **software** (bugs, ideas): abrí un _issue_. Para cuestiones de **metodología**:
contactar a Mercedes Goizueta.
