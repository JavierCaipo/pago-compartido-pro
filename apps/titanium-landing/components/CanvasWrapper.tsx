"use client";

import { Canvas } from "@react-three/fiber";
import ParticleBackground from "./ParticleBackground";

export default function CanvasWrapper() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#09090b]">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ParticleBackground />
      </Canvas>
    </div>
  );
}
