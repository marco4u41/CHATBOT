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
  const [isFocused, setIsFocused] = useState(false);
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
    <div className="flex-shrink-0 px-4 sm:px-6 pb-4 pt-2">
      <div className="max-w-[680px] mx-auto">
        {/* Floating Input Capsule */}
        <div
          className={cn(
            "ax-input-glass rounded-[20px] transition-all duration-300",
            isFocused && "border-ax-accent-info/25 shadow-[0_-2px_24px_rgba(0,0,0,0.35),0_4px_16px_rgba(0,0,0,0.25),0_0_0_1px_rgba(79,127,168,0.12)]",
            isOverLimit && "border-ax-accent-danger/40",
          )}
        >
          <div className="relative flex items-end">
            <textarea
              ref={textareaRef}
              id="chat-message"
              name="message"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              placeholder="Escribe tu mensaje..."
              rows={1}
              className={cn(
                "w-full resize-none rounded-[20px] px-5 py-4 pr-14 text-sm",
                "bg-transparent text-platinum placeholder:text-ax-text-subtle",
                "border-none shadow-none",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "transition-colors duration-200",
                "focus:outline-none",
                "font-ax-sans",
              )}
              aria-label="Mensaje del chat"
              aria-describedby="char-count"
            />

            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={disabled || !value.trim() || isOverLimit}
              className={cn(
                "absolute right-3 bottom-3 p-2.5 rounded-2xl transition-all duration-200",
                value.trim() && !disabled && !isOverLimit
                  ? "bg-gradient-to-br from-ax-wine to-ax-wine-light/90 text-white shadow-ax-glow-wine hover:from-ax-wine-light hover:to-ax-wine hover:shadow-[0_0_20px_rgba(125,41,72,0.25)] active:scale-[0.93]"
                  : "bg-white/[0.04] text-ax-text-subtle cursor-not-allowed border border-white/[0.06]",
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
        </div>

        {/* Character count */}
        <p
          id="char-count"
          className={cn(
            "mt-2 text-[10px] text-right font-ax-mono transition-colors",
            isOverLimit
              ? "text-ax-accent-danger"
              : isNearLimit
                ? "text-ax-accent-warning"
                : "text-ax-text-subtle",
          )}
        >
          {charCount}/{maxLength}
        </p>
      </div>
    </div>
  );
}
