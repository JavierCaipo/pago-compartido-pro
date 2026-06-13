'use client';
// components/MagneticCursor.tsx — Custom spring-physics cursor
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function MagneticCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const springCfg = { damping: 22, stiffness: 280, mass: 0.6 };
  const smoothX = useSpring(cursorX, springCfg);
  const smoothY = useSpring(cursorY, springCfg);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('button') || t.closest('a') || t.closest('[data-cursor-hover]')) {
        setIsHovering(true);
      }
    };
    const out = () => setIsHovering(false);

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseover', over);
    document.addEventListener('mouseout', out);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mouseout', out);
    };
  }, [cursorX, cursorY, isVisible]);

  return (
    <>
      {/* Outer ring */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 9998,
          pointerEvents: 'none',
          borderRadius: '50%',
          border: `1px solid rgba(123,79,255,${isHovering ? 0.9 : 0.6})`,
        }}
        animate={{ width: isHovering ? 44 : 28, height: isHovering ? 44 : 28, opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Inner dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 9999,
          pointerEvents: 'none',
          borderRadius: '50%',
        }}
        animate={{
          width: isHovering ? 6 : 5,
          height: isHovering ? 6 : 5,
          opacity: isVisible ? 1 : 0,
          backgroundColor: isHovering ? '#00F5FF' : '#7B4FFF',
        }}
        transition={{ duration: 0.12 }}
      />
    </>
  );
}
