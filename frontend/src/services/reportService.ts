import type {
  AnalyticsOverviewData,
  VehicleTypeData,
  VehicleFuelData,
  VehicleTransmissionData,
  VehicleYearData,
  VehiclePriceData,
  BrandRankingData,
} from "@/types/analytics";
import type { Conversation } from "@/types/chat";

export type ReportType =
  | "overview"
  | "brandRanking"
  | "byType"
  | "byFuel"
  | "byTransmission"
  | "byYear"
  | "priceDistribution"
  | "recentActivity"
  | "fullDashboard";

export type ExportFormat = "csv" | "json";

export type CsvValue = string | number | boolean | null | undefined;

export interface ReportResult {
  blob: Blob;
  filename: string;
}

export interface ReportMetadata {
  report_type: string;
  generated_at: string;
  format_version: "1.0";
}

export interface ReportEnvelope {
  metadata: ReportMetadata;
  data: unknown;
}

export interface SourceData {
  overview?: AnalyticsOverviewData | null;
  brandRanking?: BrandRankingData | null;
  byType?: VehicleTypeData | null;
  byFuel?: VehicleFuelData | null;
  byTransmission?: VehicleTransmissionData | null;
  byYear?: VehicleYearData | null;
  priceDistribution?: VehiclePriceData | null;
  recentActivity?: Conversation[] | null;
}

const CSV_BOM = "\uFEFF";
const DANGEROUS_PREFIXES = ["=", "+", "-", "@"];

function isValidGeneratedAt(value: string): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

export function escapeCsvField(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);

  let str = String(value);
  str = str.replace(/\uFEFF/g, "");

  let dangerousPrefix = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === " " || ch === "\t" || (ch !== undefined && ch.charCodeAt(0) <= 31)) {
      continue;
    }
    if (ch !== undefined && DANGEROUS_PREFIXES.includes(ch)) {
      dangerousPrefix = true;
    }
    break;
  }

  if (dangerousPrefix) {
    str = "'" + str;
  }

  str = str.replace(/"/g, '""');

  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.startsWith('"')
  ) {
    return `"${str}"`;
  }

  return str;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvField).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(","));
  }
  return lines.join("\n");
}

function overviewToRows(data: AnalyticsOverviewData): CsvValue[][] {
  return [
    ["Total Vehiculos", data.vehicles.total_vehicles],
    ["Precio Promedio", data.vehicles.avg_price ?? ""],
    ["Total Marcas", data.vehicles.total_brands],
    ["Total Modelos", data.vehicles.total_models],
    ["Total Conversaciones", data.conversations.total_conversations],
    ["Total Mensajes", data.conversations.total_messages],
    ["Promedio Mensajes/Conversacion", data.conversations.avg_messages_per_conversation],
  ];
}

function overviewHeaders(): string[] {
  return ["Metrica", "Valor"];
}

function brandRankingToRows(data: BrandRankingData): CsvValue[][] {
  return data.data.map((item) => [
    item.manufacturer,
    item.total_listings ?? 0,
    item.model_count ?? 0,
    item.year_count ?? 0,
    item.average_price ?? "",
  ]);
}

function brandRankingHeaders(): string[] {
  return ["Marca", "Listados", "Modelos", "Anios", "Precio Promedio"];
}

function byTypeToRows(data: VehicleTypeData): CsvValue[][] {
  return data.data.map((item) => [item.vehicle_type ?? "", item.count, item.avg_price ?? ""]);
}

function byTypeHeaders(): string[] {
  return ["Tipo", "Cantidad", "Precio Promedio"];
}

function byFuelToRows(data: VehicleFuelData): CsvValue[][] {
  return data.data.map((item) => [item.fuel ?? "", item.count, item.avg_price ?? ""]);
}

function byFuelHeaders(): string[] {
  return ["Combustible", "Cantidad", "Precio Promedio"];
}

function byTransmissionToRows(data: VehicleTransmissionData): CsvValue[][] {
  return data.data.map((item) => [item.transmission ?? "", item.count]);
}

function byTransmissionHeaders(): string[] {
  return ["Transmision", "Cantidad"];
}

function byYearToRows(data: VehicleYearData): CsvValue[][] {
  return data.data.map((item) => [item.year, item.count, item.avg_price ?? ""]);
}

function byYearHeaders(): string[] {
  return ["Anio", "Cantidad", "Precio Promedio"];
}

function priceDistributionToRows(data: VehiclePriceData): CsvValue[][] {
  return data.data.map((item) => [item.price_range, item.count]);
}

function priceDistributionHeaders(): string[] {
  return ["Rango de Precio", "Cantidad"];
}

function recentActivityToRows(data: Conversation[]): CsvValue[][] {
  const sorted = [...data]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return sorted.map((conv) => {
    const title = conv.title || "Sin titulo";
    const created = isValidDate(conv.created_at) ? conv.created_at : "Fecha no disponible";
    const updated = isValidDate(conv.updated_at) ? conv.updated_at : "Fecha no disponible";
    return [title, conv.message_count, created, updated];
  });
}

function recentActivityHeaders(): string[] {
  return ["Titulo", "Mensajes", "Creado", "Ultima Actividad"];
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const t = Date.parse(dateStr);
  return !Number.isNaN(t);
}

function sectionToCsv(section: ReportType, sourceData: SourceData): string {
  switch (section) {
    case "overview":
      return toCsv(overviewHeaders(), overviewToRows(sourceData.overview!));
    case "brandRanking":
      return toCsv(brandRankingHeaders(), brandRankingToRows(sourceData.brandRanking!));
    case "byType":
      return toCsv(byTypeHeaders(), byTypeToRows(sourceData.byType!));
    case "byFuel":
      return toCsv(byFuelHeaders(), byFuelToRows(sourceData.byFuel!));
    case "byTransmission":
      return toCsv(byTransmissionHeaders(), byTransmissionToRows(sourceData.byTransmission!));
    case "byYear":
      return toCsv(byYearHeaders(), byYearToRows(sourceData.byYear!));
    case "priceDistribution":
      return toCsv(priceDistributionHeaders(), priceDistributionToRows(sourceData.priceDistribution!));
    case "recentActivity":
      return toCsv(recentActivityHeaders(), recentActivityToRows(sourceData.recentActivity ?? []));
    default:
      return "";
  }
}

function sectionToJson(
  section: ReportType,
  sourceData: SourceData,
  generatedAt: string,
): string {
  let data: unknown;
  if (section === "fullDashboard") {
    data = {
      overview: sourceData.overview ?? null,
      brandRanking: sourceData.brandRanking ?? null,
      byType: sourceData.byType ?? null,
      byFuel: sourceData.byFuel ?? null,
      byTransmission: sourceData.byTransmission ?? null,
      byYear: sourceData.byYear ?? null,
      priceDistribution: sourceData.priceDistribution ?? null,
      recentActivity: sourceData.recentActivity ?? [],
    };
  } else {
    data = sourceData[section as keyof SourceData] ?? null;
  }

  const envelope: ReportEnvelope = {
    metadata: {
      report_type: section,
      generated_at: generatedAt,
      format_version: "1.0",
    },
    data,
  };
  return JSON.stringify(envelope, null, 2);
}

export function generateFilename(
  reportType: ReportType,
  format: ExportFormat,
  generatedAt?: string,
): string {
  const dateStr = generatedAt ?? new Date().toISOString();
  const d = new Date(dateStr);
  const YYYY = String(d.getUTCFullYear());
  const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  const timestamp = `${YYYY}${MM}${DD}_${hh}${mm}${ss}`;
  const ext = format === "csv" ? "csv" : "json";
  const rawName = `${reportType}_${timestamp}.${ext}`;
  return sanitizeFilename(rawName);
}

export function sanitizeFilename(name: string): string {
  let cleaned = name.replace(/\.\.?(\/|\\)/g, "");
  cleaned = cleaned.replace(/[^a-zA-Z0-9_\-.]/g, "_");
  cleaned = cleaned.replace(/_+/g, "_");
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 100);
  }
  if (!cleaned || cleaned === "." || cleaned === "..") {
    return "reporte";
  }
  return cleaned;
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function generate(
  sourceData: SourceData,
  reportType: ReportType,
  format: ExportFormat,
  generatedAt?: string,
): ReportResult {
  if (generatedAt !== undefined && !isValidGeneratedAt(generatedAt)) {
    throw new Error(`generatedAt invalido: "${generatedAt}". Se esperaba una fecha ISO 8601 valida.`);
  }

  const resolvedAt = generatedAt ?? new Date().toISOString();
  const filename = generateFilename(reportType, format, resolvedAt);

  if (format === "csv") {
    const csvContent = sectionToCsv(reportType, sourceData);
    const blob = new Blob([CSV_BOM + csvContent], { type: "text/csv;charset=utf-8" });
    return { blob, filename };
  }

  const jsonContent = sectionToJson(reportType, sourceData, resolvedAt);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  return { blob, filename };
}
