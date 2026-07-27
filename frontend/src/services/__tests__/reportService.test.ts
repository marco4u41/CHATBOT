import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generate,
  generateFilename,
  sanitizeFilename,
  escapeCsvField,
  toCsv,
  downloadFile,
} from "../reportService";
import type { SourceData } from "../reportService";

const FIXED_DATE = "2026-07-25T20:30:45.000Z";

const mockOverview: SourceData["overview"] = {
  success: true,
  vehicles: {
    success: true,
    total_vehicles: 47030,
    avg_price: 18500,
    total_brands: 40,
    total_models: 200,
  },
  conversations: {
    success: true,
    total_conversations: 12,
    total_messages: 48,
    avg_messages_per_conversation: 4,
  },
};

const mockBrandRanking: SourceData["brandRanking"] = {
  success: true,
  count: 2,
  limit: 10,
  data: [
    { brand_id: 1, manufacturer: "Toyota", model_count: 45, year_count: 12, total_listings: 5200, average_price: 22000 },
    { brand_id: 2, manufacturer: "Honda", model_count: 30, year_count: 8, total_listings: 3800, average_price: 19500 },
  ],
};

const mockByType: SourceData["byType"] = {
  success: true,
  count: 2,
  data: [
    { vehicle_type: "SUV", count: 15000, avg_price: 28000 },
    { vehicle_type: "Sedan", count: 12000, avg_price: 18000 },
  ],
};

const mockByFuel: SourceData["byFuel"] = {
  success: true,
  count: 2,
  data: [
    { fuel: "Gasolina", count: 25000, avg_price: 20000 },
    { fuel: "Diesel", count: 10000, avg_price: 35000 },
  ],
};

const mockByTransmission: SourceData["byTransmission"] = {
  success: true,
  count: 2,
  data: [
    { transmission: "Automatica", count: 30000 },
    { transmission: "Manual", count: 17000 },
  ],
};

const mockByYear: SourceData["byYear"] = {
  success: true,
  count: 2,
  data: [
    { year: 2024, count: 8000, avg_price: 32000 },
    { year: 2023, count: 12000, avg_price: 28000 },
  ],
};

const mockPriceDistribution: SourceData["priceDistribution"] = {
  success: true,
  count: 3,
  data: [
    { price_range: "0-10000", count: 5000 },
    { price_range: "10000-20000", count: 12000 },
    { price_range: "20000-30000", count: 8000 },
  ],
};

const mockRecentActivity: SourceData["recentActivity"] = [
  { id: "1", title: "Busqueda SUV", created_at: "2026-07-20T10:00:00Z", updated_at: "2026-07-25T14:00:00Z", message_count: 8 },
  { id: "2", title: "Comparar autos", created_at: "2026-07-22T10:00:00Z", updated_at: "2026-07-24T10:00:00Z", message_count: 5 },
  { id: "3", title: "", created_at: "2026-07-21T10:00:00Z", updated_at: "2026-07-23T10:00:00Z", message_count: 3 },
];

const fullSourceData: SourceData = {
  overview: mockOverview,
  brandRanking: mockBrandRanking,
  byType: mockByType,
  byFuel: mockByFuel,
  byTransmission: mockByTransmission,
  byYear: mockByYear,
  priceDistribution: mockPriceDistribution,
  recentActivity: mockRecentActivity,
};

describe("escapeCsvField", () => {
  it("returns empty string for null", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("converts boolean to string", () => {
    expect(escapeCsvField(true)).toBe("true");
    expect(escapeCsvField(false)).toBe("false");
  });

  it("converts number to string without formula protection", () => {
    expect(escapeCsvField(-5)).toBe("-5");
    expect(escapeCsvField(42)).toBe("42");
  });

  it("wraps fields containing commas", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
  });

  it("duplicates internal double quotes", () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
  });

  it("neutralizes dangerous prefix at start", () => {
    expect(escapeCsvField("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(escapeCsvField("+cmd")).toBe("'+cmd");
    expect(escapeCsvField("-5+3")).toBe("'-5+3");
    expect(escapeCsvField("@ECHO off")).toBe("'@ECHO off");
  });

  it("neutralizes dangerous prefix after whitespace/tabs", () => {
    expect(escapeCsvField("  =SUM(A1)")).toBe("'  =SUM(A1)");
    expect(escapeCsvField("\t@cmd")).toBe("'\t@cmd");
    expect(escapeCsvField("  +import")).toBe("'  +import");
  });

  it("does NOT neutralize negative numbers", () => {
    expect(escapeCsvField(-5)).toBe("-5");
    expect(escapeCsvField(-123.45)).toBe("-123.45");
  });

  it("handles newlines", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("handles unicode characters", () => {
    expect(escapeCsvField("日本語テスト")).toBe("日本語テスト");
    expect(escapeCsvField("café")).toBe("café");
  });

  it("strips embedded BOM", () => {
    expect(escapeCsvField("\uFEFFtext")).toBe("text");
  });
});

describe("toCsv", () => {
  it("generates CSV with headers and rows", () => {
    const result = toCsv(["Name", "Count"], [["Toyota", 5200], ["Honda", 3800]]);
    expect(result).toBe("Name,Count\nToyota,5200\nHonda,3800");
  });

  it("escapes fields with commas", () => {
    const result = toCsv(["Col"], [["a,b"]]);
    expect(result).toBe('Col\n"a,b"');
  });
});

describe("generateFilename", () => {
  it("generates filename with timestamp", () => {
    const result = generateFilename("brandRanking", "csv", FIXED_DATE);
    expect(result).toBe("brandRanking_20260725_203045.csv");
  });

  it("generates JSON extension", () => {
    const result = generateFilename("overview", "json", FIXED_DATE);
    expect(result).toBe("overview_20260725_203045.json");
  });

  it("uses current date when generatedAt is not provided", () => {
    const result = generateFilename("byType", "csv");
    expect(result).toMatch(/^byType_\d{8}_\d{6}\.csv$/);
  });
});

describe("sanitizeFilename", () => {
  it("removes non-alphanumeric characters except _ - .", () => {
    expect(sanitizeFilename("hello world!@#.csv")).toBe("hello_world_.csv");
  });

  it("prevents path traversal", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("etc_passwd");
  });

  it("limits length to 100 characters", () => {
    const long = "a".repeat(150);
    expect(sanitizeFilename(long).length).toBe(100);
  });

  it("returns fallback for empty string", () => {
    expect(sanitizeFilename("")).toBe("reporte");
  });

  it("returns fallback for dot-only names", () => {
    expect(sanitizeFilename(".")).toBe("reporte");
    expect(sanitizeFilename("..")).toBe("reporte");
  });

  it("collapses consecutive underscores", () => {
    expect(sanitizeFilename("a___b")).toBe("a_b");
  });
});

describe("generate", () => {
  it("returns blob and filename for CSV", () => {
    const result = generate({ overview: mockOverview }, "overview", "csv", FIXED_DATE);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.filename).toBe("overview_20260725_203045.csv");
  });

  it("returns blob and filename for JSON", () => {
    const result = generate({ overview: mockOverview }, "overview", "json", FIXED_DATE);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.filename).toBe("overview_20260725_203045.json");
  });

  it("CSV blob has correct MIME type", () => {
    const result = generate({ overview: mockOverview }, "overview", "csv", FIXED_DATE);
    expect(result.blob.type).toBe("text/csv;charset=utf-8");
  });

  it("JSON blob has correct MIME type", () => {
    const result = generate({ overview: mockOverview }, "overview", "json", FIXED_DATE);
    expect(result.blob.type).toBe("application/json;charset=utf-8");
  });

  it("CSV includes BOM UTF-8", async () => {
    const result = generate({ overview: mockOverview }, "overview", "csv", FIXED_DATE);
    const buffer = await result.blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
  });

  it("CSV does not have double BOM", async () => {
    const result = generate({ overview: mockOverview }, "overview", "csv", FIXED_DATE);
    const buffer = await result.blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
    expect(bytes[3]).not.toBe(0xEF);
  });

  it("JSON uses injected generatedAt in metadata", async () => {
    const result = generate({ overview: mockOverview }, "overview", "json", FIXED_DATE);
    const text = await result.blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.metadata.generated_at).toBe(FIXED_DATE);
    expect(parsed.metadata.report_type).toBe("overview");
    expect(parsed.metadata.format_version).toBe("1.0");
  });

  it("uses current date when generatedAt is not provided", async () => {
    const result = generate({ overview: mockOverview }, "overview", "json");
    const text = await result.blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.metadata.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("throws on invalid generatedAt", () => {
    expect(() =>
      generate({ overview: mockOverview }, "overview", "json", "not-a-date"),
    ).toThrow("generatedAt invalido");
  });

  it("generates correct CSV content for overview", async () => {
    const result = generate({ overview: mockOverview }, "overview", "csv", FIXED_DATE);
    const text = await result.blob.text();
    const lines = text.replace("\uFEFF", "").split("\n");
    expect(lines[0]).toBe("Metrica,Valor");
    expect(lines[1]).toContain("Total Vehiculos");
    expect(lines[1]).toContain("47030");
  });

  it("generates correct JSON envelope for brandRanking", async () => {
    const result = generate({ brandRanking: mockBrandRanking }, "brandRanking", "json", FIXED_DATE);
    const text = await result.blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.metadata.report_type).toBe("brandRanking");
    expect(parsed.data.data).toHaveLength(2);
    expect(parsed.data.data[0].manufacturer).toBe("Toyota");
  });

  it("generates CSV for recentActivity", async () => {
    const result = generate({ recentActivity: mockRecentActivity }, "recentActivity", "csv", FIXED_DATE);
    const text = await result.blob.text();
    const lines = text.replace("\uFEFF", "").split("\n");
    expect(lines[0]).toBe("Titulo,Mensajes,Creado,Ultima Actividad");
    expect(lines.length).toBe(4);
  });

  it("handles empty recentActivity", async () => {
    const result = generate({ recentActivity: [] }, "recentActivity", "csv", FIXED_DATE);
    const text = await result.blob.text();
    const lines = text.replace("\uFEFF", "").split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("Titulo,Mensajes,Creado,Ultima Actividad");
  });

  it("sorts recentActivity by updated_at descending", async () => {
    const result = generate({ recentActivity: mockRecentActivity }, "recentActivity", "csv", FIXED_DATE);
    const text = await result.blob.text();
    const lines = text.replace("\uFEFF", "").split("\n");
    expect(lines[1]).toContain("Busqueda SUV");
    expect(lines[2]).toContain("Comparar autos");
  });

  it("handles fullDashboard report", async () => {
    const result = generate(fullSourceData, "fullDashboard", "json", FIXED_DATE);
    const text = await result.blob.text();
    const parsed = JSON.parse(text);
    expect(parsed.metadata.report_type).toBe("fullDashboard");
    expect(parsed.data.overview).toBeDefined();
    expect(parsed.data.brandRanking).toBeDefined();
    expect(parsed.data.recentActivity).toBeDefined();
  });
});

describe("downloadFile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates object URL and revokes it", () => {
    const mockClick = vi.fn();
    const mockAppendChild = vi.spyOn(document.body, "appendChild").mockImplementation(() => {
      return {} as Node;
    });
    const mockRemoveChild = vi.spyOn(document.body, "removeChild").mockImplementation(() => {
      return {} as Node;
    });
    const mockCreateObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const mockRevokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const mockA = {
      href: "",
      download: "",
      click: mockClick,
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockA as unknown as HTMLAnchorElement);

    const blob = new Blob(["test"], { type: "text/csv" });
    downloadFile(blob, "test.csv");

    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockA.download).toBe("test.csv");

    vi.runAllTimers();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test");

    vi.restoreAllMocks();
  });
});
