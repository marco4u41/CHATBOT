import { useState } from "react";
import { useGarageStore } from "@/stores/garageStore";
import { compareVehicles } from "@/api/conversations";
import { cn } from "@/utils/cn";

export function GarageSidebar() {
  const { vehicles, isOpen, toggleSidebar, removeFromGarage, clearGarage } =
    useGarageStore();
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);

  async function handleCompare() {
    if (vehicles.length < 2) return;
    setIsComparing(true);
    setComparisonResult(null);

    const response = await compareVehicles({
      vehicles: vehicles.map((v) => ({
        brand: v.brand,
        model: v.model,
        year: v.year,
        engine: v.engine,
        transmission: v.transmission,
        fuel_type: v.fuel_type,
        price_usd: v.price_usd,
      })),
      focus: "all",
    });

    if (response.success && response.data) {
      setComparisonResult(response.data.response);
    }
    setIsComparing(false);
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed right-4 top-4 z-50 rounded-xl p-2.5 transition-all duration-300",
          "liquid-glass-panel-dense",
          isOpen
            ? "text-neon-orange"
            : "text-white/60 hover:text-neon-orange",
        )}
        aria-label={isOpen ? "Cerrar garaje" : "Abrir garaje"}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21a.75.75 0 0 0 .75-.75V11.25a3 3 0 0 0-3-3h-1.5l-1.72-4.575A1.5 1.5 0 0 0 13.07 2.25H10.93a1.5 1.5 0 0 0-1.43 1.025L7.78 7.875H6.25a3 3 0 0 0-3 3v6.75c0 .621.504 1.125 1.125 1.125h.75"
          />
        </svg>
        {vehicles.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-neon-orange text-[10px] font-bold text-black flex items-center justify-center">
            {vehicles.length}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-80 flex flex-col",
          "liquid-glass-panel border-l border-white/10",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Garaje Virtual
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {vehicles.length}/10 vehículos
            </p>
          </div>
          <button
            onClick={toggleSidebar}
            className="skeuo-button rounded-lg p-1.5 text-white/50 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21" />
                </svg>
              </div>
              <p className="text-xs text-white/30">
                Añade vehículos desde las tarjetas de recomendación
              </p>
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="liquid-glass-panel-dense rounded-xl p-3 animate-scale-glass"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="text-xs text-white/40 font-mono">{vehicle.year}</p>
                  </div>
                  <button
                    onClick={() => removeFromGarage(vehicle.id)}
                    className="text-white/20 hover:text-neon-red transition-colors p-1 rounded-lg hover:bg-white/5 shrink-0"
                    aria-label={`Eliminar ${vehicle.brand} ${vehicle.model}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {vehicle.engine && (
                    <span className="glass-badge rounded-full px-2 py-0.5 text-[10px] text-white/50">
                      {vehicle.engine}
                    </span>
                  )}
                  {vehicle.fuel_type && (
                    <span className="glass-badge rounded-full px-2 py-0.5 text-[10px] text-white/50">
                      {vehicle.fuel_type}
                    </span>
                  )}
                  {vehicle.price_usd != null && (
                    <span className="glass-badge rounded-full px-2 py-0.5 text-[10px] text-neon-green">
                      ${vehicle.price_usd.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {vehicles.length > 0 && (
          <div className="p-3 border-t border-white/8 space-y-2">
            <button
              onClick={handleCompare}
              disabled={vehicles.length < 2 || isComparing}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                vehicles.length >= 2 && !isComparing
                  ? "neon-button-orange text-neon-orange"
                  : "skeuo-button text-white/30 cursor-not-allowed",
              )}
            >
              {isComparing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Comparando...
                </span>
              ) : (
                `Comparar en Consola (${vehicles.length})`
              )}
            </button>
            <button
              onClick={clearGarage}
              className="w-full rounded-xl px-4 py-2 text-xs text-white/30 hover:text-neon-red transition-colors"
            >
              Vaciar garaje
            </button>
          </div>
        )}

        {/* Inline Comparison Result */}
        {comparisonResult && (
          <div className="p-3 border-t border-white/8 max-h-[40vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-neon-orange uppercase tracking-wider">
                Resultado
              </h3>
              <button
                onClick={() => setComparisonResult(null)}
                className="text-white/30 hover:text-white text-xs"
              >
                Cerrar
              </button>
            </div>
            <div className="message-content text-xs text-white/70 leading-relaxed">
              {comparisonResult}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
