# SplitPay Pro — Arquitectura Técnica

## 1. Resumen del Proyecto y Arquitectura General

**SplitPay Pro** es una plataforma SaaS de pago compartido para restaurantes que combina:

- un **modelo B2B de marca blanca** para restaurantes y locales que desean ofrecer una experiencia de división de cuentas bajo su propia identidad;
- un **modelo B2C genérico** para comensales o grupos que usan la aplicación en modo público.

### Modelo B2B y B2C

- **B2B (Marca Blanca):** el restaurante crea un `negocio` en el panel de administración. El sistema genera una URL con `?ref=slug`, que permite cargar el branding, logo, colores y contenido específico del local.
- **B2C (Uso genérico):** si la URL no contiene un `ref` válido o la marca no está activa, la app cae a un modo genérico con diseño `SplitPay`.

### Stack Tecnológico

- **Next.js (App Router)** para SSR y rutas dinámicas.
- **Tailwind CSS** para diseño responsivo y UI premium.
- **Supabase** para Auth, Database, Storage y sesiones SSR.
- **Google Gemini** para OCR e inteligencia artificial de lectura de recibos.
- **Vercel** para despliegue y hosting.

### Estructura del Monorepo

El proyecto se organiza principalmente en `apps/web`:

- `apps/web/src/app/page.tsx` — entrada principal y motor de marca blanca.
- `apps/web/src/app/admin/page.tsx` — dashboard B2B para gestión de locales.
- `apps/web/src/features/bill-splitter/components/BillSplitterFeature.tsx` — UI y lógica principal de división de cuenta.
- `apps/web/src/features/bill-splitter/actions/analyze-receipt.ts` — server action de OCR con Gemini.
- `apps/web/src/middleware.ts` — protección de rutas de administración.
- `apps/web/src/lib/supabase.ts` y `src/lib/supabase-ssr.ts` — inicialización de clientes Supabase.

## 2. Esquema de Base de Datos y Seguridad (Supabase)

### Tabla `negocios`

El núcleo de la plataforma B2B es la tabla `negocios`, con campos clave:

- `slug` — identificador URL-friendly, usado en `?ref=slug`.
- `nombre` — nombre visible del restaurante.
- `color_primario` — color principal para UI de marca blanca.
- `logo_url` — ruta del logo almacenado en Supabase Storage.
- `activo` — bandera para habilitar/deshabilitar la marca blanca.
- `fecha_suscripcion` — fecha base para la suscripción mensual.

### Gestión de Auth

Para administración y acceso protegido se usa Supabase con sesiones SSR:

- `apps/web/src/lib/supabase-ssr.ts` crea clientes para **navegador** y **servidor**.
- `middleware.ts` valida que exista sesión antes de permitir el acceso a `/admin`.
- `admin/page.tsx` usa `@supabase/ssr` y `createBrowserClient` para validaciones de usuario.

Ejemplo de creación del cliente en SSR:

```ts
import { createServerClient } from '@supabase/ssr';

const supabase = createServerClient(supabaseUrl, supabaseKey, {
  cookies: { ... }
});
```

### Políticas de Seguridad (RLS)

La arquitectura requiere RLS en Supabase para proteger datos críticos.

- **Tabla `negocios`:** 
  - lectura pública controlada por `activo = true` para branding público;
  - edición y borrado solo por usuarios autenticados y autorizados vía panel admin.
- **Bucket `locales_assets`:** 
  - `logo_url` se almacena en `locales_assets/logos/`;
  - la política debe permitir solo subida y lectura controlada según rol/autenticación.

> Nota: El código del repositorio asume que las credenciales de Supabase públicas se usan para lectura en cliente, mientras que las acciones administrativas se firman con sesiones seguras.

## 3. Lógica Core del Sistema (Flujos Críticos)

### Motor de Marca Blanca

El archivo **`apps/web/src/app/page.tsx`** es la puerta de marca blanca:

- define `export const dynamic = 'force-dynamic';` para impedir renderizado estático en Vercel.
- resuelve `searchParams` con la promesa de App Router:

```ts
export default async function Home(props: { searchParams: Promise<{ ref?: string }> }) {
  const searchParams = await props.searchParams;
  const slug = searchParams?.ref;
  // ...
}
```

- consulta Supabase con el `slug` y `activo = true`:

```ts
const { data: negocioData } = await supabase
  .from('negocios')
  .select('*')
  .eq('slug', slug)
  .eq('activo', true)
  .single();
```

- construye `brand` y lo pasa a `BillSplitterFeature`:

```tsx
<BillSplitterFeature brand={brand} banners={banners} />
```

- cuando `brand` existe renderiza el logo, nombre y color principal; de lo contrario, mantiene el fallback `SplitPay`.

### Motor de OCR (Gemini)

El server action **`analyze-receipt.ts`** implementa el flujo de OCR:

1. Convierte la imagen subida a base64.
2. Usa la API de Google Gemini para obtener modelos disponibles.
3. Selecciona dinámicamente el mejor modelo Gemini (`flash` > `pro`).
4. Envía un prompt estricto que pide un JSON válido con `storeName`, `currency` e `items`.
5. Limpia la respuesta y parsea el JSON.

Ejemplo de prompt:

```ts
const prompt = `
Actúa como un sistema OCR experto en facturas de restaurantes.
Analiza esta imagen y extrae SOLO los items consumibles...
Formato JSON requerido:
{
  "storeName": "...",
  "currency": "S/",
  "items": [
    { "name": "...", "price": 10.50 }
  ]
}
`;
```

### Lógica de División de Cuenta

El componente principal **`BillSplitterFeature.tsx`** contiene la lógica core:

- carga de recibo y compresión de imagen con `browser-image-compression` antes de enviar al servidor;
- recibe items OCR y construye el estado inicial de la factura;
- permite agregar personas y asignar ítems a cada persona;
- calcula totales y detecta ítems no asignados.

Ejemplo de cálculo de totales:

```ts
const totals = useMemo(() => {
  const map = new Map<number, number>();
  people.forEach(p => map.set(p.id, 0));

  items.forEach(item => {
    const unitPrice = item.price / totalAssigned;
    item.assignments.forEach(assignment => {
      map.set(assignment.personId, (map.get(assignment.personId) || 0) + cost);
    });
  });

  return { map, totalBill, unassigned };
}, [items, people]);
```

### Motor de Compartir

La experiencia nativa de compartir usa la **Web Share API** con fallback a portapapeles:

```ts
if (navigator.share) {
  await navigator.share({ title: 'Cuenta de SplitPay', text: textToCopy });
} else {
  await navigator.clipboard.writeText(textToCopy);
}
```

- si el dispositivo es compatible, se abre el diálogo nativo de compartir;
- si no, se copia automáticamente el resumen al portapapeles.

## 4. Panel de Administración (Dashboard B2B)

### Protección de Rutas

- `apps/web/src/middleware.ts` protege `/admin`.
- verifica sesión Supabase con `createServerClient` en middleware.
- redirige a `/login` si la sesión no existe.

Ejemplo en middleware:

```ts
const supabase = createServerClient(supabaseUrl, supabaseKey, {
  cookies: { ... }
});
const { data: { session } } = await supabase.auth.getSession();
if (!session) return NextResponse.redirect(new URL('/login', request.url));
```

### Creación de Negocios

- el formulario de `admin/page.tsx` permite registrar nuevos locales con `nombre`, `slug`, `color_primario` y `logo`.
- la carga de imagen usa `URL.createObjectURL` para preview local.
- el logo se sube a Supabase Storage antes de crear el registro.

### Dashboard de Gestión

- lista los `negocios` existentes con estado activo/inactivo.
- permite togglear el `activo` directamente.
- calcula los días restantes de suscripción usando `fecha_suscripcion`.
- genera el link blanco de la forma:

```ts
const url = `${window.location.origin}/?ref=${slug}`;
```

- ofrece acciones de `Eliminar` y `Copiar Enlace`.

## 5. Estrategias de Prevención y Seguridad

### Soft Paywall

- se captura el `storeName` detectado por OCR y se muestra contenido de conversión cuando el local no está personalizado.
- esto permite ofrecer una experiencia gratuita inicial mientras se empuja a los locales a registrar su marca blanca.

### Manejo de Linter y UI

- se usan clases lógicas de Tailwind para soportar diseño en App Router y accesibilidad.
- se maneja el feedback del usuario con texto dinámico de botón en lugar de alertas redundantes.
- se evita renderizar componentes duplicados y se mantiene la UI en un único header condicional.

## 6. Recomendaciones Operativas

- **Asegurar RLS:** aplicar políticas de RLS estrictas en Supabase para que solo admins puedan modificar `negocios` y buckets privados.
- **Variables de entorno:** configurar correctamente en Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY`
- **Build en Vercel:** el endpoint de marca blanca debe correr como **dinámico** (`force-dynamic`) para leer `?ref=slug` en cada request.
- **Auditoría de imágenes:** validar el bucket `locales_assets/logos` para que solo contenga logos subidos desde el admin.

---

### Resumen

SplitPay Pro es una solución SaaS híbrida que combina un frontend rico en experiencia con una capa B2B de marca blanca sobre un motor B2C flexible. La arquitectura prioriza:

- carga dinámica de branding,
- captura inteligente de recibos con IA,
- experiencia de pago compartido móvil,
- administración segura de negocios,
- despliegue en Vercel con renderizado dinámico y Supabase como backend.
