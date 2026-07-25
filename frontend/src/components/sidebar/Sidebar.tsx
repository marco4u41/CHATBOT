import { useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useConversationStore } from "@/stores/conversationStore";
import { cn } from "@/utils/cn";

export function Sidebar() {
  const { conversations, activeId, isLoading, loadConversations, setActive } =
    useConversationStore();
  const { clearMessages } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  function handleNewChat() {
    clearMessages();
    setActive(null);
  }

  return (
    <aside className="w-72 flex-shrink-0 liquid-glass-panel border-r border-white/8 flex flex-col">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-orange/10 flex items-center justify-center border border-neon-blue/20">
            <svg className="h-5 w-5 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 20.105V4.875A1.875 1.875 0 0 1 5.625 3h12.75A1.875 1.875 0 0 1 20.25 4.875v10.5A1.875 1.875 0 0 1 18.375 17.25H8.655l-3.46 2.595A.75.75 0 0 1 4 19.256Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">AutoBot</h1>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
              Asistente Automotriz
            </p>
          </div>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full neon-button rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neon-blue"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva conversación
          </span>
        </button>
      </div>

      {/* Conversations List */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Conversaciones">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-white/[0.03] shimmer"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mb-3">
              <svg className="h-5 w-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-xs text-white/25 text-center leading-relaxed">
              Inicia una conversación para comenzar
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => setActive(conversation.id)}
                  className={cn(
                    "w-full text-left rounded-xl px-3 py-3 transition-all duration-200 group",
                    activeId === conversation.id
                      ? "liquid-glass-panel-dense border-neon-blue/20 text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]",
                  )}
                >
                  <span className="block truncate text-sm font-medium">
                    {conversation.title}
                  </span>
                  <span className="block truncate text-[10px] text-white/25 font-mono mt-1">
                    {conversation.message_count} mensajes
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
