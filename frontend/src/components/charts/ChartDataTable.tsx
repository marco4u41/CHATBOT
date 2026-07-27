import { useState } from "react";
import { cn } from "@/utils/cn";

interface ChartDataTableProps {
  data: Array<{ label: string; value: number; secondaryValue?: number }>;
  caption: string;
  valueLabel?: string;
  secondaryLabel?: string;
}

export function ChartDataTable({
  data,
  caption,
  valueLabel = "Valor",
  secondaryLabel,
}: ChartDataTableProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setVisible(!visible)}
        className="text-[10px] text-ax-text-muted hover:text-ax-text-secondary transition-colors font-mono uppercase tracking-wider"
        aria-expanded={visible}
      >
        {visible ? "Ocultar datos" : "Ver datos"}
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          visible ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0",
        )}
      >
        <table className="w-full text-xs" role="table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-ax-border-subtle">
              <th className="text-left py-2 px-3 text-ax-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                Categoria
              </th>
              <th className="text-right py-2 px-3 text-ax-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                {valueLabel}
              </th>
              {secondaryLabel && (
                <th className="text-right py-2 px-3 text-ax-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                  {secondaryLabel}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.label}
                className="border-b border-ax-border-subtle/50 hover:bg-ax-surface-light/50 transition-colors"
              >
                <td className="py-2 px-3 text-ax-text-secondary">{row.label}</td>
                <td className="py-2 px-3 text-ax-text-primary text-right font-mono">
                  {row.value.toLocaleString()}
                </td>
                {secondaryLabel && row.secondaryValue !== undefined && (
                  <td className="py-2 px-3 text-ax-text-secondary text-right font-mono">
                    {row.secondaryValue.toLocaleString()}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}