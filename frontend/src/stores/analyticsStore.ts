import { create } from "zustand";
import { analyticsApi } from "@/api/analytics";
import type {
  AnalyticsOverviewData,
  VehicleTypeData,
  VehicleFuelData,
  VehicleTransmissionData,
  VehicleYearData,
  VehiclePriceData,
  BrandRankingData,
} from "@/types/analytics";

const CACHE_TTL = 5 * 60 * 1000;

export type AnalyticsSection =
  | "overview"
  | "byType"
  | "byFuel"
  | "byTransmission"
  | "byYear"
  | "priceDistribution"
  | "brandRanking";

interface AnalyticsErrors {
  overview: string | null;
  byType: string | null;
  byFuel: string | null;
  byTransmission: string | null;
  byYear: string | null;
  priceDistribution: string | null;
  brandRanking: string | null;
}

const DEFAULT_ERRORS: AnalyticsErrors = {
  overview: null,
  byType: null,
  byFuel: null,
  byTransmission: null,
  byYear: null,
  priceDistribution: null,
  brandRanking: null,
};

export interface AnalyticsState {
  overview: AnalyticsOverviewData | null;
  byType: VehicleTypeData | null;
  byFuel: VehicleFuelData | null;
  byTransmission: VehicleTransmissionData | null;
  byYear: VehicleYearData | null;
  priceDistribution: VehiclePriceData | null;
  brandRanking: BrandRankingData | null;

  isLoading: boolean;
  sectionLoading: Record<AnalyticsSection, boolean>;
  errors: AnalyticsErrors;
  lastFetched: number | null;

  fetchAll: (force?: boolean) => Promise<void>;
  fetchSection: (section: AnalyticsSection) => Promise<void>;
  clearCache: () => void;
}

const SECTION_API_MAP: Record<
  AnalyticsSection,
  () => Promise<{ success: boolean; data?: unknown; error?: string }>
> = {
  overview: () => analyticsApi.getOverview(),
  byType: () => analyticsApi.getByType(),
  byFuel: () => analyticsApi.getByFuel(),
  byTransmission: () => analyticsApi.getByTransmission(),
  byYear: () => analyticsApi.getByYear(),
  priceDistribution: () => analyticsApi.getPriceDistribution(),
  brandRanking: () => analyticsApi.getBrandRanking(),
};

const ALL_SECTIONS: AnalyticsSection[] = [
  "overview",
  "byType",
  "byFuel",
  "byTransmission",
  "byYear",
  "priceDistribution",
  "brandRanking",
];

function checkAllComplete(state: AnalyticsState): boolean {
  return (
    ALL_SECTIONS.every((s) => state[s] !== null) &&
    ALL_SECTIONS.every((s) => state.errors[s] === null)
  );
}

const DEFAULT_SECTION_LOADING: Record<AnalyticsSection, boolean> = {
  overview: false,
  byType: false,
  byFuel: false,
  byTransmission: false,
  byYear: false,
  priceDistribution: false,
  brandRanking: false,
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  overview: null,
  byType: null,
  byFuel: null,
  byTransmission: null,
  byYear: null,
  priceDistribution: null,
  brandRanking: null,

  isLoading: false,
  sectionLoading: { ...DEFAULT_SECTION_LOADING },
  errors: { ...DEFAULT_ERRORS },
  lastFetched: null,

  fetchAll: async (force = false) => {
    const state = get();
    if (
      !force &&
      state.lastFetched &&
      Date.now() - state.lastFetched < CACHE_TTL
    ) {
      return;
    }

    set({ isLoading: true });

    const results = await Promise.allSettled([
      analyticsApi.getOverview(),
      analyticsApi.getByType(),
      analyticsApi.getByFuel(),
      analyticsApi.getByTransmission(),
      analyticsApi.getByYear(),
      analyticsApi.getPriceDistribution(),
      analyticsApi.getBrandRanking(),
    ]);

    const keys: AnalyticsSection[] = [
      "overview",
      "byType",
      "byFuel",
      "byTransmission",
      "byYear",
      "priceDistribution",
      "brandRanking",
    ];

    const newErrors: AnalyticsErrors = { ...DEFAULT_ERRORS };
    let allOk = true;

    const dataUpdates: Record<string, unknown> = {};

    results.forEach((result, i) => {
      const key = keys[i]!;
      if (
        result.status === "fulfilled" &&
        result.value.success &&
        result.value.data
      ) {
        dataUpdates[key] = result.value.data;
      } else {
        allOk = false;
        if (result.status === "rejected") {
          newErrors[key] =
            result.reason instanceof Error
              ? result.reason.message
              : "Error de conexion";
        } else {
          newErrors[key] = result.value.error ?? "Error desconocido";
        }
      }
    });

    set({
      ...dataUpdates,
      isLoading: false,
      errors: newErrors,
      lastFetched: allOk ? Date.now() : null,
    });
  },

  fetchSection: async (section) => {
    const state = get();
    set({
      sectionLoading: { ...state.sectionLoading, [section]: true },
      errors: { ...state.errors, [section]: null },
    });

    try {
      const result = await SECTION_API_MAP[section]();
      const current = get();

      if (result.success && result.data) {
        const updated = {
          ...current,
          [section]: result.data,
          sectionLoading: { ...current.sectionLoading, [section]: false },
        };
        set({
          [section]: result.data,
          sectionLoading: { ...current.sectionLoading, [section]: false },
          lastFetched: checkAllComplete(updated) ? Date.now() : current.lastFetched,
        });
      } else {
        set({
          errors: {
            ...current.errors,
            [section]: result.error ?? "Error desconocido",
          },
          sectionLoading: { ...current.sectionLoading, [section]: false },
          lastFetched: null,
        });
      }
    } catch (err) {
      const current = get();
      set({
        errors: {
          ...current.errors,
          [section]: err instanceof Error ? err.message : "Error de conexion",
        },
        sectionLoading: { ...current.sectionLoading, [section]: false },
        lastFetched: null,
      });
    }
  },

  clearCache: () =>
    set({
      overview: null,
      byType: null,
      byFuel: null,
      byTransmission: null,
      byYear: null,
      priceDistribution: null,
      brandRanking: null,
      errors: { ...DEFAULT_ERRORS },
      sectionLoading: { ...DEFAULT_SECTION_LOADING },
      lastFetched: null,
    }),
}));
