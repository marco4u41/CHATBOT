import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/utils/cn";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, hint, className, id, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== "";
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const isFloating = focused || hasValue;

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          className={cn(
            "peer w-full rounded-ax-md px-4 pb-2.5 pt-5 text-sm font-ax-sans",
            "text-ax-text-primary placeholder:text-transparent",
            "ax-input-glass",
            "transition-all duration-200",
            "focus:outline-none focus:border-ax-wine/30",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error &&
              "border-ax-accent-danger/50 focus:border-ax-accent-danger/50",
            className,
          )}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-4 pointer-events-none font-ax-sans transition-colors duration-200",
            focused && "text-ax-wine-light",
            error && "text-ax-accent-danger",
          )}
        >
          <AnimatePresence mode="wait">
            {isFloating ? (
              <motion.span
                key="floating"
                initial={{ y: 8, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 8, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="block top-2 text-[10px] ax-text-label tracking-wider"
              >
                {label}
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="block top-1/2 -translate-y-1/2 text-sm text-ax-text-subtle"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </label>
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 text-xs text-ax-accent-danger"
              role="alert"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {!error && hint && (
          <p
            id={`${inputId}-hint`}
            className="mt-1.5 text-xs text-ax-text-subtle"
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);

FloatingInput.displayName = "FloatingInput";
