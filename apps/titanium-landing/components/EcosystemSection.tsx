"use client";

import { motion } from "framer-motion";
import PillarCard from "./PillarCard";

const pillars = [
  {
    eyebrow: "Consumidor · Reservas B2C",
    title: "Llena cada mesa, cada noche",
    description: "Tus clientes reservan, dividen el pago y llegan al restaurante sin fricción. Menos no-shows, más satisfacción y fidelización desde el primer contacto.",
    url: "https://reservas.tresapps.app",
    accentColor: "#00F5FF",
  },
  {
    eyebrow: "Operación · Punto de Venta",
    title: "Control total en tiempo real",
    description: "Gestiona mesas, comandas y turnos desde un solo lugar. Tu equipo trabaja más rápido, comete menos errores y tú ves el pulso del negocio en vivo.",
    url: "https://pos.tresapps.app",
    accentColor: "#7B4FFF",
  },
  {
    eyebrow: "Estrategia · Titanium OS",
    title: "Maximiza tu rentabilidad",
    description: "El cerebro estratégico del ecosistema. Yield management dinámico, predicción de rotación de mesas y analytics que convierten datos en decisiones rentables.",
    url: "https://titanium.tresapps.app/login",
    accentColor: "#C9A84C",
  },
];

interface EcosystemSectionProps {
  onOpenConcierge?: (context: string) => void;
}

export default function EcosystemSection({ onOpenConcierge }: EcosystemSectionProps) {
  return (
    <section id="ecosystem" style={{ padding: "160px 48px 180px", position: "relative", zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", marginBottom: 80 }}
        >
          <span
            className="ti-eyebrow"
            style={{ display: "block", marginBottom: 20 }}
          >
            Tres pilares · Un ecosistema
          </span>
          <h2
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--ti-text-primary)",
              marginBottom: 20,
              lineHeight: 1.1,
            }}
          >
            Un ecosistema unificado que maximiza<br />
            <span className="ti-gradient-violet">
              tu rentabilidad
            </span>
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--ti-text-secondary)",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.75,
              fontWeight: 300,
            }}
          >
            y redefine la hospitalidad operativa. Cada pilar potencia al siguiente, 
            creando un volante de eficiencia que crece contigo.
          </p>
        </motion.div>

        {/* Cards grid — centered */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 32,
            justifyContent: "center",
          }}
        >
          {pillars.map((pillar, i) => (
            <PillarCard
              key={pillar.url}
              index={i}
              eyebrow={pillar.eyebrow}
              title={pillar.title}
              description={pillar.description}
              url={pillar.url}
              accentColor={pillar.accentColor}
              onOpenConcierge={onOpenConcierge}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
