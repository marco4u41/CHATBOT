import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartEmptyState } from "../ChartEmptyState";

describe("ChartEmptyState", () => {
  it("renders default message", () => {
    render(<ChartEmptyState />);
    expect(screen.getByText("Sin datos disponibles")).toBeDefined();
  });

  it("renders custom message", () => {
    render(<ChartEmptyState message="No hay nada" />);
    expect(screen.getByText("No hay nada")).toBeDefined();
  });
});
