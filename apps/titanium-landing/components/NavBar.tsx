"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface NavBarProps {
  onOpenConcierge?: () => void;
}

export default function NavBar({ onOpenConcierge }: NavBarProps) {
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
            width: 48,
            height: 48,
            borderRadius: 10,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px var(--ti-violet-glow)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <Image
            src="/logo.png"
            alt="Titanium Logo"
            fill
            sizes="48px"
            loading="eager"
            style={{ objectFit: "cover" }}
          />
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
        <button
          onClick={onOpenConcierge}
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ti-text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--ti-text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--ti-text-secondary)")}
        >
          Soporte
        </button>
        <button
          onClick={onOpenConcierge}
          className="ti-btn-outline"
          style={{ 
            fontSize: "0.7rem", 
            padding: "8px 20px",
            background: "none",
            cursor: "pointer",
          }}
        >
          Acceder →
        </button>
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
