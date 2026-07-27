import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-ax-surface animate-ax-shimmer",
        className,
      )}
      aria-hidden="true"
    />
  );
}
