'use client';
// components/TitaniumLanding.tsx — Root client orchestrator
// Imported via dynamic({ ssr: false }) from app/page.tsx to prevent WebGL SSR errors

import { useState } from 'react';
import MagneticCursor    from './MagneticCursor';
import NavBar            from './NavBar';
import ParticleBackground from './ParticleBackground';
import HeroSection       from './HeroSection';
import EcosystemSection  from './EcosystemSection';
import ClosingSection    from './ClosingSection';

export default function TitaniumLanding() {
  const [mode, setMode] = useState<'field' | 'converge'>('field');

  return (
    <main style={{ position: 'relative', minHeight: '100vh', background: '#050505', overflowX: 'hidden' }}>
      {/* z-0 — Fixed WebGL background */}
      <ParticleBackground mode={mode} />

      {/* z-9999 — Custom cursor */}
      <MagneticCursor />

      {/* z-50 — Navigation */}
      <NavBar />

      {/* z-10 — Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <HeroSection />

        <div style={{ height: 1, margin: '0 80px',
                      background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.05),transparent)' }} />

        <EcosystemSection />

        <div style={{ height: 1, margin: '0 80px',
                      background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.05),transparent)' }} />

        {/* When ClosingSection enters view, switch particles to converge mode */}
        <ClosingSection onConverge={active => setMode(active ? 'converge' : 'field')} />
      </div>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 10,
                       borderTop: '1px solid rgba(255,255,255,0.04)',
                       padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5,
                          background: 'linear-gradient(135deg,#7B4FFF,#00F5FF)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
                           textTransform: 'uppercase', color: 'rgba(242,242,242,0.45)' }}>
              Titanium OS
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', color: 'rgba(242,242,242,0.18)', letterSpacing: '0.05em' }}>
            © 2040 TresApps · Todos los derechos reservados
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidad', 'Términos', 'Contacto'].map(link => (
              <a key={link} href="#"
                 style={{ fontSize: '0.62rem', color: 'rgba(242,242,242,0.22)',
                          textDecoration: 'none', letterSpacing: '0.07em', transition: 'color 0.2s' }}
                 onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(242,242,242,0.65)'; }}
                 onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(242,242,242,0.22)'; }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
