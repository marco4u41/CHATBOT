import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyticsApi,
  adaptTypeDistribution,
  adaptFuelDistribution,
  adaptTransmissionDistribution,
  adaptYearCount,
  adaptYearAvgPrice,
  adaptPriceDistribution,
  adaptBrandRanking,
} from "../analytics";
import type {
  VehicleTypeData,
  VehicleFuelData,
  VehicleTransmissionData,
  VehicleYearData,
  VehiclePriceData,
  BrandRankingData,
} from "@/types/analytics";

vi.mock("../client", () => ({
  apiClient: {
    getUnwrapped: vi.fn(),
  },
}));

import { apiClient } from "../client";
const mockGet = vi.mocked(apiClient.getUnwrapped);

describe("analyticsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getOverview calls correct path", async () => {
    mockGet.mockResolvedValue({ success: true, data: { overview: true } });
    await analyticsApi.getOverview();
    expect(mockGet).toHaveBeenCalledWith("/analytics/overview");
  });

  it("getByType calls correct path", async () => {
    mockGet.mockResolvedValue({ success: true, data: {} });
    await analyticsApi.getByType();
    expect(mockGet).toHaveBeenCalledWith("/analytics/vehicles/by-type");
  });

  it("getByFuel calls correct path", async () => {
    mockGet.mockResolvedValue({ success: true, data: {} });
    await analyticsApi.getByFuel();
    expect(mockGet).toHaveBeenCalledWith("/analytics/vehicles/by-fuel");
  });

  it("getByTransmission calls correct path", async () => {
    mockGet.mockResolvedValue({ success: true, data: {} });
    await analyticsApi.getByTransmission();
    expect(mockGet).toHaveBeenCalledWith("/analytics/vehicles/by-transmission");
  });

  it("getByYear calls correct path", async () => {
    mockGet.mockResolvedValue({ success: true, data: {} });
    await analyticsApi.getByYear();
    expect(mockGet).toHaveBeenCalledWith("/analytics/vehicles/by-year");
  });

  it("getPriceDistribution calls correct path", async () => {
    mockGet.mockResolvedValue({ success: true, data: {} });
    await analyticsApi.getPriceDistribution();
    expect(mockGet).toHaveBeenCalledWith("/analytics/vehicles/price-distribution");
  });

  it("getBrandRanking calls correct path with default limit", async () => {
    mockGet.mockResolvedValue({ success: true, data: {} });
    await analyticsApi.getBrandRanking();
    expect(mockGet).toHaveBeenCalledWith("/analytics/brands/top?limit=10");
  });

  it("getBrandRanking calls correct path with custom limit", async () => {
    mockGet.mockResolvedValue({ success: true, data: {} });
    await analyticsApi.getBrandRanking(25);
    expect(mockGet).toHaveBeenCalledWith("/analytics/brands/top?limit=25");
  });
});

describe("adaptTypeDistribution", () => {
  it("maps vehicle_type and count correctly", () => {
    const data: VehicleTypeData = {
      success: true,
      count: 3,
      data: [
        { vehicle_type: "SUV", count: 10, avg_price: 50000 },
        { vehicle_type: "Sedan", count: 20, avg_price: 30000 },
        { vehicle_type: null, count: 5, avg_price: null },
      ],
    };

    const result = adaptTypeDistribution(data);
    expect(result).toEqual([
      { label: "SUV", value: 10 },
      { label: "Sedan", value: 20 },
      { label: "Otro", value: 5 },
    ]);
  });
});

describe("adaptFuelDistribution", () => {
  it("maps fuel and count, replacing null with Otro", () => {
    const data: VehicleFuelData = {
      success: true,
      count: 2,
      data: [
        { fuel: "Gasolina", count: 30, avg_price: 40000 },
        { fuel: null, count: 10, avg_price: null },
      ],
    };

    const result = adaptFuelDistribution(data);
    expect(result).toEqual([
      { label: "Gasolina", value: 30 },
      { label: "Otro", value: 10 },
    ]);
  });
});

describe("adaptTransmissionDistribution", () => {
  it("maps transmission and count", () => {
    const data: VehicleTransmissionData = {
      success: true,
      count: 2,
      data: [
        { transmission: "Automatica", count: 50 },
        { transmission: "Manual", count: 30 },
      ],
    };

    const result = adaptTransmissionDistribution(data);
    expect(result).toEqual([
      { label: "Automatica", value: 50 },
      { label: "Manual", value: 30 },
    ]);
  });
});

describe("adaptYearCount", () => {
  it("converts year to string label", () => {
    const data: VehicleYearData = {
      success: true,
      count: 2,
      data: [
        { year: 2020, count: 15, avg_price: 25000 },
        { year: 2021, count: 25, avg_price: 30000 },
      ],
    };

    const result = adaptYearCount(data);
    expect(result).toEqual([
      { label: "2020", value: 15 },
      { label: "2021", value: 25 },
    ]);
  });
});

describe("adaptYearAvgPrice", () => {
  it("maps avg_price, defaulting null to 0", () => {
    const data: VehicleYearData = {
      success: true,
      count: 2,
      data: [
        { year: 2020, count: 15, avg_price: 25000 },
        { year: 2021, count: 25, avg_price: null },
      ],
    };

    const result = adaptYearAvgPrice(data);
    expect(result).toEqual([
      { label: "2020", value: 25000 },
      { label: "2021", value: 0 },
    ]);
  });
});

describe("adaptPriceDistribution", () => {
  it("maps price_range and count", () => {
    const data: VehiclePriceData = {
      success: true,
      count: 2,
      data: [
        { price_range: "$0-$20k", count: 40 },
        { price_range: "$20k-$50k", count: 60 },
      ],
    };

    const result = adaptPriceDistribution(data);
    expect(result).toEqual([
      { label: "$0-$20k", value: 40 },
      { label: "$20k-$50k", value: 60 },
    ]);
  });
});

describe("adaptBrandRanking", () => {
  it("maps manufacturer and total_listings, defaulting null to 0", () => {
    const data: BrandRankingData = {
      success: true,
      count: 2,
      limit: 10,
      data: [
        {
          brand_id: 1,
          manufacturer: "Toyota",
          model_count: 5,
          year_count: 3,
          total_listings: 100,
          average_price: 45000,
        },
        {
          brand_id: 2,
          manufacturer: "Honda",
          model_count: 3,
          year_count: 2,
          total_listings: null,
          average_price: 35000,
        },
      ],
    };

    const result = adaptBrandRanking(data);
    expect(result).toEqual([
      { label: "Toyota", value: 100 },
      { label: "Honda", value: 0 },
    ]);
  });
});
