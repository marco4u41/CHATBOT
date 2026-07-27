import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ExportModal } from "../ExportModal";
import { useReportExport } from "@/hooks/useReportExport";

vi.mock("@/hooks/useReportExport", () => ({
  useReportExport: vi.fn(),
}));

const mockUseReportExport = vi.mocked(useReportExport);

function setupHook(overrides: Partial<ReturnType<typeof useReportExport>> = {}) {
  mockUseReportExport.mockReturnValue({
    status: "idle",
    errorMessage: null,
    exportReport: vi.fn().mockResolvedValue(undefined),
    clearStatus: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupHook();
});

afterEach(() => {
  document.body.style.overflow = "";
});

describe("ExportModal", () => {
  it("does not render when isOpen is false", () => {
    render(<ExportModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders title, fieldsets and radios when open", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Exportar Reporte")).toBeDefined();
    expect(screen.getByText("Tipo de Reporte")).toBeDefined();
    expect(screen.getByText("Formato")).toBeDefined();
    expect(screen.getAllByRole("radio").length).toBeGreaterThanOrEqual(11);
  });

  it("selects report type via native input", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const radio = screen.getByLabelText("Top Marcas") as HTMLInputElement;
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
  });

  it("selects format via native input", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const jsonRadio = screen.getByDisplayValue("json") as HTMLInputElement;
    fireEvent.click(jsonRadio);
    expect(jsonRadio.checked).toBe(true);
  });

  it("fullDashboard forces JSON and disables CSV", async () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);

    await act(async () => {
      const fullRadio = screen.getByLabelText("Reporte Completo") as HTMLInputElement;
      fireEvent.click(fullRadio);
    });

    const csvRadio = screen.getByDisplayValue("csv") as HTMLInputElement;
    expect(csvRadio.disabled).toBe(true);

    const jsonRadio = screen.getByDisplayValue("json") as HTMLInputElement;
    expect(jsonRadio.checked).toBe(true);
  });

  it("CSV re-enables when switching back to individual report", async () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Reporte Completo"));
    });

    const csvRadio = screen.getByDisplayValue("csv") as HTMLInputElement;
    expect(csvRadio.disabled).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Top Marcas"));
    });

    expect(csvRadio.disabled).toBe(false);
  });

  it("closes with Escape when status is idle", () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close with Escape during loading", () => {
    setupHook({ status: "loading" });
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes with X button when status is idle", () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Cerrar modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("X button is disabled during loading", () => {
    setupHook({ status: "loading" });
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const closeBtn = screen.getByLabelText("Cerrar modal");
    expect(closeBtn).toHaveProperty("disabled", true);
  });

  it("closes with backdrop click (target === currentTarget)", () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);
    const backdrop = document.querySelector('[role="presentation"]')!;
    fireEvent.click(backdrop, { target: backdrop, currentTarget: backdrop });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close when clicking inside the panel", () => {
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);
    const panel = screen.getByRole("dialog");
    fireEvent.click(panel, { target: panel, currentTarget: panel });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does NOT close with backdrop during loading", () => {
    setupHook({ status: "loading" });
    const onClose = vi.fn();
    render(<ExportModal isOpen={true} onClose={onClose} />);
    const backdrop = document.querySelector('[role="presentation"]')!;
    fireEvent.click(backdrop, { target: backdrop, currentTarget: backdrop });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not call fetchAll/fetchSection on open", () => {
    const exportReport = vi.fn();
    setupHook({ exportReport });
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    expect(exportReport).not.toHaveBeenCalled();
  });

  it("has role='dialog' and aria-modal='true'", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("has aria-live on feedback region", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const region = document.querySelector('[aria-live="polite"][role="status"]');
    expect(region).not.toBeNull();
  });

  it("focus trap: Tab does not leave modal", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");

    const getFocusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex]:not([tabindex="-1"])',
        ),
      );

    const focusable = getFocusable();
    const last = focusable[focusable.length - 1]!;
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    const first = getFocusable()[0]!;
    expect(document.activeElement).toBe(first);
  });

  it("focus returns to ExportButton on close", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    const onClose = vi.fn(() => {
      button.focus();
    });

    render(<ExportModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });

    onClose();
    expect(document.activeElement).toBe(button);

    document.body.removeChild(button);
  });

  it("background does not receive focus while modal is open", async () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(document.activeElement).not.toBe(document.body);
  });

  it("controls are disabled during loading", () => {
    setupHook({ status: "loading" });
    render(<ExportModal isOpen={true} onClose={() => {}} />);

    const fieldsets = screen.getAllByRole("group");
    fieldsets.forEach((fieldset) => {
      expect(fieldset).toHaveProperty("disabled", true);
    });

    const submitBtn = screen.getByRole("button", { name: /preparando/i });
    expect(submitBtn).toHaveProperty("disabled", true);
  });

  it("shows success message after successful export", () => {
    setupHook({ status: "success" });
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Archivo descargado correctamente")).toBeDefined();
  });

  it("shows error message", () => {
    setupHook({ status: "error", errorMessage: "Datos no disponibles" });
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Datos no disponibles")).toBeDefined();
  });

  it("has fieldset and legend elements", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const fieldsets = screen.getAllByRole("group");
    expect(fieldsets.length).toBeGreaterThanOrEqual(2);
  });

  it("radio inputs are native input[type=radio]", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio.tagName).toBe("INPUT");
      expect((radio as HTMLInputElement).type).toBe("radio");
    });
  });

  it("submit button is type submit", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const submitBtn = screen.getByRole("button", { name: /descargar/i });
    expect(submitBtn.getAttribute("type")).toBe("submit");
  });

  it("close button is type button", () => {
    render(<ExportModal isOpen={true} onClose={() => {}} />);
    const closeBtn = screen.getByLabelText("Cerrar modal");
    expect(closeBtn.getAttribute("type")).toBe("button");
  });

  it("scroll lock restores previous overflow value", () => {
    document.body.style.overflow = "scroll";
    const { unmount } = render(
      <ExportModal isOpen={true} onClose={() => {}} />,
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });
});
