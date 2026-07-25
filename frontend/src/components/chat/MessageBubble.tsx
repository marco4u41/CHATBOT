import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { Message } from "@/types/chat";
import { cn } from "@/utils/cn";
import { parseMessageSegments } from "@/utils/carBlockParser";
import { CarCard } from "@/components/vehicle/CarCard";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

const markdownComponents: Components = {
  pre: ({ children }) => (
    <pre className="bg-obsidian-deep/80 text-gray-100 rounded-xl p-4 my-3 overflow-x-auto text-sm border border-gold-premium/[0.08] shadow-input-recessed">
      {children}
    </pre>
  ),
  code: ({ className: codeClassName, children, ...props }) => {
    const isInline = !codeClassName;
    if (isInline) {
      return (
        <code
          className="bg-gold-premium/[0.08] text-gold-light px-1.5 py-0.5 rounded text-sm font-mono border border-gold-premium/10"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={codeClassName} {...props}>
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-gold-premium/[0.08] bg-obsidian-deep/50">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-white/[0.04] transition-colors hover:bg-gold-premium/[0.03] last:border-b-0">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-semibold text-gold-premium/85 bg-gold-premium/[0.04] border-b border-gold-premium/15 text-[0.7rem] tracking-wider uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-left text-white/75">{children}</td>
  ),
  hr: () => (
    <hr className="border-none h-px my-5 bg-gradient-to-r from-transparent via-gold-premium/20 to-transparent" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="pl-4 my-3 text-gray-400 italic border-l-2 border-gold-premium/30 bg-gold-premium/[0.03] py-2 pr-3 rounded-r-lg">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold mt-4 mb-2 text-gold-light">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold mt-4 mb-2 text-gold-premium">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mt-4 mb-2 text-gold-premium/80">{children}</h3>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-gold-premium underline underline-offset-2 hover:text-gold-light transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex animate-slide-up",
        isUser ? "justify-end" : "justify-start",
      )}
      role="article"
      aria-label={isUser ? "Tu mensaje" : "Respuesta del asistente"}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? cn(
                "bg-obsidian-card backdrop-blur-xl border border-white/[0.08] text-white rounded-br-md",
                "shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.2)]",
                "before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:p-px",
                "before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent before:mask-composite-exclude before:[-webkit-mask-composite:xor]",
                "relative",
              )
            : cn(
                "premium-liquid-glass rounded-bl-md text-white/80",
              ),
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="message-content">
            <MessageContent content={message.content} isStreaming={isStreaming} />
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const segments = parseMessageSegments(content);

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === "car") {
          return (
            <div key={`car-${i}`} className="my-3">
              {segment.markdownBefore.trim() && (
                <div className="mb-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {segment.markdownBefore}
                  </ReactMarkdown>
                </div>
              )}
              <CarCard
                brand={segment.data.brand}
                model={segment.data.model}
                year={segment.data.year}
                engine={segment.data.engine}
                transmission={segment.data.transmission}
                fuel_type={segment.data.fuel_type}
                price_usd={segment.data.price_usd}
                scores={segment.data.scores}
              />
            </div>
          );
        }

        return (
          <ReactMarkdown
            key={`md-${i}`}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {segment.content}
          </ReactMarkdown>
        );
      })}

      {isStreaming && (
        <span
          className="inline-block w-[3px] h-4 bg-gold-premium animate-pulse ml-0.5 rounded-full"
          aria-hidden="true"
        />
      )}
    </>
  );
}
