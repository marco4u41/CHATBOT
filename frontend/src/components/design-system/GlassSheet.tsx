import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

const GlassSheet = DialogPrimitive.Root;
const GlassSheetTrigger = DialogPrimitive.Trigger;
const GlassSheetClose = DialogPrimitive.Close;
const GlassSheetPortal = DialogPrimitive.Portal;

type SheetSide = "left" | "right";

interface GlassSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: SheetSide;
}

const GlassSheetOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-fade-in",
      "data-[state=closed]:animate-fade-in",
      className,
    )}
    {...props}
  />
));
GlassSheetOverlay.displayName = "GlassSheetOverlay";

const GlassSheetContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  GlassSheetContentProps
>(({ className, children, side = "right", ...props }, ref) => (
  <GlassSheetPortal>
    <GlassSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-side={side}
      className={cn(
        "fixed z-50",
        "ax-sheet-content",
        "focus:outline-none",
        side === "right" && "top-0 right-0 bottom-0 w-[85vw] max-w-sm animate-slide-in-right",
        side === "left" && "top-0 left-0 bottom-0 w-[85vw] max-w-sm animate-slide-in-left",
        "data-[state=closed]:animate-fade-in",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 text-ax-text-muted hover:text-ax-text-primary transition-colors p-1 rounded-ax-sm hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ax-wine/30">
        <X size={16} aria-hidden="true" />
        <span className="sr-only">Cerrar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </GlassSheetPortal>
));
GlassSheetContent.displayName = "GlassSheetContent";

const GlassSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between px-6 py-4 border-b border-white/[0.04]",
      className,
    )}
    {...props}
  />
);
GlassSheetHeader.displayName = "GlassSheetHeader";

const GlassSheetTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("ax-text-heading text-base text-ax-text-primary", className)}
    {...props}
  />
));
GlassSheetTitle.displayName = "GlassSheetTitle";

const GlassSheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("px-6 py-5 overflow-y-auto flex-1", className)}
    {...props}
  />
);
GlassSheetBody.displayName = "GlassSheetBody";

export {
  GlassSheet,
  GlassSheetTrigger,
  GlassSheetClose,
  GlassSheetContent,
  GlassSheetHeader,
  GlassSheetTitle,
  GlassSheetBody,
};
