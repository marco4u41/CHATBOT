import { useState } from "react";
import { useChatStore } from "@/stores/chatStore";
import { TERRAIN_TYPES, ENGINE_TYPES } from "@/config/constants";
import { cn } from "@/utils/cn";

export function PhysicalPanel() {
  const { physicalFilters, setPhysicalFilters, clearPhysicalFilters } =
    useChatStore();
  const [isOpen, setIsOpen] = useState(false);

  const hasFilters =
    physicalFilters.budget != null ||
    physicalFilters.terrain != null ||
    physicalFilters.engine_type != null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "skeuo-button rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 flex items-center gap-2",
          hasFilters
            ? "text-neon-orange border-neon-orange/30"
            : "text-white/40 hover:text-white/60",
        )}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        Panel Físico
        {hasFilters && (
          <span className="w-1.5 h-1.5 rounded-full bg-neon-orange animate-glow-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 animate-scale-glass">
          <div className="liquid-glass-panel rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Filtros del Panel
              </h3>
              {hasFilters && (
                <button
                  onClick={clearPhysicalFilters}
                  className="text-[10px] text-neon-red/60 hover:text-neon-red transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Budget */}
            <div>
              <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
                Presupuesto (USD)
              </label>
              <input
                type="number"
                value={physicalFilters.budget ?? ""}
                onChange={(e) =>
                  setPhysicalFilters({
                    ...physicalFilters,
                    budget: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Ej: 25000"
                className="w-full glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
              />
            </div>

            {/* Terrain */}
            <div>
              <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
                Tipo de Terreno
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TERRAIN_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() =>
                      setPhysicalFilters({
                        ...physicalFilters,
                        terrain: physicalFilters.terrain === t.value ? undefined : t.value,
                      })
                    }
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all duration-150",
                      physicalFilters.terrain === t.value
                        ? "neon-button text-neon-blue"
                        : "skeuo-button text-white/35 hover:text-white/60",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Engine Type */}
            <div>
              <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
                Tipo de Motor
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ENGINE_TYPES.map((e) => (
                  <button
                    key={e.value}
                    onClick={() =>
                      setPhysicalFilters({
                        ...physicalFilters,
                        engine_type:
                          physicalFilters.engine_type === e.value ? undefined : e.value,
                      })
                    }
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all duration-150",
                      physicalFilters.engine_type === e.value
                        ? "neon-button text-neon-blue"
                        : "skeuo-button text-white/35 hover:text-white/60",
                    )}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
