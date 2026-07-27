import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartTooltip } from "../ChartTooltip";

describe("ChartTooltip", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <ChartTooltip
        x={10}
        y={20}
        label="Test"
        value="100"
        visible={false}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders label and value when visible", () => {
    render(
      <ChartTooltip
        x={10}
        y={20}
        label="SUV"
        value="1,500"
        visible
      />,
    );
    expect(screen.getByText("SUV")).toBeDefined();
    expect(screen.getByText("1,500")).toBeDefined();
  });

  it("renders secondaryValue when provided", () => {
    render(
      <ChartTooltip
        x={10}
        y={20}
        label="SUV"
        value="1,500"
        secondaryValue="25.5%"
        visible
      />,
    );
    expect(screen.getByText("25.5%")).toBeDefined();
  });

  it("does not render secondaryValue when not provided", () => {
    const { container } = render(
      <ChartTooltip
        x={10}
        y={20}
        label="SUV"
        value="1,500"
        visible
      />,
    );
    expect(container.querySelectorAll("p").length).toBe(2);
  });
});
