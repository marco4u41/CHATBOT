import type { ApiResponse } from "@/types/chat";

const API_BASE_URL = "/api";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
      return { success: false, error: error.detail || "Error del servidor" };
    }
    return response.json();
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
      return { success: false, error: error.detail || "Error del servidor" };
    }
    return response.json();
  }

  async delete(path: string): Promise<ApiResponse<null>> {
    const response = await fetch(`${this.baseUrl}${path}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Error desconocido" }));
      return { success: false, error: error.detail || "Error del servidor" };
    }
    return response.json();
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
