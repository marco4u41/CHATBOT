import { useState, useCallback } from "react";
import { useAnalyticsStore, type AnalyticsSection } from "@/stores/analyticsStore";
import { useConversationStore } from "@/stores/conversationStore";
import * as ReportService from "@/services/reportService";
import type { ReportType, ExportFormat, SourceData } from "@/services/reportService";

const CACHE_TTL = 5 * 60 * 1000;

const SECTION_MAP: Record<string, AnalyticsSection> = {
  overview: "overview",
  brandRanking: "brandRanking",
  byType: "byType",
  byFuel: "byFuel",
  byTransmission: "byTransmission",
  byYear: "byYear",
  priceDistribution: "priceDistribution",
};

const ALL_ANALYTICS_SECTIONS: AnalyticsSection[] = [
  "overview",
  "brandRanking",
  "byType",
  "byFuel",
  "byTransmission",
  "byYear",
  "priceDistribution",
];

function isCacheValid(lastFetched: number | null): boolean {
  if (lastFetched === null) return false;
  return Date.now() - lastFetched < CACHE_TTL;
}

function hasSectionData(
  state: ReturnType<typeof useAnalyticsStore.getState>,
  section: AnalyticsSection,
): boolean {
  return state[section] !== null;
}

function hasAllSectionsData(
  state: ReturnType<typeof useAnalyticsStore.getState>,
): boolean {
  return ALL_ANALYTICS_SECTIONS.every((s) => hasSectionData(state, s));
}

function hasSectionError(
  state: ReturnType<typeof useAnalyticsStore.getState>,
  section: AnalyticsSection,
): boolean {
  return state.errors[section] !== null;
}

function hasAnySectionError(
  state: ReturnType<typeof useAnalyticsStore.getState>,
): boolean {
  return ALL_ANALYTICS_SECTIONS.some((s) => state.errors[s] !== null);
}

function buildSourceDataForSection(
  section: AnalyticsSection,
): SourceData {
  const state = useAnalyticsStore.getState();
  const data: SourceData = {};
  (data as Record<string, unknown>)[section] = state[section];
  return data;
}

function buildSourceDataFull(): SourceData {
  const aState = useAnalyticsStore.getState();
  const cState = useConversationStore.getState();

  const conversations = [...cState.conversations]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return {
    overview: aState.overview,
    brandRanking: aState.brandRanking,
    byType: aState.byType,
    byFuel: aState.byFuel,
    byTransmission: aState.byTransmission,
    byYear: aState.byYear,
    priceDistribution: aState.priceDistribution,
    recentActivity: conversations,
  };
}

function buildSourceDataRecentActivity(): SourceData {
  const cState = useConversationStore.getState();
  const conversations = [...cState.conversations]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return { recentActivity: conversations };
}

export interface UseReportExportReturn {
  status: "idle" | "loading" | "success" | "error";
  errorMessage: string | null;
  exportReport: (type: ReportType, format: ExportFormat) => Promise<void>;
  clearStatus: () => void;
}

export function useReportExport(): UseReportExportReturn {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const exportReport = useCallback(async (type: ReportType, format: ExportFormat) => {
    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      if (type === "recentActivity") {
        const sourceData = buildSourceDataRecentActivity();
        const result = ReportService.generate(sourceData, type, format);
        ReportService.downloadFile(result.blob, result.filename);
        setStatus("success");
        return;
      }

      if (type === "fullDashboard") {
        if (format === "csv") {
          setStatus("error");
          setErrorMessage("Reporte completo solo soporta JSON");
          return;
        }

        const state = useAnalyticsStore.getState();
        const cacheValid = isCacheValid(state.lastFetched);

        if (!hasAllSectionsData(state) || !cacheValid) {
          await useAnalyticsStore.getState().fetchAll(true);
        }

        const postFetchState = useAnalyticsStore.getState();
        if (!hasAllSectionsData(postFetchState) || hasAnySectionError(postFetchState)) {
          setStatus("error");
          setErrorMessage("Datos no disponibles. Intente de nuevo.");
          return;
        }

        const sourceData = buildSourceDataFull();
        const result = ReportService.generate(sourceData, type, format);
        ReportService.downloadFile(result.blob, result.filename);
        setStatus("success");
        return;
      }

      const section = SECTION_MAP[type];
      if (!section) {
        setStatus("error");
        setErrorMessage("Tipo de reporte no valido.");
        return;
      }

      const state = useAnalyticsStore.getState();
      const cacheValid = isCacheValid(state.lastFetched);

      if (!hasSectionData(state, section) || !cacheValid) {
        await useAnalyticsStore.getState().fetchSection(section);
      }

      const postFetchState = useAnalyticsStore.getState();
      const sectionReady = hasSectionData(postFetchState, section);
      const sectionNoError = !hasSectionError(postFetchState, section);

      if (!sectionReady || !sectionNoError) {
        setStatus("error");
        setErrorMessage("Datos no disponibles. Intente de nuevo.");
        return;
      }

      const sourceData = buildSourceDataForSection(section);
      const result = ReportService.generate(sourceData, type, format);
      ReportService.downloadFile(result.blob, result.filename);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Error inesperado al generar el reporte.");
    }
  }, [status]);

  const clearStatus = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  return { status, errorMessage, exportReport, clearStatus };
}
