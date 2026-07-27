import { useMemo, useCallback, useEffect, useRef } from "react";
import { GlassModal } from "@/components/design-system/GlassModal";
import { GlassBadge } from "@/components/design-system/GlassBadge";
import type { GarageVehicle } from "@/types/vehicle";
import {
  translateSpec,
  formatPriceUSD,
  formatMileage,
  formatYear,
  formatCapacity,
  safeDisplay,
} from "@/utils/specNormalization";

interface VehicleComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: GarageVehicle[];
  onRemoveVehicle: (vehicleId: string) => void;
  onClearAll: () => void;
}

interface ComparisonRow {
  label: string;
  key: string;
  values: (string | number | null | undefined)[];
  highlight?: "lower" | "higher" | "newer";
  highlightLabel?: string;
}

interface VehicleAdvantage {
  vehicleId: string;
  advantage: string;
  disadvantage: string;
}

function normalizeSpec(value: string | null | undefined): string {
  if (!value) return "No disponible";
  const lower = value.toLowerCase().trim();
  const fuelMatch = [
    "gas", "gasoline", "petrol", "diesel", "electric", "hybrid",
    "plug-in hybrid", "plug-in", "ethanol", "e85", "cng", "lpg", "hydrogen",
  ];
  if (fuelMatch.includes(lower)) return translateSpec(lower, "fuel");
  const transMatch = ["automatic", "manual", "other", "cvt", "dual-clutch", "dct", "amt", "tiptronic"];
  if (transMatch.includes(lower)) return translateSpec(lower, "transmission");
  const driveMatch = ["fwd", "rwd", "awd", "4wd", "4x4", "ffd"];
  if (driveMatch.includes(lower)) return translateSpec(lower, "drive");
  const bodyMatch = [
    "sedan", "suv", "hatchback", "coupe", "convertible", "pickup",
    "wagon", "van", "minivan", "truck", "sport utility", "sport utility vehicle",
    "passenger car", "2dr", "4dr", "crew cab", "extended cab",
  ];
  if (bodyMatch.includes(lower)) return translateSpec(lower, "body");
  const condMatch = ["new", "used", "excellent", "good", "fair", "poor", "certified"];
  if (condMatch.includes(lower)) return translateSpec(lower, "condition");
  const colorMatch = [
    "black", "white", "silver", "gray", "grey", "red", "blue", "green",
    "yellow", "orange", "brown", "beige", "gold", "purple", "navy",
    "charcoal", "crimson", "teal", "burgundy", "pink",
  ];
  if (colorMatch.includes(lower)) return translateSpec(lower, "color");
  return safeDisplay(value);
}

function findBestValue(
  values: (string | number | null | undefined)[],
  mode: "lower" | "higher" | "newer",
): number | null {
  const nums = values
    .map((v, i) => ({ val: typeof v === "number" ? v : parseFloat(String(v ?? "")), idx: i }))
    .filter((x) => !isNaN(x.val) && x.val > 0);
  if (nums.length < 2) return null;
  if (mode === "lower") {
    const min = Math.min(...nums.map((x) => x.val));
    return nums.find((x) => x.val === min)?.idx ?? null;
  }
  if (mode === "higher" || mode === "newer") {
    const max = Math.max(...nums.map((x) => x.val));
    return nums.find((x) => x.val === max)?.idx ?? null;
  }
  return null;
}

function getAdvantages(vehicles: GarageVehicle[]): VehicleAdvantage[] {
  if (vehicles.length < 2) return [];

  const priceIdx = findBestValue(vehicles.map((v) => v.price_usd), "lower");
  const yearIdx = findBestValue(vehicles.map((v) => v.year), "newer");
  const mileageIdx = findBestValue(vehicles.map((v) => v.mileage_km), "lower");

  return vehicles.map((v, i) => {
    const adv: string[] = [];
    const dis: string[] = [];

    if (i === priceIdx) adv.push("Menor precio");
    else if (priceIdx !== null) dis.push("Precio más alto");

    if (i === yearIdx) adv.push("Más reciente");
    else if (yearIdx !== null) dis.push("Modelo más antiguo");

    if (i === mileageIdx) adv.push("Menor kilometraje");
    else if (mileageIdx !== null) dis.push("Mayor kilometraje");

    return {
      vehicleId: v.id,
      advantage: adv.length > 0 ? adv[0]! : "Sin ventaja destacada",
      disadvantage: dis.length > 0 ? dis[0]! : "Sin desventaja destacada",
    };
  });
}

export function VehicleComparisonModal({
  isOpen,
  onClose,
  vehicles,
  onRemoveVehicle,
  onClearAll,
}: VehicleComparisonModalProps) {
  const previousFocusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLButtonElement;
      return () => {
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  const comparisonRows: ComparisonRow[] = useMemo(() => {
    if (vehicles.length < 2) return [];

    const allRows: ComparisonRow[] = [
      {
        label: "Marca",
        key: "brand",
        values: vehicles.map((v) => v.brand),
      },
      {
        label: "Modelo",
        key: "model",
        values: vehicles.map((v) => v.model),
      },
      {
        label: "Año",
        key: "year",
        values: vehicles.map((v) => formatYear(v.year)),
        highlight: "newer",
        highlightLabel: "Más reciente",
      },
      {
        label: "Precio",
        key: "price",
        values: vehicles.map((v) => formatPriceUSD(v.price_usd ?? 0)),
        highlight: "lower",
        highlightLabel: "Menor precio",
      },
      {
        label: "Carrocería",
        key: "body_type",
        values: vehicles.map((v) => normalizeSpec(v.body_type)),
      },
      {
        label: "Motor",
        key: "engine",
        values: vehicles.map((v) => safeDisplay(v.engine)),
      },
      {
        label: "Cilindrada",
        key: "cylinders",
        values: vehicles.map((v) =>
          v.cylinders != null ? `${v.cylinders} cilindros` : null,
        ),
      },
      {
        label: "Transmisión",
        key: "transmission",
        values: vehicles.map((v) => normalizeSpec(v.transmission)),
      },
      {
        label: "Combustible",
        key: "fuel",
        values: vehicles.map((v) => normalizeSpec(v.fuel_type)),
      },
      {
        label: "Tracción",
        key: "drive",
        values: vehicles.map((v) => normalizeSpec(v.drive)),
      },
      {
        label: "Kilometraje",
        key: "mileage",
        values: vehicles.map((v) => formatMileage(v.mileage_km ?? 0)),
        highlight: "lower",
        highlightLabel: "Menor kilometraje",
      },
      {
        label: "Color",
        key: "color",
        values: vehicles.map((v) => normalizeSpec(v.color)),
      },
      {
        label: "Estado",
        key: "condition",
        values: vehicles.map((v) => normalizeSpec(v.condition)),
      },
      {
        label: "Pasajeros",
        key: "passengers",
        values: vehicles.map((v) =>
          v.passengers != null ? formatCapacity(v.passengers) : null,
        ),
      },
      {
        label: "Consumo",
        key: "consumption",
        values: vehicles.map((v) => safeDisplay(v.consumption)),
      },
    ];

    return allRows.filter((row) => {
      const hasAnyData = row.values.some(
        (val) => val != null && val !== "No disponible" && val !== "N/A" && val !== "",
      );
      return hasAnyData;
    });
  }, [vehicles]);

  const advantages = useMemo(() => getAdvantages(vehicles), [vehicles]);

  const handleRemove = useCallback(
    (vehicleId: string) => {
      onRemoveVehicle(vehicleId);
    },
    [onRemoveVehicle],
  );

  const handleClear = useCallback(() => {
    onClearAll();
    onClose();
  }, [onClearAll, onClose]);

  if (vehicles.length < 2) return null;

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Comparación de vehículos"
      description={`${vehicles.length} vehículos seleccionados para comparar`}
      size="full"
      className="w-[95vw] max-w-[1600px] sm:w-[90vw] lg:w-[88vw]"
      footer={
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={handleClear}
            className="text-xs text-ax-text-muted hover:text-ax-accent-danger transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            Limpiar comparación
          </button>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-ax-text-primary bg-ax-surface-light border border-white/[0.08] px-4 py-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Vehicle headers with remove buttons */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex-shrink-0 min-w-[180px] flex-1 ax-glass--light rounded-xl p-4 border border-white/[0.06]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ax-text-primary truncate">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <p className="text-xs text-ax-text-muted font-mono mt-0.5">
                    {formatYear(vehicle.year)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(vehicle.id)}
                  className="text-ax-text-muted hover:text-ax-accent-danger transition-colors p-1 rounded-lg hover:bg-white/[0.06] shrink-0"
                  aria-label={`Quitar ${vehicle.brand} ${vehicle.model} de la comparación`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {vehicle.price_usd != null && (
                <p className="text-sm font-semibold text-ax-accent-success">
                  {formatPriceUSD(vehicle.price_usd)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm" role="table" aria-label="Tabla de comparación de vehículos">
            <thead>
              <tr className="bg-white/[0.02]">
                <th
                  className="text-left py-3 px-4 text-xs font-semibold text-ax-text-muted uppercase tracking-wider border-b border-white/[0.06] w-[160px] sticky left-0 bg-ax-bg-deep/90"
                  scope="col"
                >
                  Característica
                </th>
                {vehicles.map((v) => (
                  <th
                    key={v.id}
                    className="text-left py-3 px-4 text-xs font-semibold text-ax-text-muted uppercase tracking-wider border-b border-white/[0.06]"
                    scope="col"
                  >
                    {v.brand} {v.model}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => {
                const bestIdx = row.highlight ? findBestValue(row.values, row.highlight) : null;
                return (
                  <tr
                    key={row.key}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 text-xs font-semibold text-ax-text-secondary whitespace-nowrap sticky left-0 bg-ax-bg-deep/90">
                      {row.label}
                    </td>
                    {row.values.map((val, i) => {
                      const isBest = bestIdx === i;
                      const displayVal = safeDisplay(val);
                      return (
                        <td
                          key={i}
                          className="py-3 px-4 text-xs text-ax-text-primary"
                        >
                          <div className="flex items-center gap-2">
                            <span>{displayVal}</span>
                            {isBest && row.highlightLabel && (
                              <GlassBadge variant="success" size="sm">
                                {row.highlightLabel}
                              </GlassBadge>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Advantages / Disadvantages */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-ax-text-muted uppercase tracking-wider">
            Análisis por vehículo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {vehicles.map((vehicle) => {
              const adv = advantages.find((a) => a.vehicleId === vehicle.id);
              return (
                <div
                  key={vehicle.id}
                  className="ax-glass--light rounded-xl p-4 border border-white/[0.06]"
                >
                  <p className="text-sm font-bold text-ax-text-primary mb-2">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <GlassBadge variant="success" size="sm">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </GlassBadge>
                      <span className="text-xs text-ax-text-secondary">
                        {adv?.advantage ?? "Sin ventaja destacada"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <GlassBadge variant="warning" size="sm">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                      </GlassBadge>
                      <span className="text-xs text-ax-text-secondary">
                        {adv?.disadvantage ?? "Sin desventaja destacada"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* General model context */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-ax-text-muted uppercase tracking-wider">
            Análisis cualitativo
          </h3>
          {getSpecificDifferences(vehicles) && (
            <p className="text-xs text-ax-text-secondary leading-relaxed">
              {getSpecificDifferences(vehicles)}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="ax-glass--light rounded-xl p-4 border border-white/[0.06]"
              >
                <p className="text-sm font-bold text-ax-text-primary mb-2">
                  {vehicle.brand} {vehicle.model}
                </p>
                <div className="space-y-1.5 text-xs text-ax-text-secondary">
                  <p>
                    <span className="text-ax-text-muted">Para qué conviene: </span>
                    {getUsageRecommendation(vehicle)}
                  </p>
                  <p>
                    <span className="text-ax-text-muted">Confort: </span>
                    {getComfortAssessment(vehicle)}
                  </p>
                  <p>
                    <span className="text-ax-text-muted">Desempeño: </span>
                    {getPerformanceAssessment(vehicle)}
                  </p>
                  <p>
                    <span className="text-ax-text-muted">Confiabilidad: </span>
                    {getReliabilityAssessment(vehicle)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final recommendation */}
        <RecommendationSummary vehicles={vehicles} />
      </div>
    </GlassModal>
  );
}

function getUsageRecommendation(vehicle: GarageVehicle): string {
  const bodyType = vehicle.body_type?.toLowerCase() || "";
  const passengers = vehicle.passengers;
  const engine = vehicle.engine?.toLowerCase() || "";

  if (bodyType.includes("truck") || bodyType.includes("pickup")) {
    const hasTurbo = engine.includes("turbo") || engine.includes("diesel");
    if (hasTurbo) return "Trabajo pesado, carga y remolque. Motor con buena potencia para tareas exigentes.";
    return "Trabajo y carga moderada. Buena opción para uso diario con capacidad de carga.";
  }
  if (bodyType.includes("suv")) {
    if (passengers && passengers >= 7) return "Familiar amplio. Ideal para familias grandes con espacio para 7 pasajeros.";
    if (engine.includes("turbo") || engine.includes("v6")) return "Familiar con buen desempeño. Equilibrio entre espacio y potencia para carretera.";
    return "Familiar urbano. Buen espacio interior y practicidad para el día a día.";
  }
  if (bodyType.includes("sedan")) {
    if (engine.includes("turbo") || engine.includes("v6")) return "Sedán con carácter. Para quien busca comodidad y buen desempeño en ruta.";
    return "Urbano y eficiente. Ideal para ciudad con bajo consumo de combustible.";
  }
  if (bodyType.includes("coupe")) {
    return "Enfocado en el manejo. Para quien prioriza agilidad y estilo sobre practicidad.";
  }
  if (bodyType.includes("hatchback")) {
    return "Compacto y versátil. Fácil de estacionar, buen consumo, ideal para ciudad.";
  }
  return "Uso general. Versátil para distintas necesidades.";
}

function getComfortAssessment(vehicle: GarageVehicle): string {
  const bodyType = vehicle.body_type?.toLowerCase() || "";
  const passengers = vehicle.passengers;
  const brand = vehicle.brand.toLowerCase();

  const isLuxury = ["bmw", "mercedes", "audi", "lexus", "acura", "infiniti", "genesis"].includes(brand);
  const isEconomy = ["kia", "hyundai", "nissan", "mitsubishi", "suzuki", "daihatsu"].includes(brand);

  if (passengers && passengers >= 7) return "Espacio muy amplio para pasajeros. Confort en viajes largos con familia.";
  if (isLuxury) return "Interior premium con materiales de alta calidad y buen aislamiento.";
  if (isEconomy) return "Confort funcional. Lo básico bien resuelto para su precio.";
  if (bodyType.includes("suv")) return "Posición de manejo elevada y buen espacio interior.";
  if (bodyType.includes("sedan")) return "Buen aislamiento y asientos confortables para rutinas diarias.";
  return "Confort según el segmento. Evaluar según preferencias personales.";
}

function getPerformanceAssessment(vehicle: GarageVehicle): string {
  const engine = vehicle.engine?.toLowerCase() || "";
  const bodyType = vehicle.body_type?.toLowerCase() || "";
  const cylinders = vehicle.cylinders;

  if (engine.includes("v8")) return "Motor potente. Para quien necesita fuerza bruta para remolque o desempeño.";
  if (engine.includes("v6")) return "Buen equilibrio entre potencia y consumo. Suficiente para casi cualquier necesidad.";
  if (engine.includes("turbo")) return "Compensación inteligente: motor más pequeño con turbo para buena respuesta.";
  if (cylinders && cylinders >= 6) return "Motor con buen rendimiento para su clase.";
  if (cylinders && cylinders <= 3) return "Motor pequeño y eficiente. Prioriza el ahorro sobre la potencia.";
  if (bodyType.includes("coupe")) return "Enfocado en agilidad y manejo más que en potencia pura.";
  return "Desempeño estándar para su segmento. Adecuado para uso cotidiano.";
}

function getReliabilityAssessment(vehicle: GarageVehicle): string {
  const mileage = vehicle.mileage_km;
  const brand = vehicle.brand.toLowerCase();

  const highReliability = ["toyota", "lexus", "honda", "acura"];
  const midReliability = ["mazda", "subaru", "hyundai", "kia"];

  if (mileage && mileage > 150000) {
    return "Kilometraje alto. Revisar mantenimiento reciente y estado mecánico antes de decidir.";
  }
  if (mileage && mileage < 30000) {
    return "Bajo kilometraje. Buena condición mecánica esperada para los próximos años.";
  }

  if (highReliability.includes(brand)) {
    return "Marca con historial sólido de confiabilidad. Buena inversión a largo plazo.";
  }
  if (midReliability.includes(brand)) {
    return "Confiabilidad buena en general. Mantenimiento preventivo recomendado.";
  }

  return "Confiabilidad variable según modelo y mantenimiento. Revisar reseñas específicas.";
}

function getSpecificDifferences(vehicles: GarageVehicle[]): string {
  if (vehicles.length < 2) return "";

  const lines: string[] = [];
  for (let i = 0; i < vehicles.length; i++) {
    const a = vehicles[i]!;
    for (let j = i + 1; j < vehicles.length; j++) {
      const b = vehicles[j]!;

      if (a.body_type?.toLowerCase() !== b.body_type?.toLowerCase()) {
        lines.push(
          `${a.brand} ${a.model} es ${normalizeSpec(a.body_type)}, mientras que ${b.brand} ${b.model} es ${normalizeSpec(b.body_type)}.`,
        );
      }

      if (a.price_usd && b.price_usd) {
        const diff = Math.abs(a.price_usd - b.price_usd);
        if (diff > 5000) {
          const cheaper = a.price_usd < b.price_usd ? `${a.brand} ${a.model}` : `${b.brand} ${b.model}`;
          lines.push(`${cheaper} es significativamente más económico (diferencia de $${diff.toLocaleString()}).`);
        }
      }

      if (a.passengers && b.passengers && a.passengers !== b.passengers) {
        lines.push(
          `${a.brand} ${a.model} tiene ${a.passengers} pasajeros, ${b.brand} ${b.model} tiene ${b.passengers}.`,
        );
      }
    }
  }

  return lines.join(" ");
}

function RecommendationSummary({
  vehicles,
}: {
  vehicles: GarageVehicle[];
}) {
  const priceIdx = findBestValue(vehicles.map((v) => v.price_usd), "lower");
  const yearIdx = findBestValue(vehicles.map((v) => v.year), "newer");
  const mileageIdx = findBestValue(vehicles.map((v) => v.mileage_km), "lower");

  const cheapest = priceIdx !== null ? vehicles[priceIdx] : null;
  const newest = yearIdx !== null ? vehicles[yearIdx] : null;
  const lowestMileage = mileageIdx !== null ? vehicles[mileageIdx] : null;

  const hasCompleteData = vehicles.every(
    (v) => v.price_usd != null && v.year != null && v.mileage_km != null,
  );

  let recommendation: string;
  if (!hasCompleteData) {
    recommendation =
      "Faltan especificaciones para realizar una recomendación completa. Se muestran solo los datos disponibles.";
  } else if (cheapest && newest && cheapest.id === newest.id) {
    recommendation = `${cheapest.brand} ${cheapest.model} destaca como la mejor opción, siendo el más económico y el más reciente.`;
  } else if (cheapest && lowestMileage && cheapest.id === lowestMileage.id) {
    recommendation = `${cheapest.brand} ${cheapest.model} combina el mejor precio con el menor kilometraje, ofreciendo la mejor relación calidad-precio.`;
  } else if (cheapest) {
    const parts = [`${cheapest.brand} ${cheapest.model} ofrece el mejor precio`];
    if (newest) parts.push(`Si la antigüedad es prioridad, considere ${newest.brand} ${newest.model}`);
    if (lowestMileage && lowestMileage.id !== cheapest.id) parts.push(`Para menor kilometraje, ${lowestMileage.brand} ${lowestMileage.model} es la mejor opción`);
    recommendation = parts.join(". ") + ".";
  } else {
    recommendation = "No se pudo determinar una recomendación clara con los datos disponibles.";
  }

  const usedCriteria: string[] = [];
  if (priceIdx !== null) usedCriteria.push("precio");
  if (yearIdx !== null) usedCriteria.push("año de fabricación");
  if (mileageIdx !== null) usedCriteria.push("kilometraje");

  return (
    <div className="ax-glass--light rounded-xl p-5 border border-white/[0.06]">
      <h3 className="text-xs font-bold text-ax-accent-warning uppercase tracking-wider mb-3">
        Recomendación comparativa
      </h3>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          {cheapest && (
            <GlassBadge variant="success" size="md">
              Más económico: {cheapest.brand} {cheapest.model}
            </GlassBadge>
          )}
          {newest && (
            <GlassBadge variant="info" size="md">
              Más reciente: {newest.brand} {newest.model}
            </GlassBadge>
          )}
          {lowestMileage && lowestMileage.id !== cheapest?.id && lowestMileage.id !== newest?.id && (
            <GlassBadge variant="primary" size="md">
              Menor kilometraje: {lowestMileage.brand} {lowestMileage.model}
            </GlassBadge>
          )}
        </div>
        <p className="text-xs text-ax-text-secondary leading-relaxed">
          {recommendation}
        </p>
        {usedCriteria.length > 0 && (
          <p className="text-[10px] text-ax-text-muted">
            Criterios utilizados: {usedCriteria.join(", ")}.
          </p>
        )}
        {!hasCompleteData && (
          <div className="flex items-start gap-2 mt-2">
            <GlassBadge variant="warning" size="sm">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              Advertencia
            </GlassBadge>
            <span className="text-xs text-ax-text-muted">
              Algunos datos están incompletos. La comparación se basa únicamente en las especificaciones disponibles.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
