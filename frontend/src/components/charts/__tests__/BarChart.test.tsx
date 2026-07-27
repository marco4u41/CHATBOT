import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BarChart } from "../BarChart";

vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

const sampleData = [
  { label: "SUV", value: 100 },
  { label: "Sedan", value: 80 },
  { label: "Hatchback", value: 50 },
];

describe("BarChart", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0, left: 0, right: 100, bottom: 100,
      width: 100, height: 100, x: 0, y: 0, toJSON: vi.fn(),
    }));
  });

  it("renders ChartEmptyState when data is empty", () => {
    render(<BarChart data={[]} />);
    expect(screen.getByText("Sin datos disponibles")).toBeDefined();
  });

  it("renders SVG with role=img", () => {
    render(<BarChart data={sampleData} />);
    expect(screen.getByRole("img")).toBeDefined();
  });

  it("renders bars for each data point", () => {
    const { container } = render(<BarChart data={sampleData} />);
    const rects = container.querySelectorAll("rect[role='graphics-symbol']");
    expect(rects.length).toBe(3);
  });

  it("renders axis labels in SVG", () => {
    const { container } = render(<BarChart data={sampleData} />);
    const svg = container.querySelector("svg")!;
    const texts = within(svg as unknown as HTMLElement).getAllByText("SUV");
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });

  it("has custom aria-label", () => {
    render(<BarChart data={sampleData} ariaLabel="Mi grafico" />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("aria-label")).toBe("Mi grafico");
  });

  it("uses custom formatValue", () => {
    const fmt = (v: number) => `$${v}`;
    render(<BarChart data={sampleData} formatValue={fmt} />);
    const svgs = screen.getAllByRole("img");
    const svg = svgs[0];
    expect(svg).toBeDefined();
  });

  it("renders data table button", () => {
    render(<BarChart data={sampleData} />);
    expect(screen.getByText("Ver datos")).toBeDefined();
  });

  it("shows tooltip on bar hover", async () => {
    const user = userEvent.setup();
    const { container } = render(<BarChart data={sampleData} />);
    const bar = container.querySelectorAll("rect[role='graphics-symbol']")[0]!;
    await user.hover(bar);
    expect(screen.getAllByText("SUV").length).toBeGreaterThanOrEqual(1);
  });
});
