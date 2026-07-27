import { useState, useEffect, useCallback, useRef } from "react";

interface ChartDimensions {
  width: number;
  height: number;
}

export function useChartDimensions(
  defaultWidth = 400,
  defaultHeight = 200,
): [React.RefObject<HTMLDivElement | null>, ChartDimensions] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: defaultWidth,
    height: defaultHeight,
  });

  const updateDimensions = useCallback(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [updateDimensions]);

  return [ref, dimensions];
}
