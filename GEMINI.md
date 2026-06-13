**REGLA DE AISLAMIENTO DE ESPACIO DE TRABAJO: Bajo ninguna circunstancia el agente debe salir de la carpeta pago-compartido-pro para leer o modificar código. Cualquier intento de referenciar o auditar proyectos externos (como CIVI, SaciSoft o EnRuta) está estrictamente prohibido al trabajar en este repositorio.**

# PROYECTO: SAAS FACTORY (Gemini Context)

## 🎯 Principios de Ingeniería
- **Feature-First**: Todo código relacionado con una funcionalidad vive en `src/features/[nombre]`.
- **KISS**: Manténlo simple. Usa Server Actions de Next.js en lugar de APIs complejas si no es necesario.
- **Strict Types**: TypeScript es obligatorio, no opcional.

## 🏗️ Stack Tecnológico
- **Frontend**: Next.js 15 (App Router).
- **Estilos**: Tailwind CSS + Lucide React.
- **Backend**: Supabase + Next.js Server Actions.
- **Deploy**: Vercel.

## 🤖 Comandos Antigravity
- `/primer`: Lee este archivo y resume el estado.
- `/generar-prp`: Crea un plan detallado antes de codificar.
- `/bucle-agentico`: Implementa, prueba y verifica.
