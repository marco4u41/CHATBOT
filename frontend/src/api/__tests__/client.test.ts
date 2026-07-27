import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../client";

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

function errorResponse(status: number, body: unknown) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe("apiClient.getUnwrapped", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns success with data on valid JSON response", async () => {
    const payload = { total: 42 };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ total: 42 }),
    );

    const result = await apiClient.getUnwrapped<{ total: number }>(
      "/analytics/overview",
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
  });

  it("returns error on HTTP 500 with detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      errorResponse(500, { detail: "Internal error" }),
    );

    const result = await apiClient.getUnwrapped("/analytics/overview");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Internal error");
  });

  it("returns error on HTTP 500 without detail field", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      errorResponse(500, { message: "oops" }),
    );

    const result = await apiClient.getUnwrapped("/analytics/overview");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error del servidor");
  });

  it("returns error on empty response body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    } as Response);

    const result = await apiClient.getUnwrapped("/analytics/overview");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Respuesta vacia del servidor");
  });

  it("returns error on invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve("NOT JSON{{{"),
    } as Response);

    const result = await apiClient.getUnwrapped("/analytics/overview");

    expect(result.success).toBe(false);
    expect(result.error).toBe("JSON invalido del servidor");
  });

  it("returns error on network failure (TypeError)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    const result = await apiClient.getUnwrapped("/analytics/overview");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error de conexion");
  });

  it("returns error on unknown exception", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue("string error");

    const result = await apiClient.getUnwrapped("/analytics/overview");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error desconocido");
  });

  it("never throws — always returns ApiResponse", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("boom"),
    );

    await expect(
      apiClient.getUnwrapped("/test"),
    ).resolves.toBeDefined();
  });
});
