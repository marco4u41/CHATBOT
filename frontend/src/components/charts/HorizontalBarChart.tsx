import { useState, useCallback, useId } from "react";
import type { ChartPoint } from "@/types/analytics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ChartTooltip } from "./ChartTooltip";
import { ChartDataTable } from "./ChartDataTable";
import { ChartEmptyState } from "./ChartEmptyState";

interface HorizontalBarChartProps {
  data: ChartPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  accentColor?: string;
  ariaLabel?: string;
}

const ROW_HEIGHT = 36;
const LABEL_WIDTH = 100;
const VALUE_WIDTH = 70;
const PADDING = 16;

export function HorizontalBarChart({
  data,
  formatValue = (v) => v.toLocaleString(),
  accentColor = "#00f0ff",
  ariaLabel,
}: HorizontalBarChartProps) {
  const reducedMotion = useReducedMotion();
  const chartId = useId();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    value: string;
  } | null>(null);

  const handleBarEnter = useCallback(
    (e: React.MouseEvent | React.FocusEvent, label: string, value: number) => {
      const rect = (e.target as SVGRectElement).getBoundingClientRect();
      const svgParent = (e.target as SVGRectElement).closest("svg");
      if (!svgParent) return;
      const svgRect = svgParent.getBoundingClientRect();
      setTooltip({
        x: rect.left - svgRect.left + rect.width / 2,
        y: rect.top - svgRect.top - 8,
        label,
        value: formatValue(value),
      });
    },
    [formatValue],
  );

  const handleLeave = useCallback(() => setTooltip(null), []);

  if (data.length === 0) return <ChartEmptyState />;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const svgHeight = data.length * ROW_HEIGHT + PADDING * 2;
  const svgWidth = 500;
  const barMaxWidth = svgWidth - LABEL_WIDTH - VALUE_WIDTH - PADDING * 2;

  return (
    <div className="relative w-full overflow-y-auto max-h-[400px]">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          ariaLabel ?? `Grafico de barras horizontales con ${data.length} items`
        }
      >
        {data.map((d, i) => {
          const y = PADDING + i * ROW_HEIGHT;
          const barW = (d.value / maxValue) * barMaxWidth;

          return (
            <g key={`${chartId}-${i}`}>
              <text
                x={LABEL_WIDTH}
                y={y + ROW_HEIGHT / 2 + 3}
                textAnchor="end"
                className="fill-ax-text-secondary text-[10px]"
              >
                {d.label.length > 12
                  ? d.label.slice(0, 11) + "\u2026"
                  : d.label}
              </text>

              <rect
                x={LABEL_WIDTH + 8}
                y={y + ROW_HEIGHT / 2 - 6}
                width={reducedMotion ? barMaxWidth : 0}
                height={12}
                rx={3}
                fill="rgba(255,255,255,0.06)"
              />

              <rect
                x={LABEL_WIDTH + 8}
                y={y + ROW_HEIGHT / 2 - 6}
                width={reducedMotion ? barW : 0}
                height={12}
                rx={3}
                fill={accentColor}
                opacity={0.7}
                className="cursor-pointer hover:opacity-100 transition-opacity"
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${d.label}: ${formatValue(d.value)}`}
                onMouseEnter={(e) => handleBarEnter(e, d.label, d.value)}
                onFocus={(e) => handleBarEnter(e, d.label, d.value)}
                onMouseLeave={handleLeave}
                onBlur={handleLeave}
              >
                {!reducedMotion && (
                  <animate
                    attributeName="width"
                    from="0"
                    to={String(barW)}
                    dur="0.5s"
                    fill="freeze"
                  />
                )}
              </rect>

              <text
                x={LABEL_WIDTH + 16 + barMaxWidth}
                y={y + ROW_HEIGHT / 2 + 3}
                className="fill-ax-text-secondary text-[10px] font-mono"
              >
                {formatValue(d.value)}
              </text>
            </g>
          );
        })}

        {tooltip && (
          <ChartTooltip
            x={tooltip.x}
            y={tooltip.y}
            label={tooltip.label}
            value={tooltip.value}
            visible
          />
        )}
      </svg>

      <ChartDataTable
        data={data.map((d) => ({ label: d.label, value: d.value }))}
        caption="Datos del grafico de barras horizontales"
        valueLabel="Cantidad"
      />
    </div>
  );
}