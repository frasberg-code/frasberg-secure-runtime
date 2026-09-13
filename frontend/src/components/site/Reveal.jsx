import { motion } from "framer-motion";

export default function Reveal({ children, delay = 0, y = 28, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Overline({ children, className = "" }) {
  return (
    <span className={`font-mono text-[15px] uppercase tracking-[0.28em] text-lux-accent ${className}`}>
      {children}
    </span>
  );
}
