import React from "react";
import { motion, HTMLMotionProps, Variants } from "framer-motion";

type CubicBezier = [number, number, number, number];

interface ScrollRevealProps extends Omit<HTMLMotionProps<"div">, "initial" | "whileInView" | "viewport" | "transition"> {
  delay?: number;
  children: React.ReactNode;
  className?: string;
  /** Set to true to reveal with a subtle upward fade */
  slideUp?: boolean;
}

/** Wraps any content with a scroll-triggered fade-up reveal (fires once). */
export function ScrollReveal({ children, delay = 0, className = "", slideUp = true, ...props }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: slideUp ? 28 : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const spring: CubicBezier = [0.22, 1, 0.36, 1];

/** Stagger container — direct children animate in sequence */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Individual item variant for stagger children */
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.45, ease: spring } },
};
