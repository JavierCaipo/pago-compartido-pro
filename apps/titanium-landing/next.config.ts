import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack es default en Next.js 16 — configuración limpia sin webpack override
  // Los módulos de Three.js se importan con dynamic({ ssr: false }) desde page.tsx
  // lo que hace innecesaria cualquier externalización manual de servidor.
  turbopack: {},

  // Transpile Three.js ecosystem para evitar problemas de ESM
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],

  // Silenciar warnings de módulos de Three.js con caracteres especiales
  serverExternalPackages: [],
};

export default nextConfig;
