import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart3,
  Wrench,
  Search,
  Gauge,
} from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useConversationStore } from "@/stores/conversationStore";
import MessageBubble from "./MessageBubble";
import StreamingIndicator from "./StreamingIndicator";
import { getStreamingDisplayContent } from "@/utils/carBlockParser";

const suggestions = [
  {
    icon: Search,
    label: "Diagnosticar",
    sublabel: "Códigos OBD-II",
    message:
      "Claro. Cuéntame qué falla presenta tu vehículo, cuándo ocurre y qué modelo, año y motor tiene.",
  },
  {
    icon: Wrench,
    label: "Mantenimiento",
    sublabel: "Plan preventivo",
    message:
      "Vamos a revisar el mantenimiento de tu vehículo. Dime el modelo, año, kilometraje y el último servicio realizado.",
  },
  {
    icon: BarChart3,
    label: "Comparar",
    sublabel: "Aceites y filtros",
    message:
      "Perfecto. ¿Qué vehículos quieres comparar y qué te importa más: precio, consumo, desempeño, espacio o confiabilidad?",
  },
  {
    icon: Gauge,
    label: "Rendimiento",
    sublabel: "Optimización",
    message:
      "Cuéntame qué vehículo tienes y qué quieres mejorar: respuesta, consumo, aceleración, manejo o mantenimiento.",
  },
];

export default function ChatWindow() {
  const { messages, isStreaming, streamingContent, error, loadMessages, clearMessages } =
    useChatStore();
  const { activeId } = useConversationStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevActiveIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (activeId && activeId !== prevActiveIdRef.current) {
      loadMessages(activeId);
    } else if (!activeId && prevActiveIdRef.current) {
      clearMessages();
    }
    prevActiveIdRef.current = activeId;
  }, [activeId, loadMessages, clearMessages]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto ax-scrollbar">
        <AnimatePresence mode="wait">
          {messages.length === 0 && !isStreaming ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center h-full px-6 py-12"
            >
              {/* Logo + Halo */}
              <div className="ax-welcome-halo mb-10 flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-ax-wine/40 via-ax-wine/25 to-ax-steel/20 border border-[var(--ax-glass-border)] flex items-center justify-center shadow-2xl relative z-10"
                >
                  <Wrench className="w-9 h-9 text-[var(--ax-text)]" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="ax-text-display text-[30px] mt-6 text-center"
                >
                  <span className="text-ax-gold/85">Auto</span>
                  <span className="text-[var(--ax-text)]">Expert</span>
                  <span className="text-ax-steel/70 text-xl ml-1.5 font-normal not-italic ax-text-heading">AI</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[var(--ax-text-secondary)] text-sm text-center mt-3 max-w-md leading-relaxed"
                >
                  Asistente técnico automotriz con IA.
                  <br />
                  Diagnósticos, mantenimiento, comparativas y más.
                </motion.p>
              </div>

              {/* Quick-access cards */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl"
              >
                {suggestions.map((s) => (
                  <div
                    key={s.label}
                    className="ax-suggestion px-5 py-4 text-left pointer-events-none cursor-default"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-[var(--ax-glass-highlight)] border border-[var(--ax-glass-border)] flex items-center justify-center shrink-0">
                        <s.icon className="w-4.5 h-4.5 text-[var(--ax-text-muted)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--ax-text-secondary)] leading-snug">
                          {s.label}
                        </p>
                        <p className="text-xs text-[var(--ax-text-muted)] mt-0.5">{s.sublabel}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5"
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {isStreaming && streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-[85%] lg:max-w-[72%] rounded-2xl px-5 py-3.5 shadow-lg ax-glass"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-ax-gold/15 flex items-center justify-center border border-ax-gold/20">
                      <span className="text-[10px] font-bold text-ax-gold/80">AE</span>
                    </div>
                    <span className="ax-text-label text-ax-gold/60">AutoExpert AI</span>
                  </div>
                  <div className="message-content text-sm leading-relaxed text-[var(--ax-text)]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {getStreamingDisplayContent(streamingContent)}
                    </ReactMarkdown>
                    <span className="inline-block w-0.5 h-4 bg-ax-steel/60 ml-0.5 animate-pulse align-middle" />
                  </div>
                </motion.div>
              )}

              {isStreaming && !streamingContent && <StreamingIndicator />}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 sm:mx-6 mb-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
