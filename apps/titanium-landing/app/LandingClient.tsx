"use client";

import dynamic from "next/dynamic";
import NavBar from "../components/NavBar";
import HeroSection from "../components/HeroSection";
import EcosystemSection from "../components/EcosystemSection";
import Footer from "../components/Footer";

const CanvasWrapper = dynamic(() => import("../components/CanvasWrapper"), { ssr: false });

export default function LandingClient() {
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

      {/* All page content above the canvas */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <NavBar />
        <HeroSection />
        <EcosystemSection />
        <Footer />
      </div>
    </div>
  );
}
