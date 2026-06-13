"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function NavBar() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 40) {
        nav.classList.add("nav--scrolled");
      } else {
        nav.classList.remove("nav--scrolled");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      ref={navRef}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 48px",
        transition: "background 0.4s ease, backdrop-filter 0.4s ease, border-bottom-color 0.4s ease",
        borderBottom: "1px solid transparent",
      }}
      className="ti-nav"
    >
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--ti-violet) 0%, var(--ti-cyan) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px var(--ti-violet-glow)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ti-text-primary)",
          }}
        >
          Titanium OS
        </span>
      </Link>

      {/* Nav Right */}
      <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link
          href="https://titanium.tresapps.app/login"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ti-text-secondary)",
            textDecoration: "none",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--ti-text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--ti-text-secondary)")}
        >
          Soporte
        </Link>
        <Link
          href="https://titanium.tresapps.app/login"
          target="_blank"
          rel="noopener noreferrer"
          className="ti-btn-outline"
          style={{ fontSize: "0.7rem", padding: "8px 20px" }}
        >
          Acceder →
        </Link>
      </nav>

      <style>{`
        .ti-nav.nav--scrolled {
          background: rgba(5, 5, 5, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom-color: var(--ti-glass-border);
        }
      `}</style>
    </motion.header>
  );
}
