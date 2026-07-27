import { Skeleton } from "@/components/ui/Skeleton";

interface ChartLoadingStateProps {
  height?: number;
}

export function ChartLoadingState({ height = 200 }: ChartLoadingStateProps) {
  return (
    <div className="w-full" style={{ height }}>
      <Skeleton className="w-full h-full rounded-xl" />
    </div>
  );
}
