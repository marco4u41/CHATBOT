import { useState, useCallback, useId, useMemo } from "react";
import type { ChartPoint } from "@/types/analytics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ChartTooltip } from "./ChartTooltip";
import { ChartDataTable } from "./ChartDataTable";
import { ChartEmptyState } from "./ChartEmptyState";

interface LineChartProps {
  data: ChartPoint[];
  height?: number;
  showArea?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  formatValue?: (v: number) => string;
  formatLabel?: (v: string) => string;
  accentColor?: string;
  ariaLabel?: string;
}

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

export function LineChart({
  data,
  height = 200,
  showArea = true,
  showDots = true,
  showGrid = true,
  formatValue = (v) => v.toLocaleString(),
  formatLabel = (v) => v,
  accentColor = "#00f0ff",
  ariaLabel,
}: LineChartProps) {
  const reducedMotion = useReducedMotion();
  const chartId = useId();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    value: string;
  } | null>(null);

  const handleDotEnter = useCallback(
    (e: React.MouseEvent | React.FocusEvent, label: string, value: number) => {
      const rect = (e.target as SVGCircleElement).getBoundingClientRect();
      const svgParent = (e.target as SVGCircleElement).closest("svg");
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

  const points = useMemo(
    () =>
      data.map((d, i) => ({
        x: PADDING.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
        y: PADDING.top + innerH - (d.value / maxValue) * innerH,
        label: d.label,
        value: d.value,
      })),
    [data, innerW, innerH, maxValue],
  );

  const buildPath = () => {
    if (points.length === 0) return "";
    const first = points[0]!;
    if (points.length === 1) return `M ${first.x} ${first.y}`;

    let path = `M ${first.x} ${first.y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const curr = points[i]!;
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp2x = curr.x - (curr.x - prev.x) / 3;
      path += ` C ${cp1x} ${prev.y} ${cp2x} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const buildAreaPath = () => {
    if (points.length < 2) return "";
    const linePath = buildPath();
    const last = points[points.length - 1]!;
    const first = points[0]!;
    return `${linePath} L ${last.x} ${PADDING.top + innerH} L ${first.x} ${PADDING.top + innerH} Z`;
  };

  const linePath = buildPath();
  const areaPath = buildAreaPath();

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
        aria-label={
          ariaLabel ?? `Grafico de lineas con ${data.length} puntos`
        }
      >
        <defs>
          <linearGradient id={`area-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines}
        {yLabels}

        {showArea && areaPath && (
          <path
            d={areaPath}
            fill={`url(#area-${chartId})`}
            className={reducedMotion ? "" : "animate-fade-in"}
          />
        )}

        {points.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
            className={
              reducedMotion
                ? ""
                : "animate-[drawLine_1s_ease-out_forwards]"
            }
          />
        )}

        {showDots &&
          points.map((p, i) => (
            <g key={`${chartId}-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill={accentColor}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={2}
                className="cursor-pointer hover:r-5 transition-all"
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${formatLabel(p.label)}: ${formatValue(p.value)}`}
                onMouseEnter={(e) => handleDotEnter(e, p.label, p.value)}
                onFocus={(e) => handleDotEnter(e, p.label, p.value)}
                onMouseLeave={handleLeave}
                onBlur={handleLeave}
              />
            </g>
          ))}

        {points.map((p, i) => (
          <text
            key={`label-${chartId}-${i}`}
            x={p.x}
            y={chartHeight - PADDING.bottom + 16}
            textAnchor="middle"
            className="fill-white/30 text-[8px]"
          >
            {formatLabel(p.label).length > 6
              ? formatLabel(p.label).slice(0, 5) + "\u2026"
              : formatLabel(p.label)}
          </text>
        ))}

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
        caption="Datos del grafico de lineas"
        valueLabel="Valor"
      />
    </div>
  );
}
