# Dashboard Estratega Life

Dashboard de analítica construido con Astro, React, Tailwind CSS y Recharts.

## Desarrollo local

1. Copia `.env.example` como `.env`.
2. Completa `ANALYTICS_BEARER_TOKEN`.
3. Instala dependencias con `pnpm install`.
4. Ejecuta `pnpm dev`.

Astro usa un proxy local para que el bearer token no forme parte del código enviado al navegador.

## Despliegue en Netlify

El proyecto incluye `netlify.toml` y la función `netlify/functions/analytics.mjs`.

Configura estas variables en **Site configuration → Environment variables**:

| Variable | Valor |
| --- | --- |
| `ANALYTICS_API_BASE_URL` | URL base del API, incluyendo `/v1` |
| `ANALYTICS_BEARER_TOKEN` | Bearer token privado del API |
| `PUBLIC_ANALYTICS_PROXY_URL` | `/.netlify/functions/analytics` |

Configuración de compilación:

- Build command: `pnpm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Node.js: `22`

No agregues `.env` al repositorio. El archivo `.env.example` solo documenta los nombres requeridos.
