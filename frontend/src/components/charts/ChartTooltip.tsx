import { cn } from "@/utils/cn";

interface ChartTooltipProps {
  x: number;
  y: number;
  label: string;
  value: string;
  secondaryValue?: string;
  visible: boolean;
}

export function ChartTooltip({
  x,
  y,
  label,
  value,
  secondaryValue,
  visible,
}: ChartTooltipProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute z-50 pointer-events-none",
        "ax-glass--light rounded-xl px-3 py-2",
        "text-xs transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
    >
      <p className="text-ax-text-secondary font-medium mb-0.5">{label}</p>
      <p className="text-ax-text-primary font-bold">{value}</p>
      {secondaryValue && (
        <p className="text-ax-text-muted">{secondaryValue}</p>
      )}
    </div>
  );
}