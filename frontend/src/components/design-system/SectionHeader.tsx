import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-6",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-9 h-9 rounded-ax-sm bg-ax-surface-light border border-white/[0.06]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="ax-text-heading text-base text-ax-text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="ax-text-label text-ax-text-subtle mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
