import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "neon" | "neon-orange" | "skeuomorphic-gold";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-gradient-to-br from-ax-accent-info/20 to-ax-accent-info/5",
    "border border-ax-accent-info/30 text-ax-accent-info",
    "hover:from-ax-accent-info/30 hover:to-ax-accent-info/10",
    "hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]",
    "active:scale-[0.97]",
  ),
  secondary: cn(
    "ax-glass--light",
    "text-ax-text-secondary hover:text-ax-text-primary",
    "hover:bg-ax-surface-light",
    "active:scale-[0.97]",
  ),
  ghost: cn(
    "bg-transparent text-ax-text-secondary",
    "hover:text-ax-text-primary hover:bg-ax-surface-light",
    "active:scale-[0.97]",
  ),
  danger: cn(
    "bg-gradient-to-br from-ax-accent-danger/20 to-ax-accent-danger/5",
    "border border-ax-accent-danger/30 text-ax-accent-danger",
    "hover:from-ax-accent-danger/30 hover:to-ax-accent-danger/10",
    "active:scale-[0.97]",
  ),
  neon: "bg-ax-accent-info text-white",
  "neon-orange": "bg-ax-accent-warning text-black",
  "skeuomorphic-gold": "bg-gradient-to-b from-ax-accent-warning/90 to-ax-accent-warning text-black",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-3 text-sm rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
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
          "inline-flex items-center justify-center font-semibold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-accent-warning/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ax-bg-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className={cn(
              "mr-2 h-3.5 w-3.5 animate-spin",
              variant === "skeuomorphic-gold" ? "text-ax-accent-warning" : "text-current",
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";