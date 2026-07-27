interface ChartEmptyStateProps {
  message?: string;
}

export function ChartEmptyState({
  message = "Sin datos disponibles",
}: ChartEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <svg
        className="w-8 h-8 text-ax-text-muted/30 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
        />
      </svg>
      <p className="text-xs text-ax-text-muted/50">{message}</p>
    </div>
  );
}