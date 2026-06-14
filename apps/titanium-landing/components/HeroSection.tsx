"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface HeroSectionProps {
  onOpenConcierge?: () => void;
}

export default function HeroSection({ onOpenConcierge }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section
      ref={containerRef}
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        position: "relative",
      }}
    >
      <motion.div
        style={{ opacity, y, textAlign: "center", maxWidth: 820, margin: "0 auto" }}
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 28 }}
        >
          <span
            className="ti-eyebrow"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              borderRadius: 100,
              border: "1px solid rgba(123,79,255,0.3)",
              background: "rgba(123,79,255,0.08)",
              backdropFilter: "blur(12px)",
              color: "var(--ti-cyan)",
            }}
          >
            Ecosistema B2B2C · Visión 2040
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: 28,
            color: "var(--ti-text-primary)",
          }}
        >
          El sistema operativo <br />
          <span className="ti-gradient-violet" style={{ filter: "drop-shadow(0 0 32px rgba(123,79,255,0.35))" }}>
            de la hospitalidad
          </span>
        </motion.h1>

        {/* Subhead — valor real, no jerga técnica */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--ti-text-secondary)",
            maxWidth: 600,
            margin: "0 auto 52px",
            fontWeight: 300,
            lineHeight: 1.75,
          }}
        >
          Diseñado para restauradores de élite que exigen rentabilidad máxima, 
          experiencias memorables y una operación sin fricciones — en cada turno.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}
        >
          <a
            href="#ecosystem"
            className="ti-btn-holo"
            style={{ fontSize: "0.85rem", padding: "18px 44px" }}
          >
            Explorar el ecosistema
          </a>
          <button
            onClick={onOpenConcierge}
            className="ti-btn-outline"
            style={{ 
              fontSize: "0.8rem", 
              padding: "16px 36px",
              background: "none",
              cursor: "pointer",
            }}
          >
            Acceder a Titanium OS
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 26,
          height: 42,
          borderRadius: 100,
          border: "1px solid var(--ti-glass-border)",
          display: "flex",
          justifyContent: "center",
          padding: "6px 0",
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--ti-violet)",
            boxShadow: "0 0 8px var(--ti-violet)",
          }}
        />
      </motion.div>
    </section>
  );
}
