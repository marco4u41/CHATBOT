import { describe, expect, it } from "vitest";
import {
  getStreamingDisplayContent,
  hasCarBlocks,
  parseMessageSegments,
} from "./carBlockParser";

const response = `La mejor para ciudad.

[CAR] {"brand":"Volkswagen","model":"Golf 1.4t Tsi","year":2020,"fuel_type":"Gasolina","price_usd":21990,"body_type":"Hatchback","scores":{"performance":7,"economy":9,"safety":8,"comfort":7,"reliability":8}} [/CAR]

Otra opción interesante.

[CAR]
{"brand":"Volkswagen","model":"Jetta","year":2019,"scores":{"performance":7,"economy":8,"safety":8,"comfort":8,"reliability":9}}
[/CAR]`;

describe("carBlockParser", () => {
  it("parses multiple cards containing nested score objects", () => {
    const segments = parseMessageSegments(response);
    const cards = segments.filter((segment) => segment.type === "car");

    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({
      type: "car",
      data: {
        brand: "Volkswagen",
        model: "Golf 1.4t Tsi",
        scores: { economy: 9 },
      },
    });
  });

  it("detects cards repeatedly without leaking regex state", () => {
    expect(hasCarBlocks(response)).toBe(true);
    expect(hasCarBlocks(response)).toBe(true);
    expect(parseMessageSegments(response).filter((segment) => segment.type === "car")).toHaveLength(2);
  });

  it("hides complete and incomplete technical blocks while streaming", () => {
    expect(getStreamingDisplayContent(response)).not.toContain("[CAR]");
    expect(getStreamingDisplayContent(response)).not.toContain('"scores"');
    expect(getStreamingDisplayContent('Texto visible\n[CAR] {"brand":"Volks')).toBe("Texto visible");
  });
});
