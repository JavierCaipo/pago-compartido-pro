'use client';
// components/ClosingSection.tsx — Closing CTA with particle convergence trigger
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props { onConverge?: (active: boolean) => void; }

export default function ClosingSection({ onConverge }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [sent, setSent]   = useState(false);
  const [focused, setFocused] = useState('');

  // Trigger particle convergence when section enters viewport
  useEffect(() => {
    if (!onConverge) return;
    const el = sectionRef.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => onConverge(entry.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onConverge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST a tu endpoint de Supabase, CRM o email API
    console.log('[Titanium OS] Demo request:', { name, email });
    setSent(true);
  };

  const inputCss = (field: string): React.CSSProperties => ({
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${focused === field ? 'rgba(123,79,255,0.55)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 12, padding: '16px 20px',
    fontSize: '0.9rem', color: '#F2F2F2', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? '0 0 0 3px rgba(123,79,255,0.12)' : 'none',
    fontFamily: 'inherit',
    backdropFilter: 'blur(8px)',
  });

  return (
    <section
      ref={sectionRef} id="closing"
      style={{ position: 'relative', zIndex: 10,
               padding: 'clamp(100px,15vw,180px) 24px', textAlign: 'center' }}
    >
      {/* Background radial glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    width: '60vw', height: '40vh', pointerEvents: 'none', zIndex: -1,
                    background: 'radial-gradient(ellipse,rgba(123,79,255,0.07) 0%,transparent 70%)' }} />

      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}
        >
          <div style={{ width: 32, height: 1, background: 'rgba(201,168,76,0.5)' }} />
          <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.22em',
                         textTransform: 'uppercase', color: '#C9A84C' }}>
            Únete a la red
          </span>
          <div style={{ width: 32, height: 1, background: 'rgba(201,168,76,0.5)' }} />
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 'clamp(2.4rem,6vw,4.2rem)', fontWeight: 900,
                   lineHeight: 1.08, letterSpacing: '-0.025em', marginBottom: 24 }}
        >
          <span className="ti-gradient-text">No operes</span>
          <br />
          <span style={{ background: 'linear-gradient(135deg,#7B4FFF 0%,#00F5FF 100%)',
                         WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            en el pasado.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: '1rem', lineHeight: 1.8, color: 'rgba(242,242,242,0.48)',
                   marginBottom: 52, fontWeight: 300 }}
        >
          Únete a la red Titanium. Solicita tu demo privada y descubre cómo el sistema
          nervioso central de los restaurantes de élite puede transformar tu operación.
        </motion.p>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {!sent ? (
            <form onSubmit={handleSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480, margin: '0 auto' }}>
              <input
                type="text" placeholder="Tu nombre o restaurante"
                value={name} onChange={e => setName(e.target.value)}
                onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                style={inputCss('name')}
              />
              <input
                type="email" placeholder="correo@turestaurante.com" required
                value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                style={inputCss('email')}
              />
              <button type="submit" className="ti-btn-holo"
                      style={{ width: '100%', justifyContent: 'center', padding: '18px 32px' }}>
                Solicitar Demo Privada
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M8 3L13 8L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <p style={{ fontSize: '0.64rem', color: 'rgba(242,242,242,0.22)', letterSpacing: '0.05em' }}>
                Sin compromiso · Respuesta en menos de 24 horas
              </p>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: '40px 48px', background: 'rgba(123,79,255,0.06)',
                       border: '1px solid rgba(123,79,255,0.2)', borderRadius: 20,
                       maxWidth: 480, margin: '0 auto' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>✦</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: '#F2F2F2' }}>
                Solicitud recibida
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(242,242,242,0.5)', lineHeight: 1.7 }}>
                El equipo Titanium se pondrá en contacto contigo en menos de 24 horas.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Social proof cities */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   gap: 32, flexWrap: 'wrap' }}
        >
          {['Lima', 'Ciudad de México', 'Bogotá', 'Santiago', 'Madrid'].map(city => (
            <span key={city} style={{ fontSize: '0.62rem', letterSpacing: '0.15em',
                                      color: 'rgba(242,242,242,0.2)', textTransform: 'uppercase' }}>
              {city}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
