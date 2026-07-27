import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketHighlights } from "../MarketHighlights";
import { useAnalyticsStore } from "@/stores/analyticsStore";

vi.mock("@/stores/analyticsStore");

const mockUseAnalyticsStore = vi.mocked(useAnalyticsStore);

function setupStore(overrides: Record<string, unknown> = {}) {
  const defaults = {
    brandRanking: null,
    byType: null,
    byFuel: null,
    byTransmission: null,
    byYear: null,
    priceDistribution: null,
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

describe("MarketHighlights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 6 chart section headers", () => {
    setupStore();
    render(<MarketHighlights />);
    expect(screen.getByText("Top Marcas por Listings")).toBeDefined();
    expect(screen.getByText(/Vehiculos por Ano|Precio Promedio por Ano/)).toBeDefined();
    expect(screen.getByText("Distribucion por Tipo")).toBeDefined();
    expect(screen.getByText("Distribucion por Combustible")).toBeDefined();
    expect(screen.getByText("Distribucion por Transmision")).toBeDefined();
    expect(screen.getByText("Distribucion de Precios")).toBeDefined();
  });

  it("renders section titles as heading elements", () => {
    setupStore();
    render(<MarketHighlights />);
    const heading = screen.getByText("Destacados del Mercado");
    expect(heading.tagName).toMatch(/H[1-6]/);
  });

  it("shows error state for a section with error", () => {
    setupStore({
      errors: {
        overview: null,
        byType: "Error loading type data",
        byFuel: null,
        byTransmission: null,
        byYear: null,
        priceDistribution: null,
        brandRanking: null,
      },
    });
    render(<MarketHighlights />);
    expect(screen.getByText("Error loading type data")).toBeDefined();
    expect(screen.getByText("Reintentar")).toBeDefined();
  });

  it("shows loading only when sectionLoading and no data", () => {
    setupStore({
      sectionLoading: {
        overview: false,
        byType: true,
        byFuel: false,
        byTransmission: false,
        byYear: false,
        priceDistribution: false,
        brandRanking: false,
      },
    });
    const { container } = render(<MarketHighlights />);
    const skeletons = container.querySelectorAll(".animate-ax-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
