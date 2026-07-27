import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecentActivity } from "../RecentActivity";
import { useConversationStore } from "@/stores/conversationStore";
import { useChatStore } from "@/stores/chatStore";

vi.mock("@/stores/conversationStore");
vi.mock("@/stores/chatStore");

const mockConversationStore = vi.mocked(useConversationStore);
const mockChatStore = vi.mocked(useChatStore);

function setupStores(conversations: unknown[], activeId: string | null = null) {
  const loadMessages = vi.fn().mockResolvedValue(undefined);
  const setActive = vi.fn();

  mockConversationStore.mockImplementation(((selector: (s: unknown) => unknown) =>
    selector({
      conversations,
      activeId,
      setActive,
      isLoading: false,
      error: null,
    })) as typeof useConversationStore);

  mockChatStore.mockImplementation(((selector: (s: unknown) => unknown) =>
    selector({
      loadMessages,
    })) as typeof useChatStore);

  return { loadMessages, setActive };
}

describe("RecentActivity", () => {
  const onNavigateToChat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no conversations", () => {
    setupStores([]);
    render(<RecentActivity onNavigateToChat={onNavigateToChat} />);
    expect(screen.getByText(/Aun no hay actividad/)).toBeDefined();
  });

  it("renders up to 5 conversations sorted by updated_at desc", () => {
    const convs = [
      { id: "1", title: "Oldest", created_at: "2026-07-20T10:00:00Z", updated_at: "2026-07-20T10:00:00Z", message_count: 2 },
      { id: "2", title: "Newest", created_at: "2026-07-25T10:00:00Z", updated_at: "2026-07-25T10:00:00Z", message_count: 10 },
      { id: "3", title: "Middle", created_at: "2026-07-22T10:00:00Z", updated_at: "2026-07-22T10:00:00Z", message_count: 5 },
    ];
    setupStores(convs);
    render(<RecentActivity onNavigateToChat={onNavigateToChat} />);

    const items = screen.getAllByRole("button");
    expect(items.length).toBe(3);
    expect(items[0]!.textContent).toContain("Newest");
    expect(items[1]!.textContent).toContain("Middle");
    expect(items[2]!.textContent).toContain("Oldest");
  });

  it("shows 'Sin titulo' when title is empty", () => {
    setupStores([
      { id: "1", title: "", created_at: "2026-07-25T10:00:00Z", updated_at: "2026-07-25T10:00:00Z", message_count: 1 },
    ]);
    render(<RecentActivity onNavigateToChat={onNavigateToChat} />);
    expect(screen.getByText("Sin titulo")).toBeDefined();
  });

  it("shows 'Fecha no disponible' for invalid date", () => {
    setupStores([
      { id: "1", title: "Test", created_at: "invalid", updated_at: "invalid-date", message_count: 1 },
    ]);
    render(<RecentActivity onNavigateToChat={onNavigateToChat} />);
    expect(screen.getByText(/Fecha no disponible/)).toBeDefined();
  });

  it("calls loadMessages, setActive, and onNavigateToChat when selecting a conversation", () => {
    const { loadMessages, setActive } = setupStores([
      { id: "42", title: "Test Conv", created_at: "2026-07-25T10:00:00Z", updated_at: "2026-07-25T10:00:00Z", message_count: 3 },
    ]);
    render(<RecentActivity onNavigateToChat={onNavigateToChat} />);
    fireEvent.click(screen.getByText("Test Conv"));
    expect(loadMessages).toHaveBeenCalledWith("42");
    expect(setActive).toHaveBeenCalledWith("42");
    expect(onNavigateToChat).toHaveBeenCalledTimes(1);
  });

  it("displays message_count from conversation", () => {
    setupStores([
      { id: "1", title: "Conv", created_at: "2026-07-25T10:00:00Z", updated_at: "2026-07-25T10:00:00Z", message_count: 7 },
    ]);
    render(<RecentActivity onNavigateToChat={onNavigateToChat} />);
    expect(screen.getByText(/7 mensajes/)).toBeDefined();
  });
});
