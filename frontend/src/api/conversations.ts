import { apiClient } from "./client";
import type { Conversation, Message, ApiResponse } from "@/types/chat";
import type { VehicleComparisonRequest } from "@/types/vehicle";

export async function getConversations(): Promise<ApiResponse<Conversation[]>> {
  return apiClient.get<Conversation[]>("/conversations");
}

export async function getConversationMessages(
  conversationId: string,
): Promise<ApiResponse<Message[]>> {
  return apiClient.get<Message[]>(`/conversations/${conversationId}/messages`);
}

export async function deleteConversation(
  conversationId: string,
): Promise<ApiResponse<null>> {
  return apiClient.delete(`/conversations/${conversationId}`);
}

export async function compareVehicles(
  request: VehicleComparisonRequest,
): Promise<ApiResponse<{ response: string }>> {
  return apiClient.post<{ response: string }>("/vehicles/compare", request);
}
