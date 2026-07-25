export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  conversation_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatRequest {
  conversation_id?: string;
  message: string;
}

export interface ChatStreamChunk {
  content: string;
  done: boolean;
  conversation_id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
