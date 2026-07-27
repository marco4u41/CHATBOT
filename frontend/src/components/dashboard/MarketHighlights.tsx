import { useAnalyticsStore } from "@/stores/analyticsStore";
import {
  adaptBrandRanking,
  adaptTypeDistribution,
  adaptFuelDistribution,
  adaptTransmissionDistribution,
  adaptPriceDistribution,
} from "@/api/analytics";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { ChartErrorState } from "@/components/charts/ChartErrorState";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/design-system/GlassCard";
import { CHART_COLORS } from "./chartColors";
import { YearStatsSection } from "./YearStatsSection";
import type { DonutSegment } from "@/types/analytics";

function toDonutSegments(
  data: { label: string; value: number }[],
  colors: readonly string[],
): DonutSegment[] {
  return data.map((d, i) => ({
    ...d,
    color: colors[i % colors.length] ?? "#ffffff80",
  }));
}

interface ChartSectionProps {
  title: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}

function ChartSection({ title, loading, error, onRetry, children }: ChartSectionProps) {
  return (
    <GlassCard>
      <GlassCardHeader>
        <span className="ax-text-label text-ax-text-secondary uppercase">
          {title}
        </span>
      </GlassCardHeader>
      <GlassCardContent>
        {loading ? (
          <ChartLoadingState />
        ) : error ? (
          <ChartErrorState message={error} onRetry={onRetry} />
        ) : (
          children
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

export function MarketHighlights() {
  const brandRanking = useAnalyticsStore((s) => s.brandRanking);
  const byType = useAnalyticsStore((s) => s.byType);
  const byFuel = useAnalyticsStore((s) => s.byFuel);
  const byTransmission = useAnalyticsStore((s) => s.byTransmission);
  const priceDistribution = useAnalyticsStore((s) => s.priceDistribution);

  const sectionLoading = useAnalyticsStore((s) => s.sectionLoading);
  const errors = useAnalyticsStore((s) => s.errors);
  const fetchSection = useAnalyticsStore((s) => s.fetchSection);

  return (
    <section aria-label="Destacados del mercado" id="market-highlights">
      <h2 className="ax-text-label text-ax-text-muted mb-3">
        Destacados del Mercado
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartSection
          title="Top Marcas por Listings"
          loading={sectionLoading.brandRanking && !brandRanking}
          error={errors.brandRanking}
          onRetry={() => fetchSection("brandRanking")}
        >
          {brandRanking && (
            <HorizontalBarChart
              data={adaptBrandRanking(brandRanking)}
              ariaLabel="Top marcas por cantidad de listados"
              accentColor="#3b82f6"
            />
          )}
        </ChartSection>

        <YearStatsSection />

        <ChartSection
          title="Distribucion por Tipo"
          loading={sectionLoading.byType && !byType}
          error={errors.byType}
          onRetry={() => fetchSection("byType")}
        >
          {byType && (
            <DonutChart
              data={toDonutSegments(adaptTypeDistribution(byType), CHART_COLORS.vehicleType)}
              centerLabel="tipos"
              ariaLabel="Distribucion de vehiculos por tipo"
            />
          )}
        </ChartSection>

        <ChartSection
          title="Distribucion por Combustible"
          loading={sectionLoading.byFuel && !byFuel}
          error={errors.byFuel}
          onRetry={() => fetchSection("byFuel")}
        >
          {byFuel && (
            <DonutChart
              data={toDonutSegments(adaptFuelDistribution(byFuel), CHART_COLORS.fuel)}
              centerLabel="combustibles"
              ariaLabel="Distribucion de vehiculos por tipo de combustible"
            />
          )}
        </ChartSection>

        <ChartSection
          title="Distribucion por Transmision"
          loading={sectionLoading.byTransmission && !byTransmission}
          error={errors.byTransmission}
          onRetry={() => fetchSection("byTransmission")}
        >
          {byTransmission && (
            <DonutChart
              data={toDonutSegments(adaptTransmissionDistribution(byTransmission), CHART_COLORS.transmission)}
              centerLabel="transmisiones"
              ariaLabel="Distribucion de vehiculos por tipo de transmision"
            />
          )}
        </ChartSection>

        <ChartSection
          title="Distribucion de Precios"
          loading={sectionLoading.priceDistribution && !priceDistribution}
          error={errors.priceDistribution}
          onRetry={() => fetchSection("priceDistribution")}
        >
          {priceDistribution && (
            <BarChart
              data={adaptPriceDistribution(priceDistribution)}
              ariaLabel="Distribucion de vehiculos por rango de precios"
              accentColor="#16a34a"
            />
          )}
        </ChartSection>
      </div>
    </section>
  );
}
