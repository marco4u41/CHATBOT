import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types/chat";
import { parseMessageSegments, hasCarBlocks } from "@/utils/carBlockParser";
import VehicleCard from "./VehicleCard";
import { cn } from "@/utils/cn";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const showCarBlocks = !isUser && hasCarBlocks(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] lg:max-w-[72%] rounded-2xl px-5 py-3.5 shadow-lg",
          isUser
            ? "bg-gradient-to-br from-ax-wine/25 to-ax-wine/10 border border-ax-wine/18 text-[var(--ax-text)]"
            : "ax-glass text-[var(--ax-text)]"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-ax-gold/15 flex items-center justify-center border border-ax-gold/20">
              <span className="text-[10px] font-bold text-ax-gold/80">AE</span>
            </div>
            <span className="ax-text-label text-ax-gold/60">AutoExpert AI</span>
          </div>
        )}

        {showCarBlocks ? (
          <div className="message-content text-sm leading-relaxed">
            {parseMessageSegments(message.content).map((seg, i) => {
              if (seg.type === "markdown") {
                return (
                  <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                    {seg.content}
                  </ReactMarkdown>
                );
              }
              return (
                <VehicleCard
                  key={i}
                  brand={seg.data.brand}
                  model={seg.data.model}
                  year={seg.data.year}
                  engine={seg.data.engine}
                  transmission={seg.data.transmission}
                  fuel_type={seg.data.fuel_type}
                  price_usd={seg.data.price_usd}
                  mileage_km={seg.data.mileage_km}
                  scores={seg.data.scores}
                />
              );
            })}
          </div>
        ) : (
          <div className="message-content text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        <div
          className={cn(
            "text-[10px] mt-2 opacity-50",
            isUser ? "text-right" : "text-left"
          )}
        >
          {new Date(message.created_at).toLocaleTimeString("es-VE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
