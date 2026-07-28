import type { HTMLAttributes, ReactNode } from "react";
import { motion, type MotionProps } from "motion/react";
import { cn } from "@/utils/cn";

type GlassVariant = "default" | "light" | "solid" | "platinum";
type GlassRadius = "none" | "sm" | "md" | "lg" | "xl";

type GlassPanelProps = HTMLAttributes<HTMLDivElement> &
  Partial<MotionProps> & {
    variant?: GlassVariant;
    radius?: GlassRadius;
    animate?: boolean;
    motionPreset?: "fade" | "scale" | "slideUp" | "none";
    children: ReactNode;
  };

const variantClasses: Record<GlassVariant, string> = {
  default: "ax-glass",
  light: "ax-glass--light",
  solid: "ax-glass--solid",
  platinum: "ax-platinum-surface",
};

const radiusClasses: Record<GlassRadius, string> = {
  none: "",
  sm: "rounded-ax-sm",
  md: "rounded-ax-md",
  lg: "rounded-ax-lg",
  xl: "rounded-ax-xl",
};

const motionVariants = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  slideUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 12 },
  },
  none: {},
};

export function GlassPanel({
  variant = "default",
  radius = "lg",
  animate = false,
  motionPreset = "none",
  className,
  children,
  ...props
}: GlassPanelProps) {
  const variantClass = variantClasses[variant];
  const radiusClass = radiusClasses[radius];
  const classes = cn(variantClass, radiusClass, className);

  if (animate && motionPreset !== "none") {
    const preset = motionVariants[motionPreset];
    return (
      <motion.div
        className={classes}
        initial={preset.initial}
        animate={preset.animate}
        exit={preset.exit}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        {...(props as MotionProps)}
      >
        {children}
      </motion.div>
    );
  }

  if (animate) {
    return (
      <motion.div
        className={classes}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
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
