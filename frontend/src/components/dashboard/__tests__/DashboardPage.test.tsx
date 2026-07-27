import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardPage } from "../DashboardPage";
import { useAnalyticsStore } from "@/stores/analyticsStore";

vi.mock("@/stores/analyticsStore");

const mockUseAnalyticsStore = vi.mocked(useAnalyticsStore);
const fetchAll = vi.fn().mockResolvedValue(undefined);

function setupStore(overrides: Record<string, unknown> = {}) {
  const defaults = {
    isLoading: false,
    overview: null,
    fetchAll,
    sectionLoading: {
      overview: false, byType: false, byFuel: false,
      byTransmission: false, byYear: false, priceDistribution: false, brandRanking: false,
    },
    errors: {
      overview: null, byType: null, byFuel: null,
      byTransmission: null, byYear: null, priceDistribution: null, brandRanking: null,
    },
    brandRanking: null, byType: null, byFuel: null, byTransmission: null,
    byYear: null, priceDistribution: null,
    ...overrides,
  };

  mockUseAnalyticsStore.mockImplementation(((selector: (s: unknown) => unknown) =>
    selector(defaults)) as typeof useAnalyticsStore);
}

describe("DashboardPage", () => {
  const onNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls fetchAll on mount", () => {
    setupStore();
    render(<DashboardPage onNavigate={onNavigate} />);
    expect(fetchAll).toHaveBeenCalledTimes(1);
  });

  it("shows skeleton when loading and no overview", () => {
    setupStore({ isLoading: true, overview: null });
    const { container } = render(<DashboardPage onNavigate={onNavigate} />);
    const skeletons = container.querySelectorAll(".animate-ax-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders dashboard sections when data is loaded", () => {
    setupStore({
      overview: {
        vehicles: { total_vehicles: 100, avg_price: 20000, total_brands: 5, total_models: 10 },
        conversations: { total_conversations: 3, total_messages: 10, avg_messages_per_conversation: 3 },
      },
    });
    render(<DashboardPage onNavigate={onNavigate} />);
    expect(screen.getByText("Acciones Rapidas")).toBeDefined();
    expect(screen.getByText("Actividad Reciente")).toBeDefined();
    expect(screen.getByText("Destacados del Mercado")).toBeDefined();
  });

  it("shows refresh indicator when loading with existing data", () => {
    setupStore({
      isLoading: true,
      overview: {
        vehicles: { total_vehicles: 100, avg_price: 20000, total_brands: 5, total_models: 10 },
        conversations: { total_conversations: 3, total_messages: 10, avg_messages_per_conversation: 3 },
      },
    });
    render(<DashboardPage onNavigate={onNavigate} />);
    expect(screen.getByText("Actualizando...")).toBeDefined();
  });

  it("has tabIndex=-1 on dashboard wrapper for focus management", () => {
    setupStore({
      overview: {
        vehicles: { total_vehicles: 100, avg_price: 20000, total_brands: 5, total_models: 10 },
        conversations: { total_conversations: 3, total_messages: 10, avg_messages_per_conversation: 3 },
      },
    });
    render(<DashboardPage onNavigate={onNavigate} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.getAttribute("tabindex")).toBe("-1");
  });
});
