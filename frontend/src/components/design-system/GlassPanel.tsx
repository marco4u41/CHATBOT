import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type GlassVariant = "default" | "light" | "solid";
type GlassRadius = "none" | "sm" | "md" | "lg" | "xl";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  radius?: GlassRadius;
  animate?: boolean;
  children: ReactNode;
}

const variantClasses: Record<GlassVariant, string> = {
  default: "ax-glass",
  light: "ax-glass--light",
  solid: "ax-glass--solid",
};

const radiusClasses: Record<GlassRadius, string> = {
  none: "",
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
};

export function GlassPanel({
  variant = "default",
  radius = "lg",
  animate = false,
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        radiusClasses[radius],
        animate && "animate-ax-fade-in",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
