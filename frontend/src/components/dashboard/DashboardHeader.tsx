import { useAnalyticsStore } from "@/stores/analyticsStore";
import { StatCard } from "@/components/analytics/StatCard";
import { ExportButton } from "./ExportButton";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos dias";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate(): string {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface DashboardHeaderProps {
  headerRef?: React.Ref<HTMLHeadingElement>;
  onOpenExport?: () => void;
  exportButtonRef?: React.Ref<HTMLButtonElement>;
}

export function DashboardHeader({ headerRef, onOpenExport, exportButtonRef }: DashboardHeaderProps) {
  const overview = useAnalyticsStore((s) => s.overview);
  const isLoading = useAnalyticsStore((s) => s.isLoading);

  const vehicles = overview?.vehicles;
  const conversations = overview?.conversations;

  return (
    <section aria-label="Metricas principales">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            ref={headerRef}
            tabIndex={-1}
            className="ax-text-heading text-xl text-ax-text-primary tracking-tight outline-none"
          >
            {getGreeting()}, <span className="text-ax-gold-light">Administrador</span>
          </h1>
          <p className="ax-text-data text-ax-text-muted mt-1">{formatDate()}</p>
        </div>
        {onOpenExport && (
          <ExportButton ref={exportButtonRef} onClick={onOpenExport} />
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Vehiculos"
          value={vehicles?.total_vehicles ?? 0}
          color="blue"
          isLoading={isLoading && !overview}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21" />
            </svg>
          }
        />
        <StatCard
          label="Conversaciones"
          value={conversations?.total_conversations ?? 0}
          color="green"
          isLoading={isLoading && !overview}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          }
        />
        <StatCard
          label="Marcas"
          value={vehicles?.total_brands ?? 0}
          color="orange"
          isLoading={isLoading && !overview}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
          }
        />
        <StatCard
          label="Precio Promedio"
          value={vehicles?.avg_price != null ? `$${Math.round(vehicles.avg_price).toLocaleString()}` : "N/A"}
          color="gold"
          isLoading={isLoading && !overview}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659 1.236-1.235M12 18.378l1.236-1.235-.879-.659M12 6a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
            </svg>
          }
        />
      </div>
    </section>
  );
}
