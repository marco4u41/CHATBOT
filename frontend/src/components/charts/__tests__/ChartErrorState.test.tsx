import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChartErrorState } from "../ChartErrorState";

describe("ChartErrorState", () => {
  it("renders error message", () => {
    render(<ChartErrorState message="Error de carga" />);
    expect(screen.getByText("Error de carga")).toBeDefined();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<ChartErrorState message="Error" />);
    expect(screen.queryByText("Reintentar")).toBeNull();
  });

  it("renders and calls retry on click", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ChartErrorState message="Error" onRetry={onRetry} />);
    await user.click(screen.getByText("Reintentar"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
