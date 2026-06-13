'use client';
// components/ClientEntry.tsx
// Client Component that holds the dynamic import with ssr: false
// This is required in Next.js 16 + Turbopack — ssr:false cannot live in Server Components.

import dynamic from 'next/dynamic';

const TitaniumLanding = dynamic(
  () => import('./TitaniumLanding'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: '100vh', background: '#050505',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          {/* Titanium logo mark */}
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #7B4FFF, #00F5FF)',
            boxShadow: '0 0 20px rgba(123,79,255,0.4)',
            animation: 'pulse 1.2s ease-in-out infinite alternate',
          }} />
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(242,242,242,0.2)',
                         textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
            Cargando…
          </span>
        </div>
      </div>
    ),
  }
);

export default function ClientEntry() {
  return <TitaniumLanding />;
}
