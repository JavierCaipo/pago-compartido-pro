"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const LINKS = [
  { label: "Política de Privacidad", href: "#" },
  { label: "Términos de Servicio", href: "#" },
  { label: "Contacto", href: "mailto:hola@tresapps.app" },
];

const COUNTRIES = [
  { name: "México", flag: "🇲🇽" },
  { name: "España", flag: "🇪🇸" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Perú", flag: "🇵🇪" },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      style={{
        backgroundColor: "var(--ti-surface)",
        borderTop: "1px solid var(--ti-glass-border)",
        padding: "64px 48px 40px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 48,
          alignItems: "start",
        }}
      >
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg, var(--ti-violet) 0%, var(--ti-cyan) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ti-text-primary)" }}>
              Titanium OS
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--ti-text-muted)", maxWidth: 340, lineHeight: 1.7, marginBottom: 24 }}>
            Plataforma de gestión hospitalaria de próxima generación. Diseñada para redefinir la excelencia operativa.
          </p>
          {/* Countries */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {COUNTRIES.map((c) => (
              <span
                key={c.name}
                title={c.name}
                style={{
                  fontSize: "1.1rem",
                  opacity: 0.7,
                  cursor: "default",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLSpanElement).style.opacity = "1")}
                onMouseLeave={e => ((e.currentTarget as HTMLSpanElement).style.opacity = "0.7")}
              >
                {c.flag}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}>
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              style={{
                fontSize: "0.72rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ti-text-muted)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--ti-text-secondary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--ti-text-muted)")}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Copyright */}
      <div
        style={{
          maxWidth: 1280,
          margin: "48px auto 0",
          paddingTop: 24,
          borderTop: "1px solid var(--ti-glass-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <p style={{ fontSize: "0.7rem", color: "var(--ti-text-muted)", letterSpacing: "0.04em" }}>
          © {new Date().getFullYear()} TresApps. Todos los derechos reservados.
        </p>
        <p style={{ fontSize: "0.7rem", color: "var(--ti-text-muted)", letterSpacing: "0.04em" }}>
          Hecho con precisión · Visión 2040
        </p>
      </div>
    </motion.footer>
  );
}
