import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportButton } from "../ExportButton";

describe("ExportButton", () => {
  it("renders with aria-label", () => {
    render(<ExportButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Exportar reporte" })).toBeDefined();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<ExportButton onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is focusable via keyboard", () => {
    render(<ExportButton onClick={() => {}} />);
    const button = screen.getByRole("button");
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("has type button", () => {
    render(<ExportButton onClick={() => {}} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("type")).toBe("button");
  });

  it("renders the export icon and text", () => {
    render(<ExportButton onClick={() => {}} />);
    expect(screen.getByText("Exportar")).toBeDefined();
  });
});
