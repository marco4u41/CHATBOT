import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useChartDimensions } from "../useChartDimensions";

describe("useChartDimensions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns default dimensions when no element", () => {
    const { result } = renderHook(() => useChartDimensions(300, 150));
    const [ref, dims] = result.current;
    expect(ref.current).toBeNull();
    expect(dims).toEqual({ width: 300, height: 150 });
  });

  it("returns default dimensions with default params", () => {
    const { result } = renderHook(() => useChartDimensions());
    const [, dims] = result.current;
    expect(dims).toEqual({ width: 400, height: 200 });
  });

  it("returns a ref object", () => {
    const { result } = renderHook(() => useChartDimensions());
    const [ref] = result.current;
    expect(ref).toHaveProperty("current");
  });
});
