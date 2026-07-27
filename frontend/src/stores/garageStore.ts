import { create } from "zustand";
import type { GarageVehicle, VehicleScores } from "@/types/vehicle";
import { GARAGE_MAX_ITEMS } from "@/config/constants";
import { apiClient } from "@/api/client";

interface GarageState {
  vehicles: GarageVehicle[];
  isOpen: boolean;
  selectedIds: string[];
  lastError: string | null;

  loadGarage: () => Promise<void>;
  addToGarage: (
    vehicle: Omit<GarageVehicle, "id" | "added_at">,
  ) => Promise<{ ok: boolean; error?: string }>;
  removeFromGarage: (vehicleId: string) => Promise<{ ok: boolean; error?: string }>;
  updateScores: (vehicleId: string, scores: VehicleScores) => void;
  clearGarage: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isInGarage: (brand: string, model: string, year: number) => boolean;

  toggleSelection: (vehicleId: string) => void;
  clearSelection: () => void;
  removeSelection: (vehicleId: string) => void;
  getSelectedVehicles: () => GarageVehicle[];
}

export const useGarageStore = create<GarageState>()((set, get) => ({
  vehicles: [],
  isOpen: false,
  selectedIds: [],
  lastError: null,

  loadGarage: async () => {
    const res = await apiClient.get<GarageVehicle[]>("/users/me/garage");
    if (res.success && res.data) {
      set({ vehicles: res.data, lastError: null });
    } else {
      set({ lastError: res.error || "No se pudo cargar el garage" });
    }
  },

  addToGarage: async (vehicle) => {
    const state = get();
    if (state.vehicles.length >= GARAGE_MAX_ITEMS) {
      return { ok: false, error: `Garage lleno. Máximo ${GARAGE_MAX_ITEMS} vehículos.` };
    }

    const alreadyExists = state.vehicles.some(
      (v) =>
        v.brand === vehicle.brand &&
        v.model === vehicle.model &&
        v.year === vehicle.year,
    );
    if (alreadyExists) {
      return { ok: false, error: "Este vehículo ya está en tu garage." };
    }

    const res = await apiClient.post<GarageVehicle>("/users/me/garage", {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      engine: vehicle.engine ?? "",
      transmission: vehicle.transmission ?? "",
      fuel_type: vehicle.fuel_type ?? "",
      mileage_km: vehicle.mileage_km ?? null,
      price_usd: vehicle.price_usd ?? null,
      body_type: vehicle.body_type ?? "",
      drive: vehicle.drive ?? "",
      condition: vehicle.condition ?? "",
      color: vehicle.color ?? "",
      cylinders: vehicle.cylinders ?? null,
      passengers: vehicle.passengers ?? null,
      consumption: vehicle.consumption ?? "",
      notes: vehicle.notes ?? "",
    });

    if (res.success && res.data) {
      set({ vehicles: [...get().vehicles, res.data], lastError: null });
      return { ok: true };
    }

    const msg = res.error || "No se pudo guardar el vehículo. Intenta de nuevo.";
    set({ lastError: msg });
    return { ok: false, error: msg };
  },

  removeFromGarage: async (vehicleId) => {
    const res = await apiClient.delete(`/users/me/garage/${vehicleId}`);
    if (res.success) {
      set((s) => ({
        vehicles: s.vehicles.filter((v) => v.id !== vehicleId),
        selectedIds: s.selectedIds.filter((id) => id !== vehicleId),
        lastError: null,
      }));
      return { ok: true };
    }
    const msg = res.error || "No se pudo eliminar el vehículo.";
    set({ lastError: msg });
    return { ok: false, error: msg };
  },

  updateScores: (vehicleId, scores) => {
    set((s) => ({
      vehicles: s.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, scores } : v,
      ),
    }));
  },

  clearGarage: () => set({ vehicles: [], selectedIds: [] }),

  toggleSidebar: () => set((s) => ({ isOpen: !s.isOpen })),

  setSidebarOpen: (open) => set({ isOpen: open }),

  isInGarage: (brand, model, year) => {
    return get().vehicles.some(
      (v) => v.brand === brand && v.model === model && v.year === year,
    );
  },

  toggleSelection: (vehicleId) => {
    set((s) => {
      const isSelected = s.selectedIds.includes(vehicleId);
      if (isSelected) {
        return { selectedIds: s.selectedIds.filter((id) => id !== vehicleId) };
      }
      if (s.selectedIds.length >= 4) return s;
      return { selectedIds: [...s.selectedIds, vehicleId] };
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  removeSelection: (vehicleId) => {
    set((s) => ({
      selectedIds: s.selectedIds.filter((id) => id !== vehicleId),
    }));
  },

  getSelectedVehicles: () => {
    const state = get();
    return state.vehicles.filter((v) => state.selectedIds.includes(v.id));
  },
}));
