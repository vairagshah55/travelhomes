import React from "react";
import { motion } from "framer-motion";

interface MotionRevealProps {
  children: React.ReactNode;
  /** Stagger offset in seconds (e.g. index * 0.06) for a cascading entrance. */
  delay?: number;
  className?: string;
}

/**
 * Admin entrance reveal — fade + rise, triggered when the block scrolls into
 * view (once). Wrap top-level page sections/cards so every admin page shares one
 * choreographed entrance. `prefers-reduced-motion` is honored globally via the
 * <MotionConfig reducedMotion="user"> in AdminLayout, so no per-page guard needed.
 *
 * Usage:
 *   <MotionReveal delay={i * 0.06}>{card}</MotionReveal>
 */
export function MotionReveal({ children, delay = 0, className = "" }: MotionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default MotionReveal;
