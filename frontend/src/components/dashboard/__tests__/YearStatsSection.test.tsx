import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { YearStatsSection } from "../YearStatsSection";
import { useAnalyticsStore } from "@/stores/analyticsStore";

vi.mock("@/stores/analyticsStore");

const mockUseAnalyticsStore = vi.mocked(useAnalyticsStore);

function setupStore(overrides: Record<string, unknown> = {}) {
  const defaults = {
    byYear: null,
    sectionLoading: {
      overview: false,
      byType: false,
      byFuel: false,
      byTransmission: false,
      byYear: false,
      priceDistribution: false,
      brandRanking: false,
    },
    errors: {
      overview: null,
      byType: null,
      byFuel: null,
      byTransmission: null,
      byYear: null,
      priceDistribution: null,
      brandRanking: null,
    },
    fetchSection: vi.fn(),
    ...overrides,
  };

  mockUseAnalyticsStore.mockImplementation(((selector: (s: unknown) => unknown) =>
    selector(defaults)) as typeof useAnalyticsStore);
}

describe("YearStatsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows default metric as count", () => {
    setupStore({
      byYear: {
        success: true,
        count: 2,
        data: [
          { year: 2024, count: 100, avg_price: 25000 },
          { year: 2023, count: 80, avg_price: 22000 },
        ],
      },
    });
    render(<YearStatsSection />);
    expect(screen.getByText("Vehiculos por Ano")).toBeDefined();
  });

  it("switches to avgPrice when clicking Precio button", () => {
    setupStore({
      byYear: {
        success: true,
        count: 2,
        data: [
          { year: 2024, count: 100, avg_price: 25000 },
          { year: 2023, count: 80, avg_price: 22000 },
        ],
      },
    });
    render(<YearStatsSection />);
    fireEvent.click(screen.getByText("Precio"));
    expect(screen.getByText("Precio Promedio por Ano")).toBeDefined();
  });

  it("shows error state with retry", () => {
    setupStore({
      errors: {
        overview: null,
        byType: null,
        byFuel: null,
        byTransmission: null,
        byYear: "Failed to load",
        priceDistribution: null,
        brandRanking: null,
      },
    });
    render(<YearStatsSection />);
    expect(screen.getByText("Failed to load")).toBeDefined();
    expect(screen.getByText("Reintentar")).toBeDefined();
  });
});
