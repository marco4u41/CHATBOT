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
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Physical Panel trigger */}
      <div className="flex-shrink-0 flex justify-end px-6 pt-3">
        <PhysicalPanel />
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 ax-scrollbar"
        role="log"
        aria-label="Mensajes del chat"
        aria-live="polite"
      >
        {messages.length === 0 && !isStreaming ? (
          <EmptyState onSend={sendMessage} />
        ) : (
          <div className="max-w-[820px] mx-auto space-y-5">
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
        <div className="mx-6 mb-3 rounded-xl px-4 py-2.5 bg-ax-accent-danger/[0.06] border border-ax-accent-danger/15">
          <p className="text-xs text-red-400 flex items-center gap-2">
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

const SUGGESTIONS = [
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    text: "Comparar autos",
    prompt: "Quiero comparar vehiculos. Quiero comparar un Toyota Corolla 2024 con un Honda Civic 2024.",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
      </svg>
    ),
    text: "Diagnosticar falla",
    prompt: "Mi auto hace un ruido extraño al frenar. Es un sedan 2020 con 45000 km. Que podria ser?",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    text: "Recomendar vehiculo",
    prompt: "Recomiendame un vehiculo familiar para ciudad con presupuesto de $25,000. Prefiero SUV o hatchback.",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    text: "Guia de mantenimiento",
    prompt: "Cuales son los mantenimientos importantes que debo hacerle a mi auto despues de 50,000 km?",
  },
];

interface EmptyStateProps {
  onSend?: (message: string) => void;
}

function EmptyState({ onSend }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      {/* Icon with halo */}
      <div className="ax-welcome-halo mb-8">
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-ax-wine/15 to-ax-wine/5 flex items-center justify-center border border-ax-wine/12 animate-ax-scale-in">
          <svg
            className="w-10 h-10 text-ax-wine-light/60"
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
      </div>

      <h2 className="ax-text-heading text-[28px] text-platinum mb-2 tracking-tight">
        Bienvenido a AutoBot
      </h2>
      <p className="text-sm text-ax-text-secondary max-w-md leading-relaxed font-ax-sans">
        Compara vehiculos, obtiene diagnosticos mecanicos y recomendaciones
        personalizadas. Escribe un mensaje para comenzar.
      </p>

      {/* Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 max-w-lg w-full">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.text}
            onClick={() => onSend?.(suggestion.prompt)}
            className="ax-suggestion flex items-center gap-3 px-4 py-3 text-left group"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-ax-text-muted group-hover:text-ax-wine-light group-hover:bg-ax-wine/[0.06] transition-all duration-200">
              {suggestion.icon}
            </span>
            <span className="text-[13px] font-medium text-ax-text-secondary group-hover:text-platinum transition-colors font-ax-sans">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
