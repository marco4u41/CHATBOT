import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type IconButtonVariant = "default" | "wine" | "ghost" | "glass";
type IconButtonSize = "xs" | "sm" | "md" | "lg";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  tooltip?: string;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: cn(
    "bg-ax-surface-light text-ax-text-secondary border border-white/[0.06]",
    "hover:bg-ax-surface-light/80 hover:text-ax-text-primary",
  ),
  wine: cn(
    "bg-ax-wine/10 text-ax-wine-light border border-ax-wine/20",
    "hover:bg-ax-wine/20 hover:text-ax-wine-light",
  ),
  ghost: cn(
    "bg-transparent text-ax-text-muted",
    "hover:text-ax-text-primary hover:bg-white/[0.06]",
  ),
  glass: cn(
    "ax-glass--light text-ax-text-secondary",
    "hover:text-ax-text-primary",
  ),
};

const sizeClasses: Record<IconButtonSize, string> = {
  xs: "w-6 h-6 rounded-ax-sm",
  sm: "w-8 h-8 rounded-ax-sm",
  md: "w-9 h-9 rounded-ax-md",
  lg: "w-10 h-10 rounded-ax-md",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      isLoading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-wine/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ax-bg-deep",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
          "active:scale-[0.95]",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          children
        )}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
