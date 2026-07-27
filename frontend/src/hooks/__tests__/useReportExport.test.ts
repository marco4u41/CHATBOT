import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReportExport } from "../useReportExport";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useConversationStore } from "@/stores/conversationStore";
import * as ReportService from "@/services/reportService";
import type { Conversation } from "@/types/chat";
import type { SourceData } from "@/services/reportService";

vi.mock("@/services/reportService", () => ({
  generate: vi.fn(),
  downloadFile: vi.fn(),
}));

const mockGenerate = vi.mocked(ReportService.generate);
const mockDownloadFile = vi.mocked(ReportService.downloadFile);

const mockOverview = {
  success: true,
  vehicles: { success: true, total_vehicles: 100, avg_price: 18500, total_brands: 5, total_models: 10 },
  conversations: { success: true, total_conversations: 5, total_messages: 20, avg_messages_per_conversation: 4 },
};

const mockBrandRanking = {
  success: true,
  count: 1,
  limit: 10,
  data: [{ brand_id: 1, manufacturer: "Toyota", model_count: 5, year_count: 3, total_listings: 100, average_price: 22000 }],
};

function setupAnalyticsStore(overrides: Record<string, unknown> = {}) {
  const state = useAnalyticsStore.getState();
  useAnalyticsStore.setState({
    ...state,
    overview: mockOverview,
    brandRanking: mockBrandRanking,
    byType: { success: true, count: 1, data: [{ vehicle_type: "SUV", count: 50, avg_price: 28000 }] },
    byFuel: { success: true, count: 1, data: [{ fuel: "Gasolina", count: 60, avg_price: 20000 }] },
    byTransmission: { success: true, count: 1, data: [{ transmission: "Automatica", count: 80 }] },
    byYear: { success: true, count: 1, data: [{ year: 2024, count: 40, avg_price: 32000 }] },
    priceDistribution: { success: true, count: 1, data: [{ price_range: "10000-20000", count: 30 }] },
    lastFetched: Date.now(),
    errors: {
      overview: null,
      byType: null,
      byFuel: null,
      byTransmission: null,
      byYear: null,
      priceDistribution: null,
      brandRanking: null,
    },
    ...overrides,
  });
}

function setupConversationStore(conversations: Conversation[] = []) {
  useConversationStore.setState({
    conversations,
    activeId: null,
    isLoading: false,
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-25T20:30:45.000Z"));

  setupAnalyticsStore();
  setupConversationStore([
    { id: "1", title: "Conv 1", created_at: "2026-07-20T10:00:00Z", updated_at: "2026-07-25T14:00:00Z", message_count: 5 },
    { id: "2", title: "Conv 2", created_at: "2026-07-22T10:00:00Z", updated_at: "2026-07-24T10:00:00Z", message_count: 3 },
  ]);

  mockGenerate.mockReturnValue({
    blob: new Blob(["test"], { type: "text/csv" }),
    filename: "test.csv",
  });
});

describe("useReportExport", () => {
  it("starts with idle status", () => {
    const { result } = renderHook(() => useReportExport());
    expect(result.current.status).toBe("idle");
    expect(result.current.errorMessage).toBeNull();
  });

  it("exports individual report with cache valid (no fetch)", async () => {
    const fetchSectionSpy = vi.spyOn(useAnalyticsStore.getState(), "fetchSection");

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("brandRanking", "csv");
    });

    expect(fetchSectionSpy).not.toHaveBeenCalled();
    expect(mockGenerate).toHaveBeenCalled();
    expect(mockDownloadFile).toHaveBeenCalled();
    expect(result.current.status).toBe("success");

    fetchSectionSpy.mockRestore();
  });

  it("exports individual report after fetchSection when cache expired", async () => {
    setupAnalyticsStore({ lastFetched: null, brandRanking: null });
    const fetchSectionSpy = vi.spyOn(
      useAnalyticsStore.getState(),
      "fetchSection",
    ).mockImplementation(async () => {
      useAnalyticsStore.setState({
        brandRanking: mockBrandRanking,
      });
    });

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("brandRanking", "csv");
    });

    expect(fetchSectionSpy).toHaveBeenCalledWith("brandRanking");
    expect(mockGenerate).toHaveBeenCalled();
    expect(result.current.status).toBe("success");

    fetchSectionSpy.mockRestore();
  });

  it("exports after fetchSection even if lastFetched is still null", async () => {
    setupAnalyticsStore({ lastFetched: null, brandRanking: null });
    vi.spyOn(
      useAnalyticsStore.getState(),
      "fetchSection",
    ).mockImplementation(async () => {
      useAnalyticsStore.setState({
        brandRanking: mockBrandRanking,
        lastFetched: null,
      });
    });

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("brandRanking", "csv");
    });

    expect(result.current.status).toBe("success");
    expect(mockGenerate).toHaveBeenCalled();
  });

  it("fullDashboard with cache valid does not fetch", async () => {
    const fetchAllSpy = vi.spyOn(useAnalyticsStore.getState(), "fetchAll");

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("fullDashboard", "json");
    });

    expect(fetchAllSpy).not.toHaveBeenCalled();
    expect(mockGenerate).toHaveBeenCalled();
    expect(result.current.status).toBe("success");

    fetchAllSpy.mockRestore();
  });

  it("fullDashboard without cache does fetchAll", async () => {
    setupAnalyticsStore({ lastFetched: null });
    const fetchAllSpy = vi.spyOn(
      useAnalyticsStore.getState(),
      "fetchAll",
    ).mockImplementation(async () => {
      useAnalyticsStore.setState({ lastFetched: Date.now() });
    });

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("fullDashboard", "json");
    });

    expect(fetchAllSpy).toHaveBeenCalledWith(true);
    expect(result.current.status).toBe("success");

    fetchAllSpy.mockRestore();
  });

  it("fullDashboard includes recentActivity in sourceData", async () => {
    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("fullDashboard", "json");
    });

    const sourceData = mockGenerate.mock.calls[0]![0] as SourceData;
    expect(sourceData.recentActivity).toBeDefined();
    expect(sourceData.recentActivity).toHaveLength(2);
  });

  it("fullDashboard with CSV shows error", async () => {
    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("fullDashboard", "csv");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toContain("solo soporta JSON");
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("fullDashboard with section error shows error state", async () => {
    setupAnalyticsStore({
      lastFetched: Date.now(),
      errors: {
        overview: null,
        byType: "Network error",
        byFuel: null,
        byTransmission: null,
        byYear: null,
        priceDistribution: null,
        brandRanking: null,
      },
    });

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("fullDashboard", "json");
    });

    expect(result.current.status).toBe("error");
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("recentActivity does not fetch from analytics", async () => {
    const fetchSectionSpy = vi.spyOn(useAnalyticsStore.getState(), "fetchSection");
    const fetchAllSpy = vi.spyOn(useAnalyticsStore.getState(), "fetchAll");

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("recentActivity", "csv");
    });

    expect(fetchSectionSpy).not.toHaveBeenCalled();
    expect(fetchAllSpy).not.toHaveBeenCalled();
    expect(mockGenerate).toHaveBeenCalled();
    expect(result.current.status).toBe("success");

    fetchSectionSpy.mockRestore();
    fetchAllSpy.mockRestore();
  });

  it("recentActivity sorts by updated_at descending and takes 5", async () => {
    setupConversationStore([
      { id: "1", title: "Oldest", created_at: "2026-07-01T10:00:00Z", updated_at: "2026-07-01T10:00:00Z", message_count: 1 },
      { id: "2", title: "Newest", created_at: "2026-07-25T10:00:00Z", updated_at: "2026-07-25T10:00:00Z", message_count: 10 },
      { id: "3", title: "Middle", created_at: "2026-07-15T10:00:00Z", updated_at: "2026-07-15T10:00:00Z", message_count: 5 },
    ]);

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("recentActivity", "csv");
    });

    const sourceData = mockGenerate.mock.calls[0]![0] as SourceData;
    expect(sourceData.recentActivity).toHaveLength(3);
    const activity = sourceData.recentActivity as Conversation[];
    expect(activity[0]!.title).toBe("Newest");
    expect(activity[1]!.title).toBe("Middle");
    expect(activity[2]!.title).toBe("Oldest");
  });

  it("recentActivity with empty conversations generates empty array", async () => {
    setupConversationStore([]);

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("recentActivity", "csv");
    });

    const sourceData = mockGenerate.mock.calls[0]![0] as SourceData;
    expect(sourceData.recentActivity).toHaveLength(0);
    expect(result.current.status).toBe("success");
  });

  it("recentActivity does not mutate the store", async () => {
    const original = [
      { id: "1", title: "A", created_at: "2026-07-20T10:00:00Z", updated_at: "2026-07-25T10:00:00Z", message_count: 1 },
      { id: "2", title: "B", created_at: "2026-07-22T10:00:00Z", updated_at: "2026-07-24T10:00:00Z", message_count: 2 },
    ];
    setupConversationStore(original);

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("recentActivity", "csv");
    });

    const storeConversations = useConversationStore.getState().conversations as Conversation[];
    expect(storeConversations).toHaveLength(2);
    expect(storeConversations[0]!.id).toBe("1");
  });

  it("blocks double submit during loading", async () => {
    let resolveFetch!: () => void;
    vi.spyOn(
      useAnalyticsStore.getState(),
      "fetchSection",
    ).mockImplementation(
      () => new Promise<void>((r) => { resolveFetch = r; }),
    );

    setupAnalyticsStore({ brandRanking: null });

    const { result } = renderHook(() => useReportExport());

    act(() => {
      result.current.exportReport("brandRanking", "csv");
    });

    expect(result.current.status).toBe("loading");

    await act(async () => {
      useAnalyticsStore.setState({ brandRanking: mockBrandRanking });
      resolveFetch();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("success");
  });

  it("clearStatus resets to idle", async () => {
    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("brandRanking", "csv");
    });

    expect(result.current.status).toBe("success");

    act(() => {
      result.current.clearStatus();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.errorMessage).toBeNull();
  });

  it("sets error when section has error after fetch", async () => {
    setupAnalyticsStore({ lastFetched: null, brandRanking: null });
    vi.spyOn(
      useAnalyticsStore.getState(),
      "fetchSection",
    ).mockImplementation(async () => {
      useAnalyticsStore.setState({
        errors: {
          ...useAnalyticsStore.getState().errors,
          brandRanking: "API error",
        },
      });
    });

    const { result } = renderHook(() => useReportExport());

    await act(async () => {
      await result.current.exportReport("brandRanking", "csv");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toContain("no disponibles");
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
