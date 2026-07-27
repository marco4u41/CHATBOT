import { create } from "zustand";
import { apiClient } from "@/api/client";

interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  is_admin: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  error: string | null;

  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    confirmPassword: string,
    displayName?: string,
  ) => Promise<boolean>;
  completeAuth: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  isAuthenticated: false,
  error: null,

  checkSession: async () => {
    set({ isLoading: true });
    const raw = await apiClient.get<{ success: boolean; user: AuthUser | null; error: string | null }>("/auth/me");
    const resp = raw as unknown as { success: boolean; user: AuthUser | null; error: string | null };
    if (resp.success && resp.user) {
      set({
        user: resp.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ error: null, isLoading: true });
    const raw = await apiClient.post<{ success: boolean; user: AuthUser | null; error: string | null }>(
      "/auth/login",
      { email, password },
    );
    const resp = raw as unknown as { success: boolean; user: AuthUser | null; error: string | null };
    if (resp.success && resp.user) {
      set({
        user: resp.user,
        isLoading: false,
        error: null,
      });
      return true;
    }
    set({
      error: resp.error || "Error al iniciar sesión",
      isLoading: false,
    });
    return false;
  },

  register: async (email: string, password: string, confirmPassword: string, displayName?: string) => {
    set({ error: null, isLoading: true });
    const raw = await apiClient.post<{ success: boolean; user: AuthUser | null; error: string | null }>(
      "/auth/register",
      {
        email,
        password,
        confirm_password: confirmPassword,
        display_name: displayName || null,
      },
    );
    const resp = raw as unknown as { success: boolean; user: AuthUser | null; error: string | null };
    if (resp.success && resp.user) {
      set({
        user: resp.user,
        isLoading: false,
        error: null,
      });
      return true;
    }
    set({
      error: resp.error || "Error al registrar",
      isLoading: false,
    });
    return false;
  },

  completeAuth: () => set({ isAuthenticated: true }),

  logout: async () => {
    await apiClient.post("/auth/logout", {});
    set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
