interface ChartErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ChartErrorState({ message, onRetry }: ChartErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <svg
        className="w-8 h-8 text-ax-accent-danger/40 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
      <p className="text-xs text-ax-text-muted mb-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[10px] text-ax-accent-info hover:text-ax-accent-info/80 transition-colors font-mono uppercase tracking-wider"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}