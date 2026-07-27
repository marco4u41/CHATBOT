import { useEffect, useCallback, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  description?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-5xl",
  "2xl": "max-w-7xl",
  full: "w-[92vw] max-w-[1400px]",
};

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className,
  description,
}: GlassModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-ax-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        ref={dialogRef}
        className={cn(
          "ax-glass rounded-2xl border border-white/[0.08]",
          "shadow-ax-modal w-full",
          "animate-ax-scale-in",
          sizeClasses[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
            <div>
              <h2
                id="modal-title"
                className="ax-text-heading text-base text-ax-text-primary"
              >
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="text-xs text-ax-text-muted mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-ax-text-muted hover:text-ax-text-primary transition-colors p-1 rounded-lg hover:bg-white/[0.04]"
              aria-label="Cerrar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto max-h-[75vh]">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/[0.04]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
