import React, { useState, useEffect, useCallback } from 'react';
import logoImg from '../../assets/logo.png';

interface CurtainIntroProps {
  /** Optional callback when the curtain animation completely finishes */
  onComplete?: () => void;
  /** Force animation to run even in test environments */
  forceShow?: boolean;
}

export const CurtainIntro: React.FC<CurtainIntroProps> = ({ onComplete, forceShow = false }) => {
  // Check test or reduced motion preferences
  const isReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isTest = !forceShow && typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  const [phase, setPhase] = useState<'enter' | 'reveal' | 'done'>(() => {
    if (isTest || isReducedMotion) return 'done';
    return 'enter';
  });
  const [logoReady, setLogoReady] = useState(false);

  const handleSkip = useCallback(() => {
    setLogoReady(true);
    setPhase('reveal');
    const timer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 450);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (isTest || isReducedMotion) {
      onComplete?.();
      return;
    }

    // Step 0: Trigger smooth clean entrance right after mount
    const enterTimer = setTimeout(() => {
      setLogoReady(true);
    }, 40);

    // Step 1: Hold logo in center, then trigger curtain opening
    const revealTimer = setTimeout(() => {
      setPhase('reveal');
    }, 950);

    // Step 2: Complete and unmount from DOM
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 1850);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(revealTimer);
      clearTimeout(doneTimer);
    };
  }, [isTest, isReducedMotion, onComplete]);

  // Once completed, unmount completely to release resources and allow 100% interactivity
  if (phase === 'done') {
    return null;
  }

  const isRevealing = phase === 'reveal';

  // Clean, high-end motion profile for the logo
  const getLogoStyle = (): React.CSSProperties => {
    if (isRevealing) {
      return {
        opacity: 0,
        transform: 'scale(1.06) translate3d(0, -8px, 0)',
        transition: 'opacity 500ms cubic-bezier(0.85, 0, 0.15, 1), transform 500ms cubic-bezier(0.85, 0, 0.15, 1)',
      };
    }
    if (logoReady) {
      return {
        opacity: 1,
        transform: 'scale(1) translate3d(0, 0, 0)',
        transition: 'opacity 550ms cubic-bezier(0.16, 1, 0.3, 1), transform 550ms cubic-bezier(0.16, 1, 0.3, 1)',
      };
    }
    return {
      opacity: 0,
      transform: 'scale(0.92) translate3d(0, 12px, 0)',
      transition: 'none',
    };
  };

  return (
    <div
      role="dialog"
      aria-label="Presentación Supermercado Osos"
      aria-modal="true"
      onClick={handleSkip}
      className="fixed inset-0 z-50 overflow-hidden cursor-pointer select-none"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Top Curtain Panel (Slides upward) - BLANCO */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 bg-white transition-transform duration-900 ease-[cubic-bezier(0.85,0,0.15,1)]"
        style={{
          transform: isRevealing ? 'translate3d(0, -100%, 0)' : 'translate3d(0, 0, 0)',
        }}
      />

      {/* Bottom Curtain Panel (Slides downward) - BLANCO */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-white transition-transform duration-900 ease-[cubic-bezier(0.85,0,0.15,1)]"
        style={{
          transform: isRevealing ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)',
        }}
      />

      {/* Perfectly Centered Synchronized Brand Logo con Animación Clean de Entrada */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4"
        style={getLogoStyle()}
      >
        <img
          src={logoImg}
          alt="Supermercado Osos"
          className="w-48 sm:w-64 md:w-80 max-w-[85vw] h-auto object-contain select-none"
        />
      </div>
    </div>
  );
};

export default CurtainIntro;
