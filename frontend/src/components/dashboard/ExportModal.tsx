import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useReportExport } from "@/hooks/useReportExport";
import type { ReportType, ExportFormat } from "@/services/reportService";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "overview", label: "Resumen General" },
  { value: "brandRanking", label: "Top Marcas" },
  { value: "byType", label: "Vehiculos por Tipo" },
  { value: "byFuel", label: "Vehiculos por Combustible" },
  { value: "byTransmission", label: "Vehiculos por Transmision" },
  { value: "byYear", label: "Vehiculos por Ano" },
  { value: "priceDistribution", label: "Distribucion de Precios" },
  { value: "recentActivity", label: "Actividad Reciente" },
  { value: "fullDashboard", label: "Reporte Completo" },
];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 'button:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [reportType, setReportType] = useState<ReportType>("overview");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const modalRef = useRef<HTMLDivElement>(null);
  const { status, errorMessage, exportReport, clearStatus } = useReportExport();
  const previousOverflow = useRef<string>("");

  const isFullDashboard = reportType === "fullDashboard";
  const isLoading = status === "loading";

  useEffect(() => {
    if (isFullDashboard && exportFormat === "csv") {
      setExportFormat("json");
    }
  }, [isFullDashboard, exportFormat]);

  useEffect(() => {
    if (!isOpen) return;
    setReportType("overview");
    setExportFormat("csv");
    clearStatus();
  }, [isOpen, clearStatus]);

  useEffect(() => {
    if (!isOpen) return;

    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow.current;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isLoading) return;

    const container = modalRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0]!.focus();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, isLoading]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isLoading) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const container = modalRef.current;
        if (!container) return;

        const focusable = getFocusableElements(container);
        if (focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLoading) {
        exportReport(reportType, exportFormat);
      }
    },
    [isLoading, exportReport, reportType, exportFormat],
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-ax-fade-in"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="relative w-full max-w-md ax-glass rounded-2xl border border-white/[0.08] shadow-ax-modal p-6 animate-ax-scale-in"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="export-title" className="ax-text-heading text-lg text-ax-text-primary">
            Exportar Reporte
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar modal"
            className="rounded-lg p-1 text-ax-text-muted transition-colors hover:text-ax-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <fieldset disabled={isLoading} className="rounded-lg border border-white/[0.06] p-3">
              <legend className="mb-2 ax-text-label text-ax-text-muted">
                Tipo de Reporte
              </legend>
              <div className="space-y-1">
                {REPORT_TYPES.map((rt) => (
                  <label
                    key={rt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ax-text-secondary transition-colors hover:bg-white/[0.04] hover:text-ax-text-primary"
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={rt.value}
                      checked={reportType === rt.value}
                      onChange={() => setReportType(rt.value)}
                      className="h-3.5 w-3.5 accent-ax-accent-info"
                    />
                    {rt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset disabled={isLoading} className="rounded-lg border border-white/[0.06] p-3">
              <legend className="mb-2 ax-text-label text-ax-text-muted">
                Formato
              </legend>
              <div className="flex gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ax-text-secondary transition-colors hover:bg-white/[0.04] hover:text-ax-text-primary">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === "csv"}
                    onChange={() => setExportFormat("csv")}
                    disabled={isFullDashboard}
                    className="h-3.5 w-3.5 accent-ax-accent-info disabled:opacity-40"
                  />
                  CSV
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-ax-text-secondary transition-colors hover:bg-white/[0.04] hover:text-ax-text-primary">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={exportFormat === "json"}
                    onChange={() => setExportFormat("json")}
                    className="h-3.5 w-3.5 accent-ax-accent-info"
                  />
                  JSON
                </label>
              </div>
            </fieldset>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ax-accent-info/[0.1] border border-ax-accent-info/30 px-4 py-2.5 text-sm font-medium text-ax-accent-info transition-all hover:bg-ax-accent-info/[0.2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Preparando reporte...
                </>
              ) : (
                "Descargar"
              )}
            </button>
          </div>

          <div aria-live="polite" role="status" className="mt-3 min-h-[1.25rem]">
            {status === "success" && (
              <p className="flex items-center gap-1.5 text-xs text-ax-accent-success">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Archivo descargado correctamente
              </p>
            )}
            {status === "error" && errorMessage && (
              <div role="alert" aria-live="assertive">
                <p className="text-xs text-ax-accent-danger">{errorMessage}</p>
              </div>
            )}
          </div>
        </form>

        <p className="mt-3 text-[10px] text-ax-text-subtle">
          Los datos se exportan desde la cache del dashboard.
        </p>
      </div>
    </div>,
    document.body,
  );
}
