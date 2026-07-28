import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold";
type BadgeSize = "sm" | "md";

interface GlassBadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-white/[0.06] text-ax-text-secondary border border-white/[0.08]",
  primary:
    "bg-ax-wine/[0.10] text-ax-wine-light border border-ax-wine/20",
  success:
    "bg-ax-accent-success/[0.10] text-ax-accent-success border border-ax-accent-success/20",
  warning:
    "bg-ax-gold/[0.10] text-ax-gold border border-ax-gold/20",
  danger:
    "bg-ax-accent-danger/[0.15] text-red-400 border border-ax-accent-danger/25",
  info:
    "bg-ax-steel/[0.10] text-ax-steel-light border border-ax-steel/20",
  gold:
    "bg-ax-gold/[0.12] text-ax-gold-light border border-ax-gold/20",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-ax-text-muted",
  primary: "bg-ax-wine",
  success: "bg-ax-accent-success",
  warning: "bg-ax-gold",
  danger: "bg-ax-accent-danger",
  info: "bg-ax-steel",
  gold: "bg-ax-gold",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export function GlassBadge({
  variant = "default",
  size = "sm",
  dot = false,
  className,
  children,
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-ax-sans font-semibold",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
