# Despliegue en Vercel (Monorepo)

Sigue estos pasos en el Dashboard de Vercel para conectar el repositorio Git y configurar la aplicación `apps/titanium-landing`:

1. **Framework Preset**: Selecciona `Next.js`.
2. **Root Directory**: `apps/titanium-landing`. (Asegúrate de habilitar la opción *"Keep existing build settings"*).
3. **Build Command**: `cd ../.. && npx turbo run build --filter=titanium-landing` (o el comando correspondiente según el gestor de monorepo que use el proyecto, como Turborepo o Nx).
4. **Output Directory**: `.next`
5. **Ignored Build Step**: Configura el comando para que Vercel solo construya la landing si hay cambios dentro de su propia carpeta o en dependencias compartidas del monorepo (ej: `git diff --quiet HEAD^ HEAD .`).
