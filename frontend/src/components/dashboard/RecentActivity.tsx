import { useConversationStore } from "@/stores/conversationStore";
import { useChatStore } from "@/stores/chatStore";

function formatRelativeDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (isNaN(parsed.getTime())) return "Fecha no disponible";

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD}d`;
  return parsed.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

interface RecentActivityProps {
  onNavigateToChat: () => void;
}

export function RecentActivity({ onNavigateToChat }: RecentActivityProps) {
  const conversations = useConversationStore((s) => s.conversations);
  const activeId = useConversationStore((s) => s.activeId);
  const setActive = useConversationStore((s) => s.setActive);
  const loadMessages = useChatStore((s) => s.loadMessages);

  const sorted = [...conversations]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  function handleSelect(id: string) {
    loadMessages(id);
    setActive(id);
    onNavigateToChat();
  }

  return (
    <section aria-label="Actividad reciente">
      <h2 className="ax-text-label text-ax-text-muted mb-3">
        Actividad Reciente
      </h2>
      <div className="ax-glass--light rounded-xl overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="w-10 h-10 rounded-xl bg-ax-surface flex items-center justify-center mb-3">
              <svg className="h-5 w-5 text-ax-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="ax-text-label text-ax-text-subtle text-center leading-relaxed">
              Aun no hay actividad. Inicia una conversacion para ver tu historial aqui.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {sorted.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => handleSelect(c.id)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-white/[0.03] ${
                    activeId === c.id ? "bg-ax-surface-light" : ""
                  }`}
                >
                  <p className="text-sm text-ax-text-primary truncate font-medium">
                    {c.title || "Sin titulo"}
                  </p>
                  <p className="ax-text-label text-ax-text-muted font-ax-mono mt-1">
                    {c.message_count} mensajes · {formatRelativeDate(c.updated_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
