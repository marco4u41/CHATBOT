import type { HTMLAttributes, ReactNode } from "react";
import { motion, type MotionProps } from "motion/react";
import { cn } from "@/utils/cn";

type GlassCardProps = HTMLAttributes<HTMLDivElement> &
  Partial<MotionProps> & {
    hover?: boolean;
    animate?: boolean;
    children: ReactNode;
  };

export function GlassCard({
  hover = false,
  animate = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  const classes = cn(
    "ax-glass--light rounded-ax-xl",
    "shadow-ax-card",
    "transition-all duration-200",
    hover && "hover:border-white/[0.10] hover:shadow-ax-elevated hover:-translate-y-0.5",
    className,
  );

  if (animate) {
    return (
      <motion.div
        className={classes}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
        {...(props as MotionProps)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} {...props}>
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
