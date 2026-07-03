# Cómo participar

¡Gracias por tu interés en la **Calculadora de Costos de Servicios de Laboratorio**! Este es un
prototipo independiente y no oficial (ver el [aviso en el README](README.md)), mantenido con recursos
limitados. Aun así, queremos que sea un espacio abierto y útil.

## Postura de contribución (v1)

En esta primera etapa el proyecto está **abierto a issues y sugerencias**, pero **todavía no se
invitan Pull Requests de código de terceros**. Esto reduce la carga de mantenimiento mientras el
proyecto encuentra su tracción. Puede cambiar en el futuro: cuando abramos PRs, lo anunciaremos aquí
y en el [CHANGELOG](CHANGELOG.md).

Mientras tanto:

- ✅ **Reportá errores** vía [Issues](../../issues).
- ✅ **Proponé ideas y mejoras** vía [Issues](../../issues).
- ✅ **Hacé un fork** para experimentar libremente — la licencia [MIT](LICENSE) lo permite.
- 🚧 **Pull Requests de código**: por ahora no se aceptan de forma general. Si tenés una corrección
  puntual e importante, abrí primero un issue para conversarla.

## Reportar un error

Antes de abrir un issue, revisá si ya existe uno similar. Al reportar, incluí:

1. Qué esperabas que pasara y qué pasó realmente.
2. Pasos para reproducirlo (idealmente con valores de ejemplo de los niveles).
3. Navegador y sistema operativo.
4. Captura de pantalla si aplica.

Usá la plantilla de **Reporte de error** al crear el issue.

## Proponer una idea o mejora

Usá la plantilla de **Sugerencia / idea**. Contanos el problema que querés resolver y, si podés, cómo
imaginás la solución. Las sugerencias sobre la **metodología de costeo** (no sobre el software) deben
dirigirse a las/los autoras/es de la Guía — ver el [README](README.md#atribución-metodológica).

## Levantar el entorno (para explorar o experimentar)

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # ESLint
npm test           # Vitest
npx tsc --noEmit   # tipos
```

## Regla de oro del proyecto

⚠️ **No modificar la lógica de cálculo ni la composición de los cinco niveles sin una discusión
previa.** El motor matemático (`lib/cost-calculation.ts`) es el núcleo crítico: cambios ahí pueden
introducir errores presupuestarios silenciosos. Cualquier cambio de lógica debe venir acompañado de
tests que validen los resultados numéricos (`__tests__/cost-calculation.test.ts`).

## Código de conducta

La participación en este proyecto se rige por nuestro [Código de Conducta](CODE_OF_CONDUCT.md).
