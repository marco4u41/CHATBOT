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
  deleteConversation: (id: string) => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  activeId: null,
  isLoading: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    const response = await apiClient.get<Conversation[]>("/conversations");
    if (response.success && response.data) {
      set({ conversations: response.data, isLoading: false });
    } else {
      set({ error: response.error ?? "Error al cargar conversaciones", isLoading: false });
    }
  },

  setActive: (id) => set({ activeId: id }),

  deleteConversation: async (id) => {
    const response = await apiClient.delete(`/conversations/${id}`);
    if (response.success) {
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        activeId: s.activeId === id ? null : s.activeId,
      }));
    }
  },
}));
