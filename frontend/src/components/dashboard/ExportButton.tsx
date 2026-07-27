import { forwardRef } from "react";

interface ExportButtonProps {
  onClick: () => void;
}

export const ExportButton = forwardRef<HTMLButtonElement, ExportButtonProps>(
  function ExportButton({ onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label="Exportar reporte"
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-ax-text-secondary transition-all hover:border-ax-accent-info/30 hover:bg-ax-accent-info/[0.05] hover:text-ax-accent-info focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-accent-info"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Exportar
      </button>
    );
  },
);
