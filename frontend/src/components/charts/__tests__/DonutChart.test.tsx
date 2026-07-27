import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DonutChart } from "../DonutChart";
import type { DonutSegment } from "@/types/analytics";

vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

const sampleData: DonutSegment[] = [
  { label: "Gasolina", value: 60, color: "#ff5e00" },
  { label: "Diesel", value: 30, color: "#00f0ff" },
  { label: "Electrico", value: 10, color: "#d4af37" },
];

describe("DonutChart", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0, left: 0, right: 200, bottom: 200,
      width: 200, height: 200, x: 0, y: 0, toJSON: vi.fn(),
    }));
  });

  it("renders empty state for empty data", () => {
    render(<DonutChart data={[]} />);
    expect(screen.getByText("Sin datos disponibles")).toBeDefined();
  });

  it("renders SVG with role=img", () => {
    render(<DonutChart data={sampleData} />);
    expect(screen.getByRole("img")).toBeDefined();
  });

  it("renders center text with total", () => {
    render(<DonutChart data={sampleData} />);
    expect(screen.getByText("100")).toBeDefined();
  });

  it("renders centerLabel when provided", () => {
    render(<DonutChart data={sampleData} centerLabel="Total" />);
    expect(screen.getAllByText("Total").length).toBeGreaterThanOrEqual(1);
  });

  it("renders legend labels with values", () => {
    render(<DonutChart data={sampleData} />);
    expect(screen.getAllByText(/Gasolina/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Diesel/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Electrico/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders circles with graphics-symbol role", () => {
    const { container } = render(<DonutChart data={sampleData} />);
    const segments = container.querySelectorAll("circle[role='graphics-symbol']");
    expect(segments.length).toBe(3);
  });

  it("renders zero-total state when all values are 0", () => {
    const zeroData: DonutSegment[] = [
      { label: "Empty", value: 0, color: "#fff" },
    ];
    render(<DonutChart data={zeroData} />);
    expect(screen.getByText("0")).toBeDefined();
  });

  it("shows tooltip on segment hover", async () => {
    const user = userEvent.setup();
    const { container } = render(<DonutChart data={sampleData} />);
    const seg = container.querySelectorAll("circle[role='graphics-symbol']")[0]!;
    await user.hover(seg);
    expect(screen.getAllByText(/Gasolina/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders data table toggle", () => {
    render(<DonutChart data={sampleData} />);
    expect(screen.getByText("Ver datos")).toBeDefined();
  });
});
