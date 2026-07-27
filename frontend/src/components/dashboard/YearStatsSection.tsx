import { useState } from "react";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { adaptYearCount, adaptYearAvgPrice } from "@/api/analytics";
import { LineChart } from "@/components/charts/LineChart";
import { ChartLoadingState } from "@/components/charts/ChartLoadingState";
import { ChartErrorState } from "@/components/charts/ChartErrorState";
import { GlassCard, GlassCardContent } from "@/components/design-system/GlassCard";
import { cn } from "@/utils/cn";

export function YearStatsSection() {
  const byYear = useAnalyticsStore((s) => s.byYear);
  const error = useAnalyticsStore((s) => s.errors.byYear);
  const sectionLoading = useAnalyticsStore((s) => s.sectionLoading.byYear);
  const fetchSection = useAnalyticsStore((s) => s.fetchSection);
  const [metric, setMetric] = useState<"count" | "avgPrice">("count");

  const data = byYear
    ? metric === "count"
      ? adaptYearCount(byYear)
      : adaptYearAvgPrice(byYear)
    : [];

  const title = metric === "count" ? "Vehiculos por Ano" : "Precio Promedio por Ano";

  return (
    <GlassCard>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
        <h3 className="ax-text-heading text-xs text-ax-text-primary">
          {title}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setMetric("count")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-ax-mono uppercase tracking-wider transition-all",
              metric === "count"
                ? "bg-ax-accent-info/[0.12] text-ax-accent-info border border-ax-accent-info/20"
                : "text-ax-text-muted hover:text-ax-text-secondary",
            )}
          >
            Cantidad
          </button>
          <button
            onClick={() => setMetric("avgPrice")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-ax-mono uppercase tracking-wider transition-all",
              metric === "avgPrice"
                ? "bg-ax-gold/[0.12] text-ax-gold-light border border-ax-gold/20"
                : "text-ax-text-muted hover:text-ax-text-secondary",
            )}
          >
            Precio
          </button>
        </div>
      </div>
      <GlassCardContent>
        {sectionLoading && !byYear ? (
          <ChartLoadingState />
        ) : error ? (
          <ChartErrorState
            message={error}
            onRetry={() => fetchSection("byYear")}
          />
        ) : (
          <LineChart
            data={data}
            ariaLabel={title}
            formatValue={
              metric === "avgPrice"
                ? (v) => `$${v.toLocaleString()}`
                : (v) => v.toLocaleString()
            }
            accentColor={metric === "count" ? "#3b82f6" : "#b8860b"}
          />
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
