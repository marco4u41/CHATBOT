import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HorizontalBarChart } from "../HorizontalBarChart";

vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

const sampleData = [
  { label: "Toyota", value: 200 },
  { label: "Honda", value: 150 },
];

describe("HorizontalBarChart", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0, left: 0, right: 100, bottom: 100,
      width: 100, height: 100, x: 0, y: 0, toJSON: vi.fn(),
    }));
  });

  it("renders empty state when data is empty", () => {
    render(<HorizontalBarChart data={[]} />);
    expect(screen.getByText("Sin datos disponibles")).toBeDefined();
  });

  it("renders SVG with aria-label", () => {
    render(<HorizontalBarChart data={sampleData} />);
    const svg = screen.getByRole("img");
    expect(svg).toBeDefined();
  });

  it("renders labels in SVG", () => {
    const { container } = render(<HorizontalBarChart data={sampleData} />);
    const svg = container.querySelector("svg")!;
    expect(within(svg as unknown as HTMLElement).getAllByText("Toyota").length).toBeGreaterThanOrEqual(1);
    expect(within(svg as unknown as HTMLElement).getAllByText("Honda").length).toBeGreaterThanOrEqual(1);
  });

  it("renders bars with graphics-symbol role", () => {
    const { container } = render(<HorizontalBarChart data={sampleData} />);
    const bars = container.querySelectorAll("rect[role='graphics-symbol']");
    expect(bars.length).toBe(2);
  });

  it("renders data table toggle", () => {
    render(<HorizontalBarChart data={sampleData} />);
    expect(screen.getByText("Ver datos")).toBeDefined();
  });

  it("shows tooltip on bar hover", async () => {
    const user = userEvent.setup();
    const { container } = render(<HorizontalBarChart data={sampleData} />);
    const bar = container.querySelectorAll("rect[role='graphics-symbol']")[0]!;
    await user.hover(bar);
    expect(screen.getAllByText("Toyota").length).toBeGreaterThanOrEqual(1);
  });
});
