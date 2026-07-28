import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/utils/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline"
  | "premium";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-gradient-to-br from-ax-wine to-ax-wine/80",
    "text-white font-semibold",
    "border border-ax-wine/30",
    "shadow-ax-glow-wine",
    "hover:brightness-110 hover:shadow-[0_0_24px_rgba(139,49,82,0.25)]",
    "active:scale-[0.97]",
  ),
  secondary: cn(
    "bg-ax-surface-light",
    "text-ax-text-secondary border border-white/[0.08]",
    "hover:bg-ax-surface-light/80 hover:text-ax-text-primary",
    "active:scale-[0.97]",
  ),
  ghost: cn(
    "bg-transparent text-ax-text-muted",
    "hover:text-ax-text-primary hover:bg-white/[0.04]",
    "active:scale-[0.97]",
  ),
  danger: cn(
    "bg-ax-accent-danger",
    "text-white font-semibold",
    "border border-ax-accent-danger/30",
    "hover:brightness-110",
    "active:scale-[0.97]",
  ),
  outline: cn(
    "bg-transparent text-ax-wine-light",
    "border border-ax-wine/30",
    "hover:bg-ax-wine/[0.06] hover:border-ax-wine/50",
    "active:scale-[0.97]",
  ),
  premium: cn(
    "bg-gradient-to-br from-ax-gold/12 to-ax-gold/4",
    "text-ax-gold border border-ax-gold/20",
    "shadow-ax-glow-gold",
    "hover:from-ax-gold/20 hover:to-ax-gold/8",
    "hover:border-ax-gold/35",
    "active:scale-[0.97]",
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-[11px] rounded-ax-sm gap-1",
  sm: "px-3 py-1.5 text-xs rounded-ax-sm gap-1.5",
  md: "px-4 py-2 text-sm rounded-ax-md gap-2",
  lg: "px-6 py-2.5 text-sm rounded-ax-lg gap-2",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    if (asChild) {
      return (
        <Slot
          className={cn(
            "inline-flex items-center justify-center font-ax-sans",
            "transition-all duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-wine/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ax-bg-deep",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
            variantClasses[variant],
            sizeClasses[size],
            className,
          )}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-ax-sans",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-wine/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ax-bg-deep",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <svg
            className="mr-2 h-3.5 w-3.5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    );
  },
);

GlassButton.displayName = "GlassButton";
