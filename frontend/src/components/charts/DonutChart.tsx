import { useState, useCallback, useId } from "react";
import type { DonutSegment } from "@/types/analytics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ChartTooltip } from "./ChartTooltip";
import { ChartDataTable } from "./ChartDataTable";
import { ChartEmptyState } from "./ChartEmptyState";

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
}

export function DonutChart({
  data,
  size = 200,
  thickness = 24,
  centerLabel,
  centerValue,
  formatValue = (v) => v.toLocaleString(),
  ariaLabel,
}: DonutChartProps) {
  const reducedMotion = useReducedMotion();
  const chartId = useId();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    value: string;
    secondary?: string;
  } | null>(null);

  const handleSegmentEnter = useCallback(
    (
      e: React.MouseEvent | React.FocusEvent,
      label: string,
      value: number,
      total: number,
    ) => {
      const rect = (e.target as SVGCircleElement).getBoundingClientRect();
      const svgParent = (e.target as SVGCircleElement).closest("svg");
      if (!svgParent) return;
      const svgRect = svgParent.getBoundingClientRect();
      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
      setTooltip({
        x: rect.left - svgRect.left + rect.width / 2,
        y: rect.top - svgRect.top - 8,
        label,
        value: formatValue(value),
        secondary: `${pct}%`,
      });
    },
    [formatValue],
  );

  const handleLeave = useCallback(() => setTooltip(null), []);

  if (data.length === 0) return <ChartEmptyState />;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel ?? "Grafico de dona sin datos"}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - thickness) / 2}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={thickness}
          />
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-ax-text-muted text-sm"
          >
            {centerValue ?? "0"}
          </text>
        </svg>
        {centerLabel && (
          <p className="text-[10px] text-ax-text-muted mt-2">{centerLabel}</p>
        )}
      </div>
    );
  }

  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = data.map((d) => {
    const segmentLength = (d.value / total) * circumference;
    const seg = {
      ...d,
      dasharray: `${segmentLength} ${circumference - segmentLength}`,
      dashoffset: -offset,
      segmentLength,
    };
    offset += segmentLength;
    return seg;
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={
            ariaLabel ?? `Grafico de dona con ${data.length} segmentos`
          }
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={thickness}
          />

          {segments.map((seg, i) => (
            <circle
              key={`${chartId}-${i}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={
                reducedMotion ? seg.dashoffset : circumference
              }
              strokeLinecap="butt"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "center",
              }}
              tabIndex={0}
              role="graphics-symbol"
              aria-label={`${seg.label}: ${formatValue(seg.value)}`}
              onMouseEnter={(e) =>
                handleSegmentEnter(e, seg.label, seg.value, total)
              }
              onFocus={(e) =>
                handleSegmentEnter(e, seg.label, seg.value, total)
              }
              onMouseLeave={handleLeave}
              onBlur={handleLeave}
            >
              {!reducedMotion && (
                <animate
                  attributeName="stroke-dashoffset"
                  from={String(circumference)}
                  to={String(seg.dashoffset)}
                  dur="0.8s"
                  fill="freeze"
                />
              )}
            </circle>
          ))}

          <text
            x={center}
            y={centerLabel ? center - 6 : center}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-ax-text-primary font-bold text-sm"
          >
            {formatValue(total)}
          </text>
          {centerLabel && (
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="fill-ax-text-muted text-[9px]"
            >
              {centerLabel}
            </text>
          )}
        </svg>

        {tooltip && (
          <ChartTooltip
            x={tooltip.x}
            y={tooltip.y}
            label={tooltip.label}
            value={tooltip.value}
            secondaryValue={tooltip.secondary}
            visible
          />
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-[10px] text-ax-text-secondary">
              {d.label} ({formatValue(d.value)})
            </span>
          </div>
        ))}
      </div>

      <ChartDataTable
        data={data.map((d) => ({
          label: d.label,
          value: d.value,
        }))}
        caption="Datos del grafico de dona"
        valueLabel="Cantidad"
      />
    </div>
  );
}