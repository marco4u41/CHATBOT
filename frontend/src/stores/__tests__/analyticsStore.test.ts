import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAnalyticsStore } from "../analyticsStore";

vi.mock("@/api/analytics", () => ({
  analyticsApi: {
    getOverview: vi.fn(),
    getByType: vi.fn(),
    getByFuel: vi.fn(),
    getByTransmission: vi.fn(),
    getByYear: vi.fn(),
    getPriceDistribution: vi.fn(),
    getBrandRanking: vi.fn(),
  },
}));

import { analyticsApi } from "@/api/analytics";
const mockApi = vi.mocked(analyticsApi);

function ok<T>(data: T) {
  return Promise.resolve({ success: true as const, data });
}

function fail(error: string) {
  return Promise.resolve({ success: false as const, error });
}

function rejectWith(msg: string) {
  return Promise.reject(new Error(msg));
}

function rejectString(msg: string) {
  return Promise.reject(msg);
}

const allEndpoints = [
  "getOverview",
  "getByType",
  "getByFuel",
  "getByTransmission",
  "getByYear",
  "getPriceDistribution",
  "getBrandRanking",
] as const;

function mockAllOk() {
  for (const ep of allEndpoints) {
    mockApi[ep].mockReturnValue(ok({ count: 10 }) as any);
  }
}

describe("analyticsStore", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useAnalyticsStore.setState({
      overview: null,
      byType: null,
      byFuel: null,
      byTransmission: null,
      byYear: null,
      priceDistribution: null,
      brandRanking: null,
      isLoading: false,
      errors: {
        overview: null,
        byType: null,
        byFuel: null,
        byTransmission: null,
        byYear: null,
        priceDistribution: null,
        brandRanking: null,
      },
      lastFetched: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches all data and stores it on success", async () => {
    mockAllOk();
    vi.setSystemTime(5000);
    await useAnalyticsStore.getState().fetchAll();

    const state = useAnalyticsStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.overview).toEqual({ count: 10 });
    expect(state.byType).toEqual({ count: 10 });
    expect(state.byFuel).toEqual({ count: 10 });
    expect(state.byTransmission).toEqual({ count: 10 });
    expect(state.byYear).toEqual({ count: 10 });
    expect(state.priceDistribution).toEqual({ count: 10 });
    expect(state.brandRanking).toEqual({ count: 10 });
    expect(state.lastFetched).toBe(5000);
    expect(state.errors.overview).toBeNull();
  });

  it("sets isLoading to true during fetch", async () => {
    let resolveAll!: (value?: unknown) => void;
    const pending = new Promise((r) => (resolveAll = r));

    for (const ep of allEndpoints) {
      mockApi[ep].mockReturnValue(pending as any);
    }

    const fetchPromise = useAnalyticsStore.getState().fetchAll();
    expect(useAnalyticsStore.getState().isLoading).toBe(true);

    resolveAll({ success: true, data: {} });
    await fetchPromise;

    expect(useAnalyticsStore.getState().isLoading).toBe(false);
  });

  it("handles partial errors — sets per-section error but keeps successful data", async () => {
    mockApi.getOverview.mockReturnValue(ok({ overview: true }) as any);
    mockApi.getByType.mockReturnValue(fail("500 error"));
    mockApi.getByFuel.mockReturnValue(ok({ fuel: true }) as any);
    mockApi.getByTransmission.mockReturnValue(ok({ trans: true }) as any);
    mockApi.getByYear.mockReturnValue(ok({ year: true }) as any);
    mockApi.getPriceDistribution.mockReturnValue(ok({ price: true }) as any);
    mockApi.getBrandRanking.mockReturnValue(ok({ brand: true }) as any);

    vi.setSystemTime(5000);
    await useAnalyticsStore.getState().fetchAll();

    const state = useAnalyticsStore.getState();
    expect(state.overview).toEqual({ overview: true });
    expect(state.byType).toBeNull();
    expect(state.errors.byType).toBe("500 error");
    expect(state.lastFetched).toBeNull();
  });

  it("handles Promise rejection (network error)", async () => {
    mockAllOk();
    mockApi.getOverview.mockReturnValue(rejectWith("Network fail"));

    await useAnalyticsStore.getState().fetchAll();

    const state = useAnalyticsStore.getState();
    expect(state.errors.overview).toBe("Network fail");
    expect(state.lastFetched).toBeNull();
  });

  it("handles non-Error rejection", async () => {
    mockAllOk();
    mockApi.getOverview.mockReturnValue(rejectString("string error"));

    await useAnalyticsStore.getState().fetchAll();

    expect(useAnalyticsStore.getState().errors.overview).toBe(
      "Error de conexion",
    );
  });

  it("uses cache when data is fresh", async () => {
    mockAllOk();
    vi.setSystemTime(5000);
    await useAnalyticsStore.getState().fetchAll();
    expect(mockApi.getOverview).toHaveBeenCalledTimes(1);

    vi.setSystemTime(6000);
    await useAnalyticsStore.getState().fetchAll();
    expect(mockApi.getOverview).toHaveBeenCalledTimes(1);
  });

  it("ignores cache when force=true", async () => {
    mockAllOk();
    vi.setSystemTime(5000);
    await useAnalyticsStore.getState().fetchAll();

    vi.setSystemTime(6000);
    await useAnalyticsStore.getState().fetchAll(true);

    expect(mockApi.getOverview).toHaveBeenCalledTimes(2);
  });

  it("ignores cache when TTL expired", async () => {
    mockAllOk();
    vi.setSystemTime(5000);
    await useAnalyticsStore.getState().fetchAll();

    vi.setSystemTime(5000 + 5 * 60 * 1000 + 1);
    await useAnalyticsStore.getState().fetchAll();

    expect(mockApi.getOverview).toHaveBeenCalledTimes(2);
  });

  it("clearCache resets everything", async () => {
    mockAllOk();
    vi.setSystemTime(5000);
    await useAnalyticsStore.getState().fetchAll();
    expect(useAnalyticsStore.getState().overview).not.toBeNull();

    useAnalyticsStore.getState().clearCache();

    const state = useAnalyticsStore.getState();
    expect(state.overview).toBeNull();
    expect(state.byType).toBeNull();
    expect(state.lastFetched).toBeNull();
    expect(state.errors.overview).toBeNull();
  });

  it("all success keeps lastFetched set; any failure resets to null", async () => {
    mockAllOk();
    vi.setSystemTime(5000);
    await useAnalyticsStore.getState().fetchAll();
    expect(useAnalyticsStore.getState().lastFetched).toBe(5000);

    vi.setSystemTime(5000 + 5 * 60 * 1000 + 2);
    mockApi.getByType.mockReturnValue(fail("fail"));
    await useAnalyticsStore.getState().fetchAll();
    expect(useAnalyticsStore.getState().lastFetched).toBeNull();
  });
});
