import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartLoadingState } from "../ChartLoadingState";

describe("ChartLoadingState", () => {
  it("renders with default height", () => {
    const { container } = render(<ChartLoadingState />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe("200px");
  });

  it("renders with custom height", () => {
    const { container } = render(<ChartLoadingState height={400} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe("400px");
  });
});
