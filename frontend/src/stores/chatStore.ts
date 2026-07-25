import { create } from "zustand";
import type { Message } from "@/types/chat";
import type { PhysicalPanelFilters } from "@/types/vehicle";
import { apiClient } from "@/api/client";

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentConversationId: string | null;
  streamingContent: string;
  error: string | null;
  physicalFilters: PhysicalPanelFilters;

  sendMessage: (content: string) => void;
  stopStreaming: () => void;
  loadMessages: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  setPhysicalFilters: (filters: PhysicalPanelFilters) => void;
  clearPhysicalFilters: () => void;
}

let activeController: AbortController | null = null;

function buildFilterContext(filters: PhysicalPanelFilters): string {
  const parts: string[] = [];
  if (filters.budget) parts.push(`Presupuesto: $${filters.budget.toLocaleString()} USD`);
  if (filters.terrain) parts.push(`Terreno: ${filters.terrain}`);
  if (filters.engine_type) parts.push(`Tipo de motor: ${filters.engine_type}`);
  if (parts.length === 0) return "";
  return `\n[Filtros activos del panel: ${parts.join(" | ")}]`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentConversationId: null,
  streamingContent: "",
  error: null,
  physicalFilters: {},

  sendMessage: (content: string) => {
    const state = get();
    if (state.isStreaming || !content.trim()) return;

    const filterContext = buildFilterContext(state.physicalFilters);
    const enrichedContent = filterContext
      ? `${content.trim()}\n${filterContext}`
      : content.trim();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      conversation_id: state.currentConversationId ?? "",
      created_at: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMessage],
      isStreaming: true,
      streamingContent: "",
      error: null,
    }));

    activeController = apiClient.streamChat(
      enrichedContent,
      state.currentConversationId,
      (chunkContent, done, conversationId) => {
        if (done) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: get().streamingContent + chunkContent,
            conversation_id: conversationId,
            created_at: new Date().toISOString(),
          };

          set((s) => ({
            messages: [...s.messages, assistantMessage],
            isStreaming: false,
            streamingContent: "",
            currentConversationId: conversationId,
          }));
        } else {
          set((s) => ({
            streamingContent: s.streamingContent + chunkContent,
          }));
        }
      },
      (error) => {
        set({ isStreaming: false, streamingContent: "", error });
      },
    );
  },

  stopStreaming: () => {
    activeController?.abort();
    activeController = null;
    set({ isStreaming: false, streamingContent: "" });
  },

  loadMessages: async (conversationId: string) => {
    const response = await apiClient.get<Message[]>(
      `/conversations/${conversationId}/messages`,
    );
    if (response.success && response.data) {
      set({
        messages: response.data,
        currentConversationId: conversationId,
        error: null,
      });
    }
  },

  clearMessages: () => set({ messages: [], currentConversationId: null }),
  clearError: () => set({ error: null }),

  setPhysicalFilters: (filters) => set({ physicalFilters: filters }),
  clearPhysicalFilters: () => set({ physicalFilters: {} }),
}));
