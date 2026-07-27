import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="ax-text-label block text-ax-text-muted mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg px-3 py-2.5 text-sm font-ax-sans",
            "bg-ax-bg-deep/90 text-ax-text-primary placeholder:text-ax-text-subtle",
            "border border-white/[0.08]",
            "shadow-ax-inset",
            "transition-all duration-200",
            "focus:outline-none focus:border-ax-accent-primary/25 focus:shadow-ax-inset focus:shadow-[0_0_0_3px_rgba(111,38,64,0.06)]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error &&
              "border-ax-accent-danger/50 focus:border-ax-accent-danger/50 focus:shadow-[0_0_12px_rgba(153,27,27,0.1)]",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
                ? `${inputId}-hint`
                : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-xs text-ax-accent-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p
            id={`${inputId}-hint`}
            className="mt-1 text-xs text-ax-text-subtle"
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);

GlassInput.displayName = "GlassInput";
