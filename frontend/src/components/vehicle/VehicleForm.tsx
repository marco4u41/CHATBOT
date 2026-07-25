import { useState } from "react";
import { cn } from "@/utils/cn";

interface Vehicle {
  brand: string;
  model: string;
  year: number;
  engine?: string;
  transmission?: string;
  fuel_type?: string;
  mileage_km?: number;
  price_usd?: number;
}

interface VehicleFormProps {
  onSubmit: (vehicles: Vehicle[]) => void;
  disabled?: boolean;
  minVehicles?: number;
  maxVehicles?: number;
}

const EMPTY_VEHICLE: Vehicle = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  engine: "",
  transmission: "",
  fuel_type: "",
  mileage_km: undefined,
  price_usd: undefined,
};

export function VehicleForm({
  onSubmit,
  disabled = false,
  minVehicles = 2,
  maxVehicles = 5,
}: VehicleFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { ...EMPTY_VEHICLE },
    { ...EMPTY_VEHICLE },
  ]);

  function updateVehicle(
    index: number,
    field: keyof Vehicle,
    value: string | number | undefined,
  ) {
    setVehicles((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  function addVehicle() {
    if (vehicles.length < maxVehicles) {
      setVehicles((prev) => [...prev, { ...EMPTY_VEHICLE }]);
    }
  }

  function removeVehicle(index: number) {
    if (vehicles.length > minVehicles) {
      setVehicles((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = vehicles.filter((v) => v.brand.trim() && v.model.trim());
    if (valid.length >= minVehicles) {
      onSubmit(valid);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {vehicles.map((vehicle, index) => (
        <div
          key={index}
          className="liquid-glass-panel-dense rounded-xl p-4 space-y-3 animate-scale-glass"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Vehiculo {index + 1}
            </h3>
            {vehicles.length > minVehicles && (
              <button
                type="button"
                onClick={() => removeVehicle(index)}
                className="text-neon-red/40 hover:text-neon-red text-xs transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              placeholder="Marca"
              value={vehicle.brand}
              onChange={(e) => updateVehicle(index, "brand", e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
              required
            />
            <input
              type="text"
              placeholder="Modelo"
              value={vehicle.model}
              onChange={(e) => updateVehicle(index, "model", e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
              required
            />
            <input
              type="number"
              placeholder="Ano"
              value={vehicle.year}
              onChange={(e) =>
                updateVehicle(index, "year", Number(e.target.value))
              }
              className="glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
              min={1900}
              max={2100}
            />
            <input
              type="text"
              placeholder="Motor (opcional)"
              value={vehicle.engine}
              onChange={(e) => updateVehicle(index, "engine", e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15"
            />
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        {vehicles.length < maxVehicles && (
          <button
            type="button"
            onClick={addVehicle}
            className="skeuo-button rounded-xl px-4 py-2.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            + Agregar vehiculo
          </button>
        )}
        <button
          type="submit"
          disabled={
            disabled ||
            vehicles.filter((v) => v.brand && v.model).length < minVehicles
          }
          className={cn(
            "rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            vehicles.filter((v) => v.brand && v.model).length >= minVehicles && !disabled
              ? "neon-button-orange text-neon-orange"
              : "skeuo-button text-white/30",
          )}
        >
          Comparar vehiculos
        </button>
      </div>
    </form>
  );
}
