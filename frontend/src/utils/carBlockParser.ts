import type { VehicleScores } from "@/types/vehicle";

interface ParsedCarBlock {
  brand: string;
  model: string;
  year: number;
  engine?: string;
  transmission?: string;
  fuel_type?: string;
  price_usd?: number;
  mileage_km?: number;
  scores?: VehicleScores;
}

export interface ContentSegment {
  type: "markdown";
  content: string;
}

export interface CarSegment {
  type: "car";
  data: ParsedCarBlock;
}

export type MessageSegment = ContentSegment | CarSegment;

const CAR_BLOCK_REGEX = /\[CAR\]\s*(\{[\s\S]*?\})\s*\[\/CAR\]/g;

export function parseMessageSegments(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(CAR_BLOCK_REGEX)) {
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;

    if (matchStart > lastIndex) {
      segments.push({
        type: "markdown",
        content: content.slice(lastIndex, matchStart),
      });
    }

    try {
      const jsonStr = match[1] ?? "";
      const data: ParsedCarBlock = JSON.parse(jsonStr);

      segments.push({
        type: "car",
        data,
      });
    } catch {
      segments.push({
        type: "markdown",
        content: match[0],
      });
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "markdown",
      content: content.slice(lastIndex),
    });
  }

  return segments;
}

export function hasCarBlocks(content: string): boolean {
  return CAR_BLOCK_REGEX.test(content);
}
