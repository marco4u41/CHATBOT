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
    <pre className="bg-ax-bg-deep/80 text-gray-100 rounded-xl p-4 my-3 overflow-x-auto text-sm border border-ax-gold/[0.08] shadow-ax-inset">
      {children}
    </pre>
  ),
  code: ({ className: codeClassName, children, ...props }) => {
    const isInline = !codeClassName;
    if (isInline) {
      return (
        <code
          className="bg-ax-gold/[0.08] text-ax-gold-light px-1.5 py-0.5 rounded text-sm font-ax-mono border border-ax-gold/10"
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
    <div className="my-4 overflow-x-auto rounded-xl border border-ax-gold/[0.08] bg-ax-bg-deep/50">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-white/[0.04] transition-colors hover:bg-ax-gold/[0.03] last:border-b-0">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-semibold text-ax-gold/85 bg-ax-gold/[0.04] border-b border-ax-gold/15 text-[0.7rem] tracking-wider uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-left text-ax-text-secondary">{children}</td>
  ),
  hr: () => (
    <hr className="border-none h-px my-5 bg-gradient-to-r from-transparent via-ax-gold/20 to-transparent" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="pl-4 my-3 text-ax-text-muted italic border-l-2 border-ax-gold/30 bg-ax-gold/[0.03] py-2 pr-3 rounded-r-lg">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h1 className="ax-text-heading text-xl mt-4 mb-2 text-ax-gold-light">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="ax-text-heading text-lg mt-4 mb-2 text-ax-gold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="ax-text-heading text-base mt-4 mb-2 text-ax-gold/80">{children}</h3>
  ),
  strong: ({ children }) => (
    <strong className="text-ax-text-primary font-semibold">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-ax-gold underline underline-offset-2 hover:text-ax-gold-light transition-colors"
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
        "flex animate-ax-slide-up",
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
                "ax-glass text-ax-text-primary rounded-br-md",
              )
            : cn(
                "ax-glass--light rounded-bl-md text-ax-text-secondary",
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
          className="inline-block w-[3px] h-4 bg-ax-gold animate-ax-pulse-wine ml-0.5 rounded-full"
          aria-hidden="true"
        />
      )}
    </>
  );
}
