import { useRef, useEffect, useState } from "react";
import { useChatStore } from "@/stores/chatStore";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { StreamingIndicator } from "./StreamingIndicator";
import { PhysicalPanel } from "./PhysicalPanel";
import { MAX_MESSAGE_LENGTH } from "@/config/constants";

export function ChatWindow() {
  const {
    messages,
    isStreaming,
    streamingContent,
    error,
    clearError,
    sendMessage,
  } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  useEffect(() => {
    if (!isUserScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, isUserScrolled]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setIsUserScrolled(!isAtBottom);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-3 liquid-glass-panel border-b border-white/8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-neon-green animate-glow-pulse" />
              AutoBot
            </h1>
            <p className="text-xs text-white/35 font-mono mt-0.5">
              Comparación · Diagnóstico · Recomendación
            </p>
          </div>
          <PhysicalPanel />
        </div>
      </header>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4"
        role="log"
        aria-label="Mensajes del chat"
        aria-live="polite"
      >
        {messages.length === 0 && !isStreaming ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{
                  id: "streaming",
                  role: "assistant",
                  content: streamingContent,
                  conversation_id: "",
                  created_at: new Date().toISOString(),
                }}
                isStreaming
              />
            )}
            {isStreaming && !streamingContent && <StreamingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-2 bg-neon-red/5 border-t border-neon-red/20">
          <p className="text-xs text-neon-red flex items-center gap-2">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{error}</span>
            <button onClick={clearError} className="underline hover:no-underline ml-2">
              Cerrar
            </button>
          </p>
        </div>
      )}

      {/* Input */}
      <MessageInput
        maxLength={MAX_MESSAGE_LENGTH}
        disabled={isStreaming}
        onSend={sendMessage}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16">
      <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-neon-blue/10 to-neon-orange/5 flex items-center justify-center border border-neon-blue/15 animate-tilt-in">
        <svg
          className="w-10 h-10 text-neon-blue/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 20.105V4.875A1.875 1.875 0 0 1 5.625 3h12.75A1.875 1.875 0 0 1 20.25 4.875v10.5A1.875 1.875 0 0 1 18.375 17.25H8.655l-3.46 2.595A.75.75 0 0 1 4 19.256Z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
        Bienvenido a AutoBot
      </h2>
      <p className="text-sm text-white/35 max-w-sm leading-relaxed">
        Compara vehículos, obtén diagnósticos mecánicos y recomendaciones
        personalizadas. Escribe un mensaje para comenzar.
      </p>
      <div className="flex gap-2 mt-6">
        {["Comparar autos", "Diagnosticar falla", "Recomendar vehículo"].map(
          (text) => (
            <span
              key={text}
              className="glass-badge rounded-full px-3 py-1.5 text-[11px] text-white/30"
            >
              {text}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
