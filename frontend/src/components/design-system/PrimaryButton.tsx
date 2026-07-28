import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "motion/react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/utils/cn";

type PrimarySize = "xs" | "sm" | "md" | "lg";

interface PrimaryButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: PrimarySize;
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeClasses: Record<PrimarySize, string> = {
  xs: "px-2.5 py-1 text-[11px] rounded-ax-sm gap-1",
  sm: "px-3 py-1.5 text-xs rounded-ax-sm gap-1.5",
  md: "px-4 py-2 text-sm rounded-ax-md gap-2",
  lg: "px-6 py-2.5 text-sm rounded-ax-lg gap-2",
};

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      size = "md",
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      type = "button",
      onClick,
      tabIndex,
      "aria-label": ariaLabel,
      form,
      name,
      value,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    const classes = cn(
      "inline-flex items-center justify-center font-ax-sans font-semibold",
      "bg-gradient-to-br from-ax-wine to-ax-wine/80",
      "text-white",
      "border border-ax-wine/30",
      "shadow-ax-glow-wine",
      "transition-all duration-200 ease-out",
      "hover:brightness-110 hover:shadow-[0_0_24px_rgba(139,49,82,0.25)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-wine/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ax-bg-deep",
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
      sizeClasses[size],
      className,
    );

    const content = isLoading ? (
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
    );

    if (asChild) {
      return (
        <Slot className={classes} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        form={form}
        name={name}
        value={value}
        className={classes}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.15 }}
      >
        {content}
        {children}
        {rightIcon}
      </motion.button>
    );
  },
);

PrimaryButton.displayName = "PrimaryButton";
