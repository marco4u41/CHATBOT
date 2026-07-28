import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  SlidersHorizontal,
  Gauge,
  Mountain,
  DollarSign,
  X,
} from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/utils/cn";

const engineTypes = [
  { value: "gasolina", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "electrico", label: "Eléctrico" },
  { value: "hibrido", label: "Híbrido" },
];

const terrainTypes = [
  { value: "ciudad", label: "Ciudad" },
  { value: "carretera", label: "Carretera" },
  { value: "offroad", label: "Off-Road" },
  { value: "mixto", label: "Mixto" },
];

export default function PhysicalPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { physicalFilters, setPhysicalFilters } = useChatStore();

  const hasFilters =
    physicalFilters.budget ||
    physicalFilters.terrain ||
    physicalFilters.engine_type;

  const clearFilters = () => {
    setPhysicalFilters({});
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-24 right-6 z-40 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all",
          isOpen
            ? "bg-ax-wine/30 border border-ax-wine/30 text-[var(--ax-text)]"
            : "ax-platinum-btn text-[var(--ax-text-muted)] hover:text-[var(--ax-text)]"
        )}
        title="Filtros físicos"
      >
        <SlidersHorizontal className="w-5 h-5" />
        {hasFilters && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-ax-gold/80 border-2 border-[var(--ax-bg)]" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-40 right-6 z-50 w-72 ax-glass rounded-2xl p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="ax-text-label text-[var(--ax-text-secondary)]">Filtros Físicos</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)] hover:bg-[var(--ax-glass-highlight)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Engine Type */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-xs text-[var(--ax-text-muted)] mb-2">
                  <Gauge className="w-3.5 h-3.5" />
                  Tipo de Motor
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {engineTypes.map((et) => (
                    <button
                      key={et.value}
                      onClick={() =>
                        setPhysicalFilters({
                          engine_type: physicalFilters.engine_type === et.value ? undefined : et.value,
                        })
                      }
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        physicalFilters.engine_type === et.value
                          ? "bg-ax-wine/20 border border-ax-wine/30 text-[var(--ax-text)]"
                          : "bg-[var(--ax-glass-highlight)] border border-transparent text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)] hover:bg-[var(--ax-glass-bg-light)]"
                      )}
                    >
                      {et.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terrain */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-xs text-[var(--ax-text-muted)] mb-2">
                  <Mountain className="w-3.5 h-3.5" />
                  Terreno
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {terrainTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() =>
                        setPhysicalFilters({
                          terrain: physicalFilters.terrain === t.value ? undefined : t.value,
                        })
                      }
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        physicalFilters.terrain === t.value
                          ? "bg-ax-wine/20 border border-ax-wine/30 text-[var(--ax-text)]"
                          : "bg-[var(--ax-glass-highlight)] border border-transparent text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)] hover:bg-[var(--ax-glass-bg-light)]"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-xs text-[var(--ax-text-muted)] mb-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Presupuesto (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ax-text-muted)] pointer-events-none select-none">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="25,000"
                    value={physicalFilters.budget ? physicalFilters.budget.toLocaleString("en-US") : ""}
                    aria-label="Presupuesto en dólares"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setPhysicalFilters({ budget: raw ? Number(raw) : undefined });
                    }}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[var(--ax-input-bg)] border border-[var(--ax-glass-border)] text-sm text-[var(--ax-text)] placeholder:text-[var(--ax-text-muted)] outline-none focus:border-ax-wine/30 focus:ring-1 focus:ring-ax-wine/20 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2.5 rounded-xl bg-[var(--ax-glass-highlight)] border border-[var(--ax-glass-border)] text-xs text-[var(--ax-text-secondary)] hover:text-[var(--ax-text)] hover:bg-[var(--ax-glass-bg-light)] transition-all"
                >
                  Limpiar filtros
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
