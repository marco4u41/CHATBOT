import { useAuthStore } from "@/stores/authStore";

interface HeaderProps {
  view: "chat" | "dashboard";
  onToggleSidebar?: () => void;
}

export function Header({ view, onToggleSidebar }: HeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] bg-ax-bg-base/40 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-ax-text-muted hover:text-ax-text-primary hover:bg-white/[0.04] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-wine/30"
            aria-label="Abrir menu de navegacion"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/70 shadow-[0_0_6px_rgba(52,211,153,0.3)]" aria-hidden="true" />
            <h1 className="ax-text-heading text-[15px] text-platinum truncate">
              {view === "chat" ? "AutoBot" : "Dashboard"}
            </h1>
          </div>
          <p className="text-[11px] text-ax-text-muted mt-0.5 hidden sm:block font-ax-sans tracking-wide">
            {view === "chat"
              ? "Comparacion - Diagnostico - Recomendacion"
              : "Panel de control y metricas"}
          </p>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <span className="ax-text-label text-ax-text-subtle text-[10px] hidden sm:block truncate max-w-[160px]">
            {user.email}
          </span>
        </div>
      )}
    </header>
  );
}
