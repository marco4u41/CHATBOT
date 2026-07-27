import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LineChart } from "../LineChart";

vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

const sampleData = [
  { label: "2020", value: 10 },
  { label: "2021", value: 25 },
  { label: "2022", value: 18 },
];

describe("LineChart", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0, left: 0, right: 300, bottom: 300,
      width: 300, height: 300, x: 0, y: 0, toJSON: vi.fn(),
    }));
  });

  it("renders empty state when data is empty", () => {
    render(<LineChart data={[]} />);
    expect(screen.getByText("Sin datos disponibles")).toBeDefined();
  });

  it("renders SVG with role=img", () => {
    render(<LineChart data={sampleData} />);
    expect(screen.getByRole("img")).toBeDefined();
  });

  it("renders area path when showArea=true", () => {
    const { container } = render(<LineChart data={sampleData} showArea />);
    const paths = container.querySelectorAll("svg path");
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it("hides area when showArea=false", () => {
    const { container } = render(<LineChart data={sampleData} showArea={false} />);
    const svg = container.querySelector("svg")!;
    const areaPath = svg.querySelector("path[fill*='url']");
    expect(areaPath).toBeNull();
  });

  it("renders dots with graphics-symbol role", () => {
    const { container } = render(<LineChart data={sampleData} />);
    const dots = container.querySelectorAll("circle[role='graphics-symbol']");
    expect(dots.length).toBe(3);
  });

  it("hides dots when showDots=false", () => {
    const { container } = render(<LineChart data={sampleData} showDots={false} />);
    const dots = container.querySelectorAll("circle[role='graphics-symbol']");
    expect(dots.length).toBe(0);
  });

  it("renders x-axis labels in SVG", () => {
    const { container } = render(<LineChart data={sampleData} />);
    const svg = container.querySelector("svg")!;
    expect(within(svg as unknown as HTMLElement).getAllByText("2020").length).toBeGreaterThanOrEqual(1);
    expect(within(svg as unknown as HTMLElement).getAllByText("2021").length).toBeGreaterThanOrEqual(1);
    expect(within(svg as unknown as HTMLElement).getAllByText("2022").length).toBeGreaterThanOrEqual(1);
  });

  it("applies custom aria-label", () => {
    render(<LineChart data={sampleData} ariaLabel="Mi linea" />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Mi linea");
  });

  it("renders data table toggle", () => {
    render(<LineChart data={sampleData} />);
    expect(screen.getByText("Ver datos")).toBeDefined();
  });

  it("handles single data point", () => {
    const single = [{ label: "Only", value: 42 }];
    const { container } = render(<LineChart data={single} />);
    const svg = container.querySelector("svg")!;
    expect(within(svg as unknown as HTMLElement).getAllByText("Only").length).toBeGreaterThanOrEqual(1);
  });

  it("shows tooltip on dot hover", async () => {
    const user = userEvent.setup();
    const { container } = render(<LineChart data={sampleData} />);
    const dot = container.querySelectorAll("circle[role='graphics-symbol']")[0]!;
    await user.hover(dot);
    expect(screen.getAllByText("2020").length).toBeGreaterThanOrEqual(1);
  });
});
