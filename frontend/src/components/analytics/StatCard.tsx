import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: "blue" | "orange" | "green" | "gold";
  subtitle?: string;
  isLoading?: boolean;
}

const colorMap = {
  blue: {
    border: "border-ax-accent-info/20",
    text: "text-ax-accent-info",
    iconBg: "bg-ax-accent-info/[0.08]",
    iconBorder: "border-ax-accent-info/15",
  },
  orange: {
    border: "border-ax-accent-warning/20",
    text: "text-ax-accent-warning",
    iconBg: "bg-ax-accent-warning/[0.08]",
    iconBorder: "border-ax-accent-warning/15",
  },
  green: {
    border: "border-ax-accent-success/20",
    text: "text-ax-accent-success",
    iconBg: "bg-ax-accent-success/[0.08]",
    iconBorder: "border-ax-accent-success/15",
  },
  gold: {
    border: "border-ax-gold/20",
    text: "text-ax-gold-light",
    iconBg: "bg-ax-gold/[0.08]",
    iconBorder: "border-ax-gold/15",
  },
} as const;

export function StatCard({
  label,
  value,
  icon,
  color = "blue",
  subtitle,
  isLoading = false,
}: StatCardProps) {
  const colors = colorMap[color];
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  if (isLoading) {
    return (
      <div
        className={cn(
          "ax-glass rounded-2xl p-5 border",
          colors.border,
        )}
      >
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ax-glass rounded-2xl p-5 border transition-all duration-300",
        colors.border,
      )}
      role="status"
      aria-label={`${label}: ${formattedValue}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            "border",
            colors.iconBg,
            colors.iconBorder,
            colors.text,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="ax-text-label text-ax-text-muted truncate">
            {label}
          </p>
          <p className={cn("text-lg font-bold tracking-tight font-ax-mono", colors.text)}>
            {formattedValue}
          </p>
          {subtitle && (
            <p className="ax-text-label text-ax-text-subtle mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
