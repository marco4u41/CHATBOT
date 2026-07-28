import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNotificationStore, type AppNotification } from "@/stores/notificationStore";
import { cn } from "@/utils/cn";

const typeConfig: Record<
  AppNotification["type"],
  { icon: typeof Bell; color: string; bg: string }
> = {
  info: { icon: Info, color: "text-ax-steel/80", bg: "bg-ax-steel/10" },
  success: { icon: CheckCircle, color: "text-green-400/80", bg: "bg-green-400/10" },
  warning: { icon: AlertTriangle, color: "text-ax-gold/80", bg: "bg-ax-gold/10" },
  error: { icon: XCircle, color: "text-red-400/80", bg: "bg-red-400/10" },
};

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Ahora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export default function NotificationPanel() {
  const { notifications, isOpen, markRead, markAllRead, clearAll, setPanelOpen } =
    useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setPanelOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-full right-0 mt-2 w-80 max-h-96 ax-glass rounded-2xl border border-[var(--ax-glass-border)] shadow-2xl z-50 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ax-glass-border)]">
            <span className="ax-text-label text-[var(--ax-text-muted)]">Notificaciones</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 rounded-lg text-[var(--ax-text-muted)] hover:text-[var(--ax-text)] hover:bg-[var(--ax-glass-highlight)] transition-colors"
                  title="Marcar todo como leído"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-lg text-[var(--ax-text-muted)] hover:text-[var(--ax-text)] hover:bg-[var(--ax-glass-highlight)] transition-colors"
                  title="Limpiar notificaciones"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto ax-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <Bell className="w-7 h-7 text-[var(--ax-text-secondary)] mb-2 opacity-40" />
                <p className="text-[var(--ax-text-muted)] text-xs">Sin notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--ax-glass-border)]">
                {notifications.map((n) => {
                  const cfg = typeConfig[n.type];
                  const Icon = cfg.icon;
                  return (
                    <li
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--ax-glass-highlight)]",
                        !n.read && "bg-[var(--ax-glass-highlight)]/50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            cfg.bg
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-[var(--ax-text)] truncate">
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-ax-gold/70 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--ax-text-muted)] mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-[var(--ax-text-secondary)] mt-1 block">
                            {formatTime(n.timestamp)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
