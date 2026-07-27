import { apiClient } from "./client";
import type {
  AnalyticsOverviewData,
  VehicleTypeData,
  VehicleFuelData,
  VehicleTransmissionData,
  VehicleYearData,
  VehiclePriceData,
  BrandRankingData,
  ChartPoint,
} from "@/types/analytics";

const BASE = "/analytics";

export const analyticsApi = {
  getOverview: () =>
    apiClient.getUnwrapped<AnalyticsOverviewData>(`${BASE}/overview`),

  getByType: () =>
    apiClient.getUnwrapped<VehicleTypeData>(`${BASE}/vehicles/by-type`),

  getByFuel: () =>
    apiClient.getUnwrapped<VehicleFuelData>(`${BASE}/vehicles/by-fuel`),

  getByTransmission: () =>
    apiClient.getUnwrapped<VehicleTransmissionData>(
      `${BASE}/vehicles/by-transmission`,
    ),

  getByYear: () =>
    apiClient.getUnwrapped<VehicleYearData>(`${BASE}/vehicles/by-year`),

  getPriceDistribution: () =>
    apiClient.getUnwrapped<VehiclePriceData>(
      `${BASE}/vehicles/price-distribution`,
    ),

  getBrandRanking: (limit = 10) =>
    apiClient.getUnwrapped<BrandRankingData>(
      `${BASE}/brands/top?limit=${limit}`,
    ),
};

export function adaptTypeDistribution(
  data: VehicleTypeData,
): ChartPoint[] {
  return data.data.map((d) => ({
    label: d.vehicle_type ?? "Otro",
    value: d.count,
  }));
}

export function adaptFuelDistribution(
  data: VehicleFuelData,
): ChartPoint[] {
  return data.data.map((d) => ({
    label: d.fuel ?? "Otro",
    value: d.count,
  }));
}

export function adaptTransmissionDistribution(
  data: VehicleTransmissionData,
): ChartPoint[] {
  return data.data.map((d) => ({
    label: d.transmission ?? "Otro",
    value: d.count,
  }));
}

export function adaptYearCount(data: VehicleYearData): ChartPoint[] {
  return data.data.map((d) => ({
    label: String(d.year),
    value: d.count,
  }));
}

export function adaptYearAvgPrice(data: VehicleYearData): ChartPoint[] {
  return data.data.map((d) => ({
    label: String(d.year),
    value: d.avg_price ?? 0,
  }));
}

export function adaptPriceDistribution(
  data: VehiclePriceData,
): ChartPoint[] {
  return data.data.map((d) => ({
    label: d.price_range,
    value: d.count,
  }));
}

export function adaptBrandRanking(
  data: BrandRankingData,
): ChartPoint[] {
  return data.data.map((d) => ({
    label: d.manufacturer,
    value: d.total_listings ?? 0,
  }));
}
