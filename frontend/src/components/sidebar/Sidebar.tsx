import { useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  LoaderCircle,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  PanelLeftClose,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useConversationStore } from "@/stores/conversationStore";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/format";

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { conversations, activeId, setActive, deleteConversation, isLoading } =
    useConversationStore();
  const { user, logout } = useAuthStore();
  const clearMessages = useChatStore((s) => s.clearMessages);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleNew = () => {
    clearMessages();
    setActive(null);
    onClose?.();
  };

  const handleSelect = (id: string) => {
    if (deletingId) return;
    setActive(id);
    onClose?.();
  };

  const handleDelete = async (id: string, title: string) => {
    setDeletingId(id);
    const wasActive = activeId === id;
    const deleted = await deleteConversation(id);
    setDeletingId(null);
    setConfirmingDeleteId(null);

    if (deleted) {
      if (wasActive) clearMessages();
      addNotification(
        "success",
        "Conversación eliminada",
        `“${title}” se eliminó de tu historial`,
      );
    } else {
      addNotification(
        "warning",
        "No se pudo eliminar",
        "Inténtalo nuevamente en unos segundos",
      );
    }
  };

  const handleLogout = async () => {
    clearMessages();
    useConversationStore.setState({ conversations: [], activeId: null });
    await logout();
  };

  const initials = user?.display_name
    ? user.display_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 64 : 280,
        opacity: 1,
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex flex-col h-full ax-sidebar-glass z-30 shrink-0"
      )}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ax-wine/50 to-ax-wine/30 flex items-center justify-center border border-[var(--ax-glass-border)] shrink-0 shadow-lg">
              <Wrench className="w-4.5 h-4.5 text-[var(--ax-text)]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--ax-text)] truncate leading-tight">
                AutoExpert
              </h2>
              <span className="text-[10px] text-[var(--ax-text-muted)] tracking-wider uppercase font-medium">
                AI Assistant
              </span>
            </div>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ax-wine/50 to-ax-wine/30 flex items-center justify-center border border-[var(--ax-glass-border)] mx-auto shadow-lg">
            <Wrench className="w-4.5 h-4.5 text-[var(--ax-text)]" />
          </div>
        )}
        {!isCollapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl hover:bg-[var(--ax-glass-highlight)] text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)] transition-colors"
            title="Colapsar panel"
            aria-label="Colapsar panel"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
        {isCollapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute top-5 right-2 p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white/70 transition-colors"
            title="Expandir panel"
            aria-label="Expandir panel"
          >
            <PanelLeftClose className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      {/* New Conversation Button */}
      <div className={cn("px-3 mb-2", isCollapsed && "px-2")}>
        <button
          onClick={handleNew}
          className={cn(
            "ax-interactive flex items-center gap-2.5 rounded-xl font-medium text-sm transition-all w-full",
            "bg-gradient-to-r from-ax-wine/25 to-ax-wine/15 border border-ax-wine/20 text-[var(--ax-text)] hover:border-ax-wine/35 hover:from-ax-wine/35 hover:to-ax-wine/25",
            isCollapsed ? "justify-center px-2 py-2.5" : "px-4 py-3"
          )}
        >
          <MessageSquarePlus className="w-4.5 h-4.5 shrink-0" />
          {!isCollapsed && <span>Nueva Consulta</span>}
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto ax-scrollbar px-3 py-2">
        {!isCollapsed && (
          <p className="ax-text-label text-[var(--ax-text-muted)] px-1 mb-2">Historial</p>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[var(--ax-glass-border)] border-t-ax-gold/60 rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          !isCollapsed && (
            <div className="text-center py-10 px-4">
              <MessageSquare className="w-8 h-8 text-[var(--ax-text-muted)] mx-auto mb-3 opacity-30" />
              <p className="text-[var(--ax-text-muted)] text-xs leading-relaxed">
                Sin conversaciones
                <br />
                <span className="opacity-60">Inicia una consulta técnica</span>
              </p>
            </div>
          )
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c, i) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.15) }}
              >
                <div
                  className={cn(
                    "ax-interactive relative flex w-full items-center rounded-xl transition-all group",
                    activeId === c.id
                      ? "ax-sidebar-active"
                      : "hover:bg-[var(--ax-glass-highlight)] border border-transparent hover:border-[var(--ax-glass-border)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    disabled={deletingId === c.id}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-3 text-left",
                      isCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5 pr-10",
                    )}
                    title={isCollapsed ? c.title : undefined}
                  >
                    <MessageSquare
                      className={cn(
                        "w-4 h-4 shrink-0",
                        activeId === c.id ? "text-ax-wine/70" : "text-[var(--ax-text-muted)]"
                      )}
                    />
                    {!isCollapsed && (
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm truncate leading-snug",
                            activeId === c.id ? "text-[var(--ax-text)] font-medium" : "text-[var(--ax-text-secondary)]"
                          )}
                        >
                          {c.title}
                        </p>
                        <span className="text-[11px] text-[var(--ax-text-muted)] mt-0.5 block">
                          {formatRelativeTime(c.updated_at)}
                        </span>
                      </div>
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="absolute right-1.5 flex items-center gap-0.5">
                      {confirmingDeleteId === c.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleDelete(c.id, c.title)}
                            disabled={deletingId === c.id}
                            className="ax-focus-ring rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                            aria-label={`Confirmar eliminación de ${c.title}`}
                            title="Confirmar eliminación"
                          >
                            {deletingId === c.id ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(null)}
                            disabled={deletingId === c.id}
                            className="ax-focus-ring rounded-lg p-1.5 text-[var(--ax-text-muted)] transition-colors hover:bg-[var(--ax-glass-highlight)] hover:text-[var(--ax-text)]"
                            aria-label="Cancelar eliminación"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(c.id)}
                          className="ax-focus-ring rounded-lg p-1.5 text-[var(--ax-text-muted)] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
                          aria-label={`Eliminar conversación ${c.title}`}
                          title="Eliminar conversación"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* User / Logout */}
      <div
        className={cn(
          "border-t border-[var(--ax-glass-border)] p-3",
          isCollapsed && "px-2"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-ax-steel/15 border border-[var(--ax-glass-border)] flex items-center justify-center text-[var(--ax-text-secondary)] text-xs font-semibold shrink-0">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--ax-text-secondary)] font-medium truncate">
                {user?.display_name || user?.email}
              </p>
              <span className="text-[10px] text-[var(--ax-text-muted)] block truncate">
                {user?.is_admin ? "Admin" : "Usuario"}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "p-2 rounded-xl text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)] hover:bg-[var(--ax-glass-highlight)] transition-colors",
              isCollapsed && "mx-auto"
            )}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
