import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../LoginPage";
import { RegisterPage } from "../RegisterPage";
import { AuthPage } from "../AuthPage";
import { useAuthStore } from "@/stores/authStore";

// Mock the auth store
vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

const mockUseAuthStore = vi.mocked(useAuthStore);

function createMockStore(overrides = {}) {
  const defaults = {
    user: null,
    isLoading: false,
    isInitialized: true,
    isAuthenticated: false,
    error: null,
    checkSession: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockResolvedValue(false),
    register: vi.fn().mockResolvedValue(false),
    completeAuth: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
    ...overrides,
  };
  return defaults;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------

describe("LoginPage", () => {
  it("renders login form with email and password fields", () => {
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("displays brand name", () => {
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    expect(screen.getByText("AutoExpert AI")).toBeInTheDocument();
    expect(screen.getByText("Asistente Automotriz")).toBeInTheDocument();
  });

  it("calls login with email and password on submit", async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue(true);
    mockUseAuthStore.mockReturnValue(createMockStore({ login: loginMock }));
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(loginMock).toHaveBeenCalledWith("test@example.com", "password123");
  });

  it("displays error message from store", () => {
    mockUseAuthStore.mockReturnValue(
      createMockStore({ error: "Correo electrónico o contraseña incorrectos" }),
    );
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    expect(screen.getByText("Correo electrónico o contraseña incorrectos")).toBeInTheDocument();
  });

  it("calls onSwitchToRegister when register link is clicked", async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<LoginPage onSwitchToRegister={onSwitch} />);

    await user.click(screen.getByText("Regístrate"));
    expect(onSwitch).toHaveBeenCalled();
  });

  it("disables submit button when fields are empty", () => {
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    const button = screen.getByRole("button", { name: /iniciar sesión/i });
    expect(button).toBeDisabled();
  });

  it("enables submit button when fields are filled", async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");

    const button = screen.getByRole("button", { name: /iniciar sesión/i });
    expect(button).toBeEnabled();
  });

  it("shows loading state during login", () => {
    mockUseAuthStore.mockReturnValue(createMockStore({ isLoading: true }));
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// RegisterPage
// ---------------------------------------------------------------------------

describe("RegisterPage", () => {
  it("renders register form with all fields", () => {
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre para mostrar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it("shows password mismatch warning", async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    const passwordInput = screen.getByLabelText(/^contraseña \*/i);
    const confirmInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(passwordInput, "password123");
    await user.type(confirmInput, "different");

    expect(screen.getByText("Las contraseñas no coinciden")).toBeInTheDocument();
  });

  it("calls register with correct params on submit", async () => {
    const user = userEvent.setup();
    const registerMock = vi.fn().mockResolvedValue(true);
    mockUseAuthStore.mockReturnValue(createMockStore({ register: registerMock }));
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await user.type(screen.getByLabelText(/nombre para mostrar/i), "Test User");
    await user.type(screen.getByLabelText(/^contraseña \*/i), "password123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(registerMock).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
      "password123",
      "Test User",
    );
  });

  it("calls register without displayName when empty", async () => {
    const user = userEvent.setup();
    const registerMock = vi.fn().mockResolvedValue(true);
    mockUseAuthStore.mockReturnValue(createMockStore({ register: registerMock }));
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await user.type(screen.getByLabelText(/^contraseña \*/i), "password123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(registerMock).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
      "password123",
      undefined,
    );
  });

  it("displays error from store", () => {
    mockUseAuthStore.mockReturnValue(
      createMockStore({ error: "Ya existe una cuenta con este correo electrónico" }),
    );
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    expect(screen.getByText("Ya existe una cuenta con este correo electrónico")).toBeInTheDocument();
  });

  it("calls onSwitchToLogin when login link is clicked", async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<RegisterPage onSwitchToLogin={onSwitch} />);

    await user.click(screen.getByText("Inicia sesión"));
    expect(onSwitch).toHaveBeenCalled();
  });

  it("disables submit button when form is incomplete", () => {
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    const button = screen.getByRole("button", { name: /crear cuenta/i });
    expect(button).toBeDisabled();
  });

  it("enables submit when all fields are valid", async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await user.type(screen.getByLabelText(/^contraseña \*/i), "password123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "password123");

    const button = screen.getByRole("button", { name: /crear cuenta/i });
    expect(button).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// AuthPage
// ---------------------------------------------------------------------------

describe("AuthPage", () => {
  it("renders login page by default", () => {
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<AuthPage />);

    expect(screen.getAllByText("Iniciar sesión").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("¿No tienes cuenta?")).toBeInTheDocument();
  });

  it("switches to register when Regístrate is clicked", async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<AuthPage />);

    await user.click(screen.getByText("Regístrate"));
    expect(screen.getAllByText("Crear cuenta").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("¿Ya tienes cuenta?")).toBeInTheDocument();
  });

  it("switches back to login from register", async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue(createMockStore());
    render(<AuthPage />);

    // Go to register
    await user.click(screen.getByText("Regístrate"));
    expect(screen.getAllByText("Crear cuenta").length).toBeGreaterThanOrEqual(1);

    // Go back to login
    await user.click(screen.getByText("Inicia sesión"));
    expect(screen.getAllByText("Iniciar sesión").length).toBeGreaterThanOrEqual(1);
  });
});
