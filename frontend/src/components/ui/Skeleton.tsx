import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/5 shimmer",
        className,
      )}
      aria-hidden="true"
    />
  );
}
