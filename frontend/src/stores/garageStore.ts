import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GarageVehicle, VehicleScores } from "@/types/vehicle";
import { GARAGE_STORAGE_KEY, GARAGE_MAX_ITEMS } from "@/config/constants";

function generateId(): string {
  return crypto.randomUUID().slice(0, 12);
}

interface GarageState {
  vehicles: GarageVehicle[];
  isOpen: boolean;

  addToGarage: (
    vehicle: Omit<GarageVehicle, "id" | "added_at">,
  ) => boolean;
  removeFromGarage: (vehicleId: string) => void;
  updateScores: (vehicleId: string, scores: VehicleScores) => void;
  clearGarage: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isInGarage: (brand: string, model: string, year: number) => boolean;
}

export const useGarageStore = create<GarageState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      isOpen: false,

      addToGarage: (vehicle) => {
        const state = get();
        if (state.vehicles.length >= GARAGE_MAX_ITEMS) return false;

        const alreadyExists = state.vehicles.some(
          (v) =>
            v.brand === vehicle.brand &&
            v.model === vehicle.model &&
            v.year === vehicle.year,
        );
        if (alreadyExists) return false;

        const newVehicle: GarageVehicle = {
          ...vehicle,
          id: generateId(),
          added_at: new Date().toISOString(),
        };

        set({ vehicles: [...state.vehicles, newVehicle] });
        return true;
      },

      removeFromGarage: (vehicleId) => {
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== vehicleId),
        }));
      },

      updateScores: (vehicleId, scores) => {
        set((s) => ({
          vehicles: s.vehicles.map((v) =>
            v.id === vehicleId ? { ...v, scores } : v,
          ),
        }));
      },

      clearGarage: () => set({ vehicles: [] }),

      toggleSidebar: () => set((s) => ({ isOpen: !s.isOpen })),

      setSidebarOpen: (open) => set({ isOpen: open }),

      isInGarage: (brand, model, year) => {
        return get().vehicles.some(
          (v) => v.brand === brand && v.model === model && v.year === year,
        );
      },
    }),
    {
      name: GARAGE_STORAGE_KEY,
      partialize: (state) => ({ vehicles: state.vehicles }),
    },
  ),
);
