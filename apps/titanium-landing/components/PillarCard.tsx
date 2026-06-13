"use client";

import { motion } from "framer-motion";

interface PillarCardProps {
  eyebrow: string;
  title: string;
  description: string;
  url: string;
  index: number;
  accentColor: string;
}

export default function PillarCard({ eyebrow, title, description, url, index, accentColor }: PillarCardProps) {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8 }}
      style={{
        display: "block",
        textDecoration: "none",
        position: "relative",
        borderRadius: 28,
        padding: 1,
        background: `linear-gradient(160deg, ${accentColor}30 0%, transparent 60%)`,
        transition: "box-shadow 0.4s ease",
        boxShadow: "0 0 0 transparent",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 60px ${accentColor}18, 0 32px 64px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 0 transparent";
      }}
    >
      {/* Inner card */}
      <div
        style={{
          height: "100%",
          background: "var(--ti-surface)",
          borderRadius: 27,
          padding: "40px 36px 44px",
          border: "1px solid var(--ti-glass-border)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 0.4s ease",
        }}
      >
        {/* Subtle radial glow in corner */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Eyebrow */}
        <span
          className="ti-eyebrow"
          style={{
            display: "inline-block",
            marginBottom: 28,
            padding: "6px 14px",
            borderRadius: 100,
            border: `1px solid ${accentColor}40`,
            background: `${accentColor}12`,
            color: accentColor,
            fontSize: "0.6rem",
          }}
        >
          {eyebrow}
        </span>

        {/* Title */}
        <h3
          style={{
            fontSize: "1.65rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--ti-text-primary)",
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--ti-text-secondary)",
            lineHeight: 1.75,
            fontWeight: 300,
            flexGrow: 1,
            marginBottom: 36,
          }}
        >
          {description}
        </p>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: accentColor,
            borderTop: "1px solid var(--ti-glass-border)",
            paddingTop: 24,
          }}
        >
          <span>Abrir portal</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </motion.a>
  );
}
