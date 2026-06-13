import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Titanium OS — El Futuro de la Hospitalidad",
  description:
    "Titanium OS es el sistema nervioso central de los restaurantes de élite del mañana. Ecosistema SaaS B2B2C para gestión de restaurantes de alta gama.",
  keywords: ["restaurante", "SaaS", "gestión", "hospitality", "POS", "B2B2C", "reservas"],
  openGraph: {
    title: "Titanium OS — El Futuro de la Hospitalidad",
    description:
      "Titanium OS conecta al Comensal, Staff y Management en una arquitectura Multi-Tenant diseñada para el 2040.",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Titanium OS — El Futuro de la Hospitalidad",
    description: "El sistema nervioso central de los restaurantes de élite del mañana.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#050505',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
