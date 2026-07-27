import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PageContainer({
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn("ax-page", className)}
      {...props}
    >
      <div className="ax-ambient-bg" aria-hidden="true" />
      {children}
    </div>
  );
}
