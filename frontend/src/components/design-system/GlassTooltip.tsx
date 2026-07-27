import { useState, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface GlassTooltipProps {
  content: ReactNode;
  position?: TooltipPosition;
  children: ReactNode;
  className?: string;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function GlassTooltip({
  content,
  position = "top",
  children,
  className,
}: GlassTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 px-2.5 py-1.5 rounded-lg text-xs font-ax-sans",
            "bg-ax-bg-elevated/95 text-ax-text-primary",
            "border border-white/[0.08]",
            "shadow-ax-card backdrop-blur-sm",
            "animate-ax-fade-in whitespace-nowrap pointer-events-none",
            positionClasses[position],
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
