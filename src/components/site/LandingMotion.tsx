'use client';

import { useEffect } from 'react';
import './landing-motion.css';

/** Progressive enhancement: content is visible before JS and with reduced motion. */
export default function LandingMotion() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || !('IntersectionObserver' in window)) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          animations.push(
            entry.target.animate(
              [
                { opacity: 0.35, transform: 'translateY(12px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' }
            )
          );
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );
    document
      .querySelectorAll(
        '.next-public .public-section-heading, .next-public .studio-heading, .next-public .chapter-closing .public-container'
      )
      .forEach((element) => observer.observe(element));
    const stop = () => {
      if (preference.matches) {
        observer.disconnect();
        animations.forEach((animation) => animation.cancel());
      }
    };
    preference.addEventListener('change', stop);
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener('change', stop);
    };
  }, []);
  return null;
}
