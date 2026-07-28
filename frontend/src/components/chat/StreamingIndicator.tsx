import { motion } from "motion/react";

export default function StreamingIndicator() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="w-5 h-5 rounded-md bg-ax-gold/15 flex items-center justify-center border border-ax-gold/20">
        <span className="text-[10px] font-bold text-ax-gold/80">AE</span>
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-ax-steel/50"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <span className="ax-text-label text-ax-gold/55">Pensando...</span>
    </div>
  );
}
