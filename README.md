# SplitPay Pro

SplitPay Pro es una plataforma SaaS de pago compartido con versión B2B de marca blanca para restaurantes y una experiencia B2C genérica para comensales. Está diseñada para permitir que locales ofrezcan división de cuentas con su propio branding, mientras mantiene un modo público funcional para cualquier usuario.

## Arquitectura General

- **Next.js (App Router)**: SSR dinámico y rutas modernas.
- **Tailwind CSS**: UI responsiva y diseño premium.
- **Supabase**: Auth, Database, Storage y sesiones SSR.
- **Google Gemini**: OCR inteligente para recibir y procesar recibos.
- **Vercel**: hosting y despliegue.

## Estructura del Proyecto

El núcleo de la aplicación se encuentra en `apps/web`:

- `src/app/page.tsx` — página principal, carga dinámica de `?ref=slug` y lógica de marca blanca.
- `src/app/admin/page.tsx` — panel de administración B2B para registrar y gestionar locales.
- `src/features/bill-splitter/components/BillSplitterFeature.tsx` — UI y lógica de división de cuenta.
- `src/features/bill-splitter/actions/analyze-receipt.ts` — server action de OCR con Google Gemini.
- `src/middleware.ts` — protección de `/admin`.
- `src/lib/supabase.ts` / `src/lib/supabase-ssr.ts` — inicialización de clientes Supabase.

## Casos de Uso

### Marca Blanca (B2B)
- Local registra su negocio en el dashboard administrativo.
- Genera una URL personalizada: `https://pago-compartido-pro.vercel.app/?ref=mi-local`.
- La página principal detecta `ref`, carga el `negocio` activo y aplica logo, colores y nombre.

### Modo Público (B2C)
- Si el `ref` no existe o el local no está activo, la app vuelve a diseño genérico `SplitPay`.
- Los comensales pueden seguir escaneando recibos y compartiendo resultados.

## Flujo Principal

### 1. Captura de Recibo
- El usuario sube una imagen.
- El cliente comprime la imagen con `browser-image-compression`.
- Se envía a `/api/scan` o a la server action para procesar con Gemini.

### 2. Análisis OCR
- `analyze-receipt.ts` envía la imagen a Google Gemini.
- Se solicita un JSON limpio con `storeName`, `currency` e `items`.
- La app toma el JSON y genera items para el splitter.

### 3. División de Cuenta
- `BillSplitterFeature` crea personas y asigna ítems.
- Calcula montos por persona, total y porción no asignada.

### 4. Compartir Resultados
- Usa la Web Share API nativa cuando está disponible.
- Si no, hace fallback al portapapeles.

## Panel de Administración

### Funcionalidades
- Registro de locales con `nombre`, `slug`, `color_primario` y `logo`.
- Previsualización de logo local con `URL.createObjectURL`.
- Toggle de estado `activo`.
- Eliminación de locales.
- Copiado del link de marca blanca.

### Seguridad
- `/admin` protegido por middleware que valida sesión Supabase.
- Se redirige a `/login` si no hay sesión válida.

## Variables de Entorno

Asegúrate de configurar estas variables en Vercel o en `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

## Documentación Adicional

Consulta `ARCHITECTURE.md` para una descripción técnica más profunda de la arquitectura, seguridad, flujos y diseños del sistema.

## Cómo Ejecutar

```bash
cd apps/web
npm install
npm run dev
```

Luego abre `http://localhost:3000`.

## Notas

- El proyecto usa `export const dynamic = 'force-dynamic'` en la página principal para leer `searchParams` en tiempo real.
- El dashboard de admin es un componente cliente con autenticación Supabase verificable.
- La seguridad debe reforzarse con políticas RLS en Supabase.
