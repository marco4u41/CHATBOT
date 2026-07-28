import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

const GlassModal = DialogPrimitive.Root;
const GlassModalTrigger = DialogPrimitive.Trigger;
const GlassModalClose = DialogPrimitive.Close;
const GlassModalPortal = DialogPrimitive.Portal;

const GlassModalOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-ax-fade-in",
      "data-[state=closed]:animate-ax-fade-in",
      className,
    )}
    {...props}
  />
));
GlassModalOverlay.displayName = "GlassModalOverlay";

type GlassModalContentSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

interface GlassModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: GlassModalContentSize;
}

const sizeClasses: Record<GlassModalContentSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-5xl",
  "2xl": "max-w-7xl",
  full: "w-[92vw] max-w-[1400px]",
};

const GlassModalContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  GlassModalContentProps
>(({ className, children, size = "md", ...props }, ref) => (
  <GlassModalPortal>
    <GlassModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        "ax-glass rounded-ax-lg border border-white/[0.08]",
        "shadow-ax-modal w-full",
        "data-[state=open]:animate-ax-scale-in",
        "focus:outline-none",
        sizeClasses[size],
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
  </GlassModalPortal>
));
GlassModalContent.displayName = "GlassModalContent";

const GlassModalHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between px-6 py-4 border-b border-white/[0.04]",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
GlassModalHeader.displayName = "GlassModalHeader";

const GlassModalTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("ax-text-heading text-base text-ax-text-primary", className)}
    {...props}
  />
));
GlassModalTitle.displayName = "GlassModalTitle";

const GlassModalDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-ax-text-muted mt-0.5", className)}
    {...props}
  />
));
GlassModalDescription.displayName = "GlassModalDescription";

const GlassModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("px-6 py-5 overflow-y-auto max-h-[75vh]", className)}
    {...props}
  />
);
GlassModalBody.displayName = "GlassModalBody";

const GlassModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-6 py-4 border-t border-white/[0.04]",
      className,
    )}
    {...props}
  />
);
GlassModalFooter.displayName = "GlassModalFooter";

export {
  GlassModal,
  GlassModalTrigger,
  GlassModalClose,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalBody,
  GlassModalFooter,
};
