import type { Metadata } from "next";
import "./globals.css"; // <--- ESTA LÍNEA ES CRÍTICA

export const metadata: Metadata = {
  title: "Pago Compartido AI",
  description: "Divide tus cuentas de restaurante con IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#0a0a0a] text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}