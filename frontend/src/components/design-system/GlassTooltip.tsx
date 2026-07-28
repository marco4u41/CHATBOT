import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface GlassTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  className?: string;
}

const GlassTooltipContent = forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 px-2.5 py-1.5 rounded-ax-sm text-xs font-ax-sans",
      "bg-ax-bg-elevated/95 text-ax-text-primary",
      "border border-white/[0.08]",
      "shadow-ax-card backdrop-blur-sm",
      "data-[state=delayed-open]:animate-ax-fade-in",
      "data-[state=closed]:animate-ax-fade-in",
      "whitespace-nowrap",
      className,
    )}
    {...props}
  />
));
GlassTooltipContent.displayName = "GlassTooltipContent";

export function GlassTooltip({
  content,
  children,
  side = "top",
  sideOffset,
  className,
}: GlassTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <GlassTooltipContent
          side={side}
          sideOffset={sideOffset}
          className={className}
        >
          {content}
        </GlassTooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
