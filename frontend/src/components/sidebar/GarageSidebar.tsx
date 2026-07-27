import { useState, useCallback } from "react";
import { useGarageStore } from "@/stores/garageStore";
import { VehicleComparisonModal } from "@/components/garage/VehicleComparisonModal";
import { translateSpec, formatPriceUSD, safeDisplay } from "@/utils/specNormalization";
import { cn } from "@/utils/cn";

export function GarageSidebar() {
  const {
    vehicles,
    isOpen,
    toggleSidebar,
    removeFromGarage,
    clearGarage,
    selectedIds,
    toggleSelection,
    clearSelection,
  } = useGarageStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedCount = selectedIds.length;
  const canCompare = selectedCount >= 2;

  const handleOpenModal = useCallback(() => {
    if (!canCompare) return;
    setIsModalOpen(true);
  }, [canCompare]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleRemoveFromModal = useCallback(
    async (vehicleId: string) => {
      await removeFromGarage(vehicleId);
      const remaining = selectedIds.filter((id) => id !== vehicleId);
      if (remaining.length < 2) {
        setIsModalOpen(false);
      }
    },
    [removeFromGarage, selectedIds],
  );

  const handleClearFromModal = useCallback(() => {
    clearSelection();
    setIsModalOpen(false);
  }, [clearSelection]);

  const selectedVehicles = vehicles.filter((v) => selectedIds.includes(v.id));

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed right-4 top-4 z-50 rounded-xl p-2.5 transition-all duration-300",
          "ax-glass--light border border-white/[0.06]",
          isOpen
            ? "text-ax-accent-warning"
            : "text-ax-text-secondary hover:text-ax-accent-warning",
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
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-ax-accent-warning text-[10px] font-bold text-black flex items-center justify-center">
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
          "ax-glass border-l border-ax-border-subtle",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Garaje Virtual"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ax-border-subtle">
          <div>
            <h2 className="text-sm font-bold text-ax-text-primary tracking-wide uppercase">
              Garaje Virtual
            </h2>
            <p className="text-xs text-ax-text-muted mt-0.5">
              {vehicles.length}/10 vehículos
              {selectedCount > 0 && (
                <span className="text-ax-accent-warning ml-1">
                  · {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={toggleSidebar}
            className="ax-glass--light rounded-lg p-1.5 text-ax-text-muted hover:text-ax-text-primary"
            aria-label="Cerrar garaje"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-ax-surface-light flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-ax-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21" />
                </svg>
              </div>
              <p className="text-xs text-ax-text-muted">
                Añade vehículos desde las tarjetas de recomendación
              </p>
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const isSelected = selectedIds.includes(vehicle.id);
              return (
                <div
                  key={vehicle.id}
                  className={cn(
                    "rounded-xl p-3 transition-all duration-200 animate-ax-scale-in cursor-pointer",
                    isSelected
                      ? "ax-glass border border-ax-accent-warning/30 bg-ax-accent-warning/[0.06]"
                      : "ax-glass--light border border-transparent hover:border-white/[0.08]",
                  )}
                  onClick={() => toggleSelection(vehicle.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Seleccionar ${vehicle.brand} ${vehicle.model} para comparar`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSelection(vehicle.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 min-w-0">
                      <div
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          isSelected
                            ? "border-ax-accent-warning bg-ax-accent-warning"
                            : "border-white/[0.15] bg-transparent",
                        )}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ax-text-primary truncate">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-xs text-ax-text-muted font-mono">{vehicle.year}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromGarage(vehicle.id);
                      }}
                      className="text-ax-text-muted hover:text-ax-accent-danger transition-colors p-1 rounded-lg hover:bg-ax-surface-light shrink-0"
                      aria-label={`Eliminar ${vehicle.brand} ${vehicle.model} del garaje`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {vehicle.engine && (
                      <span className="ax-badge rounded-full px-2 py-0.5 text-[10px] text-ax-text-secondary">
                        {safeDisplay(vehicle.engine)}
                      </span>
                    )}
                    {vehicle.fuel_type && (
                      <span className="ax-badge rounded-full px-2 py-0.5 text-[10px] text-ax-text-secondary">
                        {translateSpec(vehicle.fuel_type, "fuel")}
                      </span>
                    )}
                    {vehicle.body_type && (
                      <span className="ax-badge rounded-full px-2 py-0.5 text-[10px] text-ax-text-secondary">
                        {translateSpec(vehicle.body_type, "body")}
                      </span>
                    )}
                    {vehicle.price_usd != null && (
                      <span className="ax-badge rounded-full px-2 py-0.5 text-[10px] text-ax-accent-success">
                        {formatPriceUSD(vehicle.price_usd)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {vehicles.length > 0 && (
          <div className="p-3 border-t border-ax-border-subtle space-y-2">
            {selectedCount > 0 && selectedCount < 2 && (
              <p className="text-[10px] text-ax-text-muted text-center">
                Selecciona al menos 2 vehículos para comparar
              </p>
            )}
            <button
              onClick={handleOpenModal}
              disabled={!canCompare}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                canCompare
                  ? "bg-ax-accent-warning text-black hover:bg-ax-accent-warning/90"
                  : "ax-glass text-ax-text-muted cursor-not-allowed",
              )}
              aria-label="Comparar vehículos seleccionados"
            >
              Comparar vehículos ({selectedCount})
            </button>
            <button
              onClick={() => {
                clearGarage();
                clearSelection();
              }}
              className="w-full rounded-xl px-4 py-2 text-xs text-ax-text-muted hover:text-ax-accent-danger transition-colors"
            >
              Vaciar garaje
            </button>
          </div>
        )}
      </aside>

      {/* Comparison Modal */}
      <VehicleComparisonModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        vehicles={selectedVehicles}
        onRemoveVehicle={handleRemoveFromModal}
        onClearAll={handleClearFromModal}
      />
    </>
  );
}
