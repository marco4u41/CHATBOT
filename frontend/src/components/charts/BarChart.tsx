import { useState, useCallback, useId } from "react";
import type { ChartPoint } from "@/types/analytics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ChartTooltip } from "./ChartTooltip";
import { ChartDataTable } from "./ChartDataTable";
import { ChartEmptyState } from "./ChartEmptyState";

interface BarChartProps {
  data: ChartPoint[];
  height?: number;
  showGrid?: boolean;
  formatValue?: (v: number) => string;
  accentColor?: string;
  ariaLabel?: string;
}

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const BAR_GAP_RATIO = 0.3;

export function BarChart({
  data,
  height = 200,
  showGrid = true,
  formatValue = (v) => v.toLocaleString(),
  accentColor = "#00f0ff",
  ariaLabel,
}: BarChartProps) {
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

  const chartWidth = 500;
  const chartHeight = height;
  const innerW = chartWidth - PADDING.left - PADDING.right;
  const innerH = chartHeight - PADDING.top - PADDING.bottom;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barGap = innerW * BAR_GAP_RATIO / (data.length + 1);
  const barWidth = (innerW - barGap * (data.length + 1)) / data.length;

  const gridLines = showGrid
    ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = PADDING.top + innerH * (1 - ratio);
        return (
          <line
            key={ratio}
            x1={PADDING.left}
            y1={y}
            x2={chartWidth - PADDING.right}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        );
      })
    : null;

  const yLabels = showGrid
    ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = PADDING.top + innerH * (1 - ratio);
        return (
          <text
            key={ratio}
            x={PADDING.left - 8}
            y={y + 3}
            textAnchor="end"
            className="fill-white/30 text-[9px]"
          >
            {formatValue(Math.round(maxValue * ratio))}
          </text>
        );
      })
    : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto"
        role="img"
        aria-label={ariaLabel ?? `Grafico de barras con ${data.length} categorias`}
      >
        {gridLines}
        {yLabels}

        {data.map((d, i) => {
          const x = PADDING.left + barGap + i * (barWidth + barGap);
          const barH = (d.value / maxValue) * innerH;
          const y = PADDING.top + innerH - barH;

          return (
            <g key={`${chartId}-${i}`}>
              <rect
                x={x}
                y={reducedMotion ? y : PADDING.top + innerH}
                width={barWidth}
                height={reducedMotion ? barH : 0}
                rx={3}
                fill={accentColor}
                opacity={0.8}
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
                  <>
                    <animate
                      attributeName="y"
                      from={String(PADDING.top + innerH)}
                      to={String(y)}
                      dur="0.5s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="height"
                      from="0"
                      to={String(barH)}
                      dur="0.5s"
                      fill="freeze"
                    />
                  </>
                )}
              </rect>

              <text
                x={x + barWidth / 2}
                y={chartHeight - PADDING.bottom + 16}
                textAnchor="middle"
                className="fill-white/40 text-[9px]"
              >
                {d.label.length > 8 ? d.label.slice(0, 7) + "\u2026" : d.label}
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
        caption="Datos del grafico de barras"
        valueLabel="Cantidad"
      />
    </div>
  );
}
