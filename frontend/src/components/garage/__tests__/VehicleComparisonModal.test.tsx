import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VehicleComparisonModal } from "../VehicleComparisonModal";
import type { GarageVehicle } from "@/types/vehicle";

const mockVehicles: GarageVehicle[] = [
  {
    id: "v1",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    engine: "1.8L",
    transmission: "automatic",
    fuel_type: "gasoline",
    price_usd: 22000,
    mileage_km: 30000,
    added_at: "2025-01-01",
  },
  {
    id: "v2",
    brand: "Honda",
    model: "Civic",
    year: 2023,
    engine: "2.0L",
    transmission: "manual",
    fuel_type: "gasoline",
    price_usd: 25000,
    mileage_km: 15000,
    added_at: "2025-01-02",
  },
];

const mockFourVehicles: GarageVehicle[] = [
  ...mockVehicles,
  {
    id: "v3",
    brand: "Ford",
    model: "Focus",
    year: 2021,
    engine: "1.5L",
    transmission: "automatic",
    fuel_type: "diesel",
    price_usd: 18000,
    mileage_km: 45000,
    added_at: "2025-01-03",
  },
  {
    id: "v4",
    brand: "Mazda",
    model: "3",
    year: 2024,
    engine: "2.5L",
    transmission: "automatic",
    fuel_type: "gasoline",
    price_usd: 28000,
    mileage_km: 5000,
    added_at: "2025-01-04",
  },
];

function renderModal(overrides = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    vehicles: mockVehicles,
    onRemoveVehicle: vi.fn(),
    onClearAll: vi.fn(),
    ...overrides,
  };
  return { ...defaultProps, ...render(<VehicleComparisonModal {...defaultProps} />) };
}

describe("VehicleComparisonModal", () => {
  it("does not render when isOpen is false", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Comparación de vehículos")).not.toBeInTheDocument();
  });

  it("renders with two vehicles", () => {
    renderModal();
    expect(screen.getByText("Comparación de vehículos")).toBeInTheDocument();
    expect(screen.getAllByText(/Toyota Corolla/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Honda Civic/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders with four vehicles", () => {
    renderModal({ vehicles: mockFourVehicles });
    expect(screen.getAllByText(/Ford Focus/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Mazda 3/).length).toBeGreaterThanOrEqual(1);
  });

  it("displays comparison table with correct rows", () => {
    renderModal();
    expect(screen.getByText("Característica")).toBeInTheDocument();
    expect(screen.getByText("Marca")).toBeInTheDocument();
    expect(screen.getByText("Modelo")).toBeInTheDocument();
    expect(screen.getByText("Año")).toBeInTheDocument();
    expect(screen.getByText("Precio")).toBeInTheDocument();
    expect(screen.getByText("Motor")).toBeInTheDocument();
    expect(screen.getByText("Transmisión")).toBeInTheDocument();
    expect(screen.getByText("Combustible")).toBeInTheDocument();
    expect(screen.getByText("Kilometraje")).toBeInTheDocument();
  });

  it("translates specs to Spanish", () => {
    renderModal();
    expect(screen.getByText("Automática")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getAllByText("Gasolina").length).toBeGreaterThanOrEqual(1);
  });

  it("shows formatted prices", () => {
    renderModal();
    expect(screen.getAllByText("USD 22,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("USD 25,000").length).toBeGreaterThanOrEqual(1);
  });

  it("shows formatted mileage", () => {
    renderModal();
    expect(screen.getByText("30,000 km")).toBeInTheDocument();
    expect(screen.getByText("15,000 km")).toBeInTheDocument();
  });

  it("highlights best price (lower is better)", () => {
    renderModal();
    const badges = screen.getAllByText("Menor precio");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("highlights most recent year", () => {
    renderModal();
    const badges = screen.getAllByText("Más reciente");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("highlights lowest mileage", () => {
    renderModal();
    const badges = screen.getAllByText("Menor kilometraje");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    const closeButtons = screen.getAllByText("Cerrar");
    await user.click(closeButtons[closeButtons.length - 1]!);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onRemoveVehicle when remove button is clicked", async () => {
    const user = userEvent.setup();
    const { onRemoveVehicle } = renderModal();
    const removeButton = screen.getByLabelText("Quitar Toyota Corolla de la comparación");
    await user.click(removeButton);
    expect(onRemoveVehicle).toHaveBeenCalledWith("v1");
  });

  it("calls onClearAll when clear button is clicked", async () => {
    const user = userEvent.setup();
    const { onClearAll } = renderModal();
    await user.click(screen.getByText("Limpiar comparación"));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("shows recommendation summary", () => {
    renderModal();
    expect(screen.getByText("Recomendación comparativa")).toBeInTheDocument();
    expect(screen.getAllByText(/Más económico/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Más reciente/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows warning when data is incomplete", () => {
    const incompleteVehicles = [
      { ...mockVehicles[0], mileage_km: undefined },
      { ...mockVehicles[1] },
    ];
    renderModal({ vehicles: incompleteVehicles });
    expect(
      screen.getByText(/Faltan especificaciones para realizar una recomendación completa/),
    ).toBeInTheDocument();
  });

  it("shows No disponible for missing data", () => {
    const vehiclesWithMissing = [
      { ...mockVehicles[0], engine: undefined, mileage_km: undefined },
      { ...mockVehicles[1], fuel_type: undefined },
    ];
    renderModal({ vehicles: vehiclesWithMissing });
    const naValues = screen.getAllByText("No disponible");
    expect(naValues.length).toBeGreaterThanOrEqual(2);
  });

  it("renders advantages section", () => {
    renderModal();
    expect(screen.getByText("Análisis por vehículo")).toBeInTheDocument();
  });

  it("does not render modal when less than 2 vehicles", () => {
    renderModal({ vehicles: [mockVehicles[0]] });
    expect(screen.queryByText("Comparación de vehículos")).not.toBeInTheDocument();
  });

  it("has accessible dialog attributes", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("translates transmission values to Spanish", () => {
    renderModal();
    expect(screen.getByText("Automática")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });

  it("translates fuel type values to Spanish", () => {
    renderModal();
    expect(screen.getAllByText("Gasolina").length).toBeGreaterThanOrEqual(1);
  });

  it("shows vehicle count in description", () => {
    renderModal();
    expect(screen.getByText("2 vehículos seleccionados para comparar")).toBeInTheDocument();
  });
});
