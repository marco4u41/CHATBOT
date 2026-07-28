import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";

interface NavigationItemProps {
  active?: boolean;
  icon: ReactNode;
  label: string;
  badge?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function NavigationItem({
  active = false,
  icon,
  label,
  badge,
  className,
  onClick,
  disabled,
}: NavigationItemProps) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 px-3 py-2.5 text-left",
        "rounded-ax-md transition-colors duration-150",
        "text-sm font-ax-sans",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-wine/30 focus-visible:ring-offset-1 focus-visible:ring-offset-ax-bg-deep",
        active
          ? "ax-sidebar-active text-ax-text-primary"
          : "text-ax-text-muted hover:text-ax-text-secondary hover:bg-white/[0.04]",
        className,
      )}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12 }}
    >
      <span
        className={cn(
          "flex items-center justify-center w-5 h-5 shrink-0 transition-colors duration-150",
          active
            ? "text-ax-wine-light"
            : "text-ax-text-subtle group-hover:text-ax-text-muted",
        )}
      >
        {icon}
      </span>
      <span className="truncate flex-1">{label}</span>
      {badge && (
        <span className="ml-auto text-[10px] text-ax-text-subtle">{badge}</span>
      )}
    </motion.button>
  );
}
