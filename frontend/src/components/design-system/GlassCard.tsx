import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: ReactNode;
}

export function GlassCard({
  hover = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "ax-glass--light rounded-ax-xl",
        "shadow-ax-card",
        "transition-all duration-200",
        hover && "hover:border-white/[0.10] hover:shadow-ax-elevated",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface GlassCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function GlassCardHeader({
  icon,
  className,
  children,
  level = 3,
  ...props
}: GlassCardHeaderProps) {
  const Tag = `h${level}` as const;
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3.5",
        "border-b border-white/[0.04]",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="flex items-center justify-center w-8 h-8 rounded-ax-sm bg-ax-surface-light border border-white/[0.06]">
          {icon}
        </div>
      )}
      <Tag className="ax-text-heading text-xs text-ax-text-primary">
        {children}
      </Tag>
    </div>
  );
}

interface GlassCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function GlassCardContent({
  className,
  children,
  ...props
}: GlassCardContentProps) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}
