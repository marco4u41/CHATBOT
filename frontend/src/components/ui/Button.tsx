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
    "bg-gradient-to-br from-neon-blue/20 to-neon-blue/5",
    "border border-neon-blue/30 text-neon-blue",
    "hover:from-neon-blue/30 hover:to-neon-blue/10",
    "hover:shadow-neon-blue",
    "active:scale-[0.97]",
  ),
  secondary: cn(
    "liquid-glass-panel-dense",
    "text-white/70 hover:text-white",
    "hover:bg-white/8",
    "active:scale-[0.97]",
  ),
  ghost: cn(
    "bg-transparent text-white/50",
    "hover:text-white hover:bg-white/5",
    "active:scale-[0.97]",
  ),
  danger: cn(
    "bg-gradient-to-br from-neon-red/20 to-neon-red/5",
    "border border-neon-red/30 text-neon-red",
    "hover:from-neon-red/30 hover:to-neon-red/10",
    "active:scale-[0.97]",
  ),
  neon: "neon-button text-neon-blue",
  "neon-orange": "neon-button-orange text-neon-orange",
  "skeuomorphic-gold": "skeuo-gold-button",
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-premium/50 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-deep",
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
              variant === "skeuomorphic-gold" ? "text-gold-premium" : "text-current",
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
