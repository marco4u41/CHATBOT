import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: ReactNode;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
};

export function ContentContainer({
  maxWidth = "xl",
  className,
  children,
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn("ax-content", maxWidthClasses[maxWidth], className)}
      {...props}
    >
      {children}
    </div>
  );
}
