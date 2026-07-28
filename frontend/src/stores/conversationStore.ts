import { create } from "zustand";
import type { Conversation } from "@/types/chat";
import { apiClient } from "@/api/client";

interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  error: string | null;

  loadConversations: () => Promise<void>;
  setActive: (id: string | null) => void;
  addConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => Promise<boolean>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeId: null,
  isLoading: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Conversation[]>("/conversations");
      if (response.success && response.data) {
        set({ conversations: response.data, isLoading: false, error: null });
      } else {
        set({
          error: response.error ?? "Error al cargar conversaciones",
          isLoading: false,
        });
      }
    } catch {
      set({ error: "Error de conexión", isLoading: false });
    }
  },

  setActive: (id) => set({ activeId: id }),

  addConversation: (id: string, title: string) => {
    const state = get();
    const exists = state.conversations.some((c) => c.id === id);
    if (!exists) {
      set((s) => ({
        conversations: [
          {
            id,
            title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: 1,
          },
          ...s.conversations,
        ],
      }));
    } else {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, updated_at: new Date().toISOString(), message_count: c.message_count + 1 } : c,
        ),
      }));
    }
  },

  deleteConversation: async (id) => {
    try {
      const response = await apiClient.delete(`/conversations/${id}`);
      if (!response.success) {
        set({ error: response.error ?? "No se pudo eliminar la conversación" });
        return false;
      }

      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        activeId: s.activeId === id ? null : s.activeId,
        error: null,
      }));
      return true;
    } catch {
      set({ error: "Error de conexión al eliminar la conversación" });
      return false;
    }
  },
}));
