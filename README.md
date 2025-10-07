# Calculadora de Costos de Servicios de Laboratorio INTA

Aplicación web construida con Next.js y Tailwind CSS para estimar el costo de un
servicio de laboratorio del INTA en cinco niveles acumulativos:

1. **Recursos humanos**
2. **Insumos y reactivos**
3. **Equipamiento y amortización**
4. **Servicios generales y soporte**
5. **Gestión estratégica y margen institucional**

Cada nivel se calcula de manera independiente y alimenta un resumen global que
permite proyectar distintos escenarios. La herramienta incluye exportación de
los supuestos a un archivo JSON para documentar la estimación.

## Desarrollo local

1. Instala las dependencias (requiere acceso al registro de npm).

   ```bash
   npm install
   ```

2. Copia el archivo de ejemplo de variables de entorno y completa los valores
   sensibles.

   ```bash
   cp .env.local.example .env.local
   ```

3. Ejecuta las migraciones o sincroniza el esquema con la base de datos Neon.

   ```bash
   npm run db:push
   # o
   npm run db:migrate
   ```

4. Opcional: inspecciona las tablas con la interfaz de Drizzle.

   ```bash
   npm run db:studio
   ```

5. Ejecuta el seeder para poblar categorías de infraestructura y valores hora
   de ejemplo.

   ```bash
   npm run db:seed
   ```

6. Inicia el servidor de desarrollo.

   ```bash
   npm run dev
   ```

7. Abre `http://localhost:3000` en el navegador para ver la calculadora.

8. Ejecuta el análisis estático.

   ```bash
   npm run lint
   ```

9. Ejecuta la suite de pruebas.

   ```bash
   npm test
   ```

   > Algunas pruebas de integración quedan marcadas como `skip` por defecto
   > porque requieren una base de datos Neon accesible y un servidor Next.js en
   > ejecución.

## Configuración de la base de datos

- **Motor**: PostgreSQL (Neon serverless) con conexión HTTP.
- **ORM**: Drizzle ORM + drizzle-kit para migraciones.
- **URL**: definida en `DATABASE_URL` (debe incluir `sslmode=require`).
- **Migraciones**: se generan a partir de `src/db/schema.ts` y se almacenan en
  el directorio `drizzle/`.
- **Seeds**: `src/db/seeds.ts` inserta categorías de infraestructura base y dos
  valores hora de referencia.

### Variables de entorno relevantes

| Variable       | Descripción                                                 |
| -------------- | ----------------------------------------------------------- |
| `DATABASE_URL` | Cadena de conexión de Neon (con `sslmode=require`).         |
| `NODE_ENV`     | `development`, `production` o `test`.                       |
| `LOG_LEVEL`    | Nivel mínimo del logger (`error`, `warn`, `info`, `debug`). |

## Endpoints REST

- `GET /api/health`: verifica la conectividad a la base de datos y presencia de
  tablas críticas (cabeceras `cache-control: no-store`).
- `GET /api/quotes`: listado paginado de cotizaciones (`page`, `limit`,
  `search`).
- `POST /api/quotes`: crea una cotización en estado `draft` (valida con Zod).
- `GET /api/quotes/:id`: obtiene la cotización con sus líneas y agregados.
- `PATCH /api/quotes/:id`: actualiza campos editables de la cotización.
- `DELETE /api/quotes/:id`: elimina la cotización y sus líneas asociadas.
- `GET /api/hourly-rates`: lista valores hora (filtro `?active=true`).
- `POST /api/hourly-rates`: crea o actualiza un valor hora por `profile_code`
  + `valid_from`.
- `GET /api/infra`: devuelve las categorías de infraestructura semilladas.

Todos los endpoints usan runtime `nodejs`, validación con Zod, rate limiting en
operaciones de escritura y logging con ofuscación de secretos.

## Observabilidad y salud

- Logger minimalista (`src/lib/logger.ts`) con niveles y redactado de secretos.
- `src/db/health.ts` ejecuta `SELECT 1` y verifica tablas clave.
- En desarrollo, `src/lib/startup.ts` realiza una verificación inicial y
  asegura que existan las seis categorías base de infraestructura.

## Despliegue en Vercel

Este proyecto está preparado para desplegarse directamente en Vercel. Configura
la aplicación importando el repositorio y definiendo los siguientes valores por
defecto:

- **Framework**: Next.js
- **Comando de build**: `npm run build`
- **Directorio de salida**: `.next`

## Personalización

- Ajusta los textos y documentación de soporte en `components/IntroPanel.tsx`.
- Modifica las tasas sugeridas para los niveles porcentuales en `app/page.tsx`.
- Puedes ampliar la lógica de cálculo en `lib/cost-calculation.ts` para incluir
  unidades adicionales, coeficientes u hojas de referencia externas.

## Tipo de cambio y API del BCRA

La aplicación obtiene el tipo de cambio oficial minorista USD → ARS desde la
API pública **BCRA – Estadísticas Cambiarias v1.0**
(`<https://api.bcra.gob.ar/estadisticascambiarias/v1.0>`). El backend de Next.js
expone un endpoint interno (`/api/bcra/usd`) que encapsula las llamadas a
`/Cotizaciones` y normaliza la respuesta al contrato usado por la interfaz.

### Flujo de consulta

1. El cliente (`contexts/ExchangeRateContext.tsx`) solicita `/api/bcra/usd`.
2. La función serverless aplica un timeout de 4 s mediante `AbortController` y
   controla la caché (`s-maxage=3600`, `stale-while-revalidate=300`).
3. Se consulta primero `/Cotizaciones?fecha=YYYY-MM-DD` usando la fecha actual
   de Buenos Aires y, si es necesario, se retrocede hasta tres días para cubrir
   fines de semana o feriados. Como último recurso se invoca `/Cotizaciones` sin
   fecha para obtener el último dato disponible.
4. Las respuestas válidas se almacenan en una caché LRU en memoria (60 minutos
   de vigencia, retención de emergencia hasta 24 h). Si el BCRA está caído pero
   existe un valor en caché, el endpoint responde con `source: "cache"` para que
   la UI muestre el aviso correspondiente.
5. Si no hay datos ni en el BCRA ni en caché, el endpoint devuelve `503
   BCRA_UNAVAILABLE` y la aplicación conserva el tipo de cambio manual.

### SLA internos

- **Origen oficial**: BCRA – Estadísticas Cambiarias v1.0 (`/Cotizaciones`).
- **Timeout**: 4 segundos por solicitud al BCRA.
- **Caché de aplicación**: 60 minutos de validez (máximo 24 h en modo
  contingencia).
- **Encabezados HTTP**: `cache-control: public, s-maxage=3600,
  stale-while-revalidate=300` y `retry-after: 300` ante indisponibilidad.
