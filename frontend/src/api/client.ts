import type { ApiResponse } from "@/types/chat";

const API_BASE_URL = "/api";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
        return { success: false, error: error.detail || "Error del servidor" };
      }
      return response.json();
    } catch (err) {
      if (err instanceof TypeError) {
        return { success: false, error: "Error de conexion" };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      };
    }
  }

  async getUnwrapped<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Error del servidor" }));
        return { success: false, error: error.detail || "Error del servidor" };
      }
      const text = await response.text();
      if (!text) {
        return { success: false, error: "Respuesta vacia del servidor" };
      }
      const raw: unknown = JSON.parse(text);
      return { success: true, data: raw as T };
    } catch (err) {
      if (err instanceof SyntaxError) {
        return { success: false, error: "JSON invalido del servidor" };
      }
      if (err instanceof TypeError) {
        return { success: false, error: "Error de conexion" };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      };
    }
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
        return { success: false, error: error.detail || "Error del servidor" };
      }
      return response.json();
    } catch (err) {
      if (err instanceof TypeError) {
        return { success: false, error: "Error de conexion" };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      };
    }
  }

  async delete(path: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
        return { success: false, error: error.detail || "Error del servidor" };
      }
      return response.json();
    } catch (err) {
      if (err instanceof TypeError) {
        return { success: false, error: "Error de conexion" };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      };
    }
  }

  streamChat(
    message: string,
    conversationId: string | null,
    onChunk: (content: string, done: boolean, conversationId: string) => void,
    onError: (error: string) => void,
  ): AbortController {
    const controller = new AbortController();

    const body = {
      message,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    };

    fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: "Error del servidor" }));
          onError(error.detail || "Error al iniciar chat");
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          onError("No se pudo leer el stream de respuesta");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  onError(data.error);
                  return;
                }
                onChunk(data.content ?? "", data.done ?? false, data.conversation_id ?? "");
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        onError(err instanceof Error ? err.message : "Error de conexión");
      });

    return controller;
  }
}

export const apiClient = new ApiClient();
