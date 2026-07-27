import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickActions } from "../QuickActions";

describe("QuickActions", () => {
  const onNavigateToChat = vi.fn();
  const onExploreData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders four action cards", () => {
    render(<QuickActions onNavigateToChat={onNavigateToChat} onExploreData={onExploreData} />);
    expect(screen.getByText("Comparar Autos")).toBeDefined();
    expect(screen.getByText("Diagnosticar Falla")).toBeDefined();
    expect(screen.getByText("Recomendar Vehiculo")).toBeDefined();
    expect(screen.getByText("Explorar Datos")).toBeDefined();
  });

  it("navigates to chat when clicking Comparar", () => {
    render(<QuickActions onNavigateToChat={onNavigateToChat} onExploreData={onExploreData} />);
    fireEvent.click(screen.getByText("Comparar Autos"));
    expect(onNavigateToChat).toHaveBeenCalledTimes(1);
    expect(onExploreData).not.toHaveBeenCalled();
  });

  it("navigates to chat when clicking Diagnosticar", () => {
    render(<QuickActions onNavigateToChat={onNavigateToChat} onExploreData={onExploreData} />);
    fireEvent.click(screen.getByText("Diagnosticar Falla"));
    expect(onNavigateToChat).toHaveBeenCalledTimes(1);
  });

  it("navigates to chat when clicking Recomendar", () => {
    render(<QuickActions onNavigateToChat={onNavigateToChat} onExploreData={onExploreData} />);
    fireEvent.click(screen.getByText("Recomendar Vehiculo"));
    expect(onNavigateToChat).toHaveBeenCalledTimes(1);
  });

  it("calls onExploreData when clicking Explorar Datos", () => {
    render(<QuickActions onNavigateToChat={onNavigateToChat} onExploreData={onExploreData} />);
    fireEvent.click(screen.getByText("Explorar Datos"));
    expect(onExploreData).toHaveBeenCalledTimes(1);
    expect(onNavigateToChat).not.toHaveBeenCalled();
  });

  it("does not clear messages or send any message", () => {
    render(<QuickActions onNavigateToChat={onNavigateToChat} onExploreData={onExploreData} />);
    fireEvent.click(screen.getByText("Comparar Autos"));
    expect(onNavigateToChat).toHaveBeenCalled();
    expect(onExploreData).not.toHaveBeenCalled();
  });
});
