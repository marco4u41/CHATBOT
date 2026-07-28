import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/utils/cn";

export default function MessageInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isStreaming } = useChatStore();

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  return (
    <div className="shrink-0 px-4 sm:px-6 pb-4 pt-2 max-w-4xl mx-auto w-full">
      <div className="ax-message-capsule rounded-[22px] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu consulta técnica..."
            rows={1}
            aria-label="Escribe tu consulta técnica"
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-[var(--ax-text)] placeholder:text-[var(--ax-text-muted)] py-2 leading-relaxed max-h-40"
          />

          <AnimatePresence>
            {input.trim() && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                onClick={handleSubmit}
                disabled={isStreaming}
                className={cn(
                  "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all mb-0.5",
                  isStreaming
                    ? "bg-[var(--ax-glass-highlight)] text-[var(--ax-text-muted)] cursor-not-allowed"
                    : "bg-gradient-to-br from-ax-wine/70 to-ax-wine/50 text-white shadow-lg shadow-ax-wine/20 hover:shadow-ax-wine/30 hover:from-ax-wine/80 hover:to-ax-wine/60"
                )}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {!input.trim() && (
            <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--ax-glass-highlight)] text-[var(--ax-text-muted)] mb-0.5">
              <Send className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-[var(--ax-text-muted)] mt-2">
        AutoExpert AI — Asistente Técnico Automotriz
      </p>
    </div>
  );
}
