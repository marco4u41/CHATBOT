import { cn } from "@/utils/cn";

interface QuickActionsProps {
  onNavigateToChat: () => void;
  onExploreData: () => void;
}

const actions = [
  {
    id: "compare",
    title: "Comparar Autos",
    description: "Compara specifications de vehiculos lado a lado",
    iconPath:
      "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
    color: "text-ax-accent-info",
    border: "border-ax-accent-info/15",
  },
  {
    id: "diagnose",
    title: "Diagnosticar Falla",
    description: "Obten un diagnostico mecanico detallado",
    iconPath:
      "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085",
    color: "text-ax-accent-warning",
    border: "border-ax-accent-warning/15",
  },
  {
    id: "recommend",
    title: "Recomendar Vehiculo",
    description: "Recibe recomendaciones personalizadas",
    iconPath:
      "M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.77.665 6.023 6.023 0 0 1-2.77-.665",
    color: "text-ax-accent-success",
    border: "border-ax-accent-success/15",
  },
  {
    id: "explore",
    title: "Explorar Datos",
    description: "Visualiza estadisticas y graficos del mercado",
    iconPath:
      "M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6",
    color: "text-ax-gold-light",
    border: "border-ax-gold/15",
  },
] as const;

export function QuickActions({ onNavigateToChat, onExploreData }: QuickActionsProps) {
  function handleClick(id: string) {
    if (id === "explore") {
      onExploreData();
    } else {
      onNavigateToChat();
    }
  }

  return (
    <section aria-label="Acciones rapidas">
      <h2 className="ax-text-label text-ax-text-muted mb-3">
        Acciones Rapidas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleClick(action.id)}
            className={cn(
              "ax-glass--light rounded-xl p-4 text-left transition-all duration-200",
              "border",
              action.border,
              "hover:border-white/[0.1] hover:shadow-ax-elevated",
              "ax-focus-ring",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  "bg-ax-surface-light border border-white/[0.06]",
                  action.color,
                )}
              >
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={action.iconPath}
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ax-text-primary">{action.title}</p>
                <p className="ax-text-label text-ax-text-muted mt-0.5 leading-relaxed">
                  {action.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
