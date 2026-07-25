import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";

interface MessageInputProps {
  maxLength?: number;
  disabled?: boolean;
  onSend?: (message: string) => void;
}

export function MessageInput({
  maxLength = 2000,
  disabled = false,
  onSend,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;
  const isOverLimit = charCount > maxLength;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  function handleSubmit() {
    if (!value.trim() || disabled || isOverLimit) return;
    onSend?.(value.trim());
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-gold-premium/[0.08] premium-liquid-glass p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          {/* Gold beveled edge — top highlight */}
          <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-premium/20 to-transparent rounded-full" />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Escribe tu mensaje..."
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl px-4 py-3 pr-12 text-sm",
              "glass-input text-white placeholder:text-platinum/50",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-all duration-200",
              isOverLimit && "border-neon-red/50",
            )}
            aria-label="Mensaje del chat"
            aria-describedby="char-count"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim() || isOverLimit}
            className={cn(
              "absolute right-3 bottom-3 p-2 rounded-xl transition-all duration-200",
              value.trim() && !disabled && !isOverLimit
                ? "skeuo-gold-button text-gold-premium"
                : "bg-white/[0.03] text-white/15 cursor-not-allowed border border-white/[0.05]",
            )}
            aria-label="Enviar mensaje"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
        <p
          id="char-count"
          className={cn(
            "mt-1.5 text-[10px] text-right font-mono",
            isOverLimit
              ? "text-neon-red"
              : isNearLimit
                ? "text-neon-orange"
                : "text-platinum/40",
          )}
        >
          {charCount}/{maxLength}
        </p>
      </div>
    </div>
  );
}
