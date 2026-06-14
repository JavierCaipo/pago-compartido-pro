"use client";

import dynamic from "next/dynamic";
import NavBar from "../components/NavBar";
import HeroSection from "../components/HeroSection";
import EcosystemSection from "../components/EcosystemSection";
import Footer from "../components/Footer";

const CanvasWrapper = dynamic(() => import("../components/CanvasWrapper"), { ssr: false });

import { useState } from "react";
import AiConciergeModal from "../components/AiConciergeModal";

export const ADVISORS = [
  {
    name: "Alex",
    role: "Especialista en Éxito",
    photoUrl: "/images/advisors/alex.jpg",
    prompt: `Eres Alex, un Consultor de Éxito de Titanium OS con años de experiencia en la industria restaurantera. Conoces de primera mano los dolores de gestionar un restaurante: el caos de los turnos, los no-shows, el margen apretado, el equipo que rota constantemente. Hablas desde esa experiencia real.

Tu tono es amical, extrovertido, empático y muy profesional. Como un colega de confianza que también sabe de negocios. Nada robótico, nada de frases de ventas genéricas.`
  },
  {
    name: "Martín",
    role: "Senior Operations Advisor",
    photoUrl: "/images/advisors/martin.jpg",
    prompt: `Eres Martín, un Senior Operations Advisor de Titanium OS. Eres directo, experto en costos y estás obsesionado con la eficiencia operativa del salón, la cocina y la waitlist. Has optimizado cientos de cocinas.

Tu tono es seguro, al grano, analítico pero amigable. Entiendes que en un restaurante cada segundo y cada centavo cuentan.`
  },
  {
    name: "Sofía",
    role: "Brand & CX Consultant",
    photoUrl: "/images/advisors/sofia.jpg",
    prompt: `Eres Sofía, una Brand & CX Consultant de Titanium OS. Eres muy extrovertida, apasionada por la experiencia del cliente (CX), enfocada en marketing, gestión de reservas y cómo el feedback de los comensales puede transformar una marca.

Tu tono es vibrante, inspirador y muy empático. Ayudas a los restaurantes a ver que cada plato servido es una oportunidad de fidelización.`
  }
];

export default function LandingClient() {
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [conciergeContext, setConciergeContext] = useState("");
  const [selectedAdvisor, setSelectedAdvisor] = useState(ADVISORS[0]);

  const openConcierge = (context: string) => {
    setConciergeContext(context);
    const randomAdvisor = ADVISORS[Math.floor(Math.random() * ADVISORS.length)];
    setSelectedAdvisor(randomAdvisor);
    setIsConciergeOpen(true);
  };

  const handleTransferAdvisor = (targetAdvisor: string) => {
    const nextAdvisor = ADVISORS.find((a) => a.name === targetAdvisor) || ADVISORS[0];
    setSelectedAdvisor(nextAdvisor);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "var(--ti-bg)",
        color: "var(--ti-text-primary)",
        overflowX: "hidden",
      }}
    >
      {/* Fixed 3D particle field */}
      <CanvasWrapper />

      {/* AI Concierge Modal */}
      <AiConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        context={conciergeContext}
        advisorName={selectedAdvisor.name}
        advisorRole={selectedAdvisor.role}
        advisorPhotoUrl={selectedAdvisor.photoUrl}
        customSystemPrompt={selectedAdvisor.prompt}
        onTransferAdvisor={handleTransferAdvisor}
      />

      {/* All page content above the canvas */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <NavBar onOpenConcierge={() => openConcierge("Menú de Navegación")} />
        <HeroSection onOpenConcierge={() => openConcierge("Hero CTA")} />
        <EcosystemSection onOpenConcierge={openConcierge} />
        <Footer />
      </div>
    </div>
  );
}
