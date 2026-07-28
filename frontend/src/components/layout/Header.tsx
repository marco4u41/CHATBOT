import { motion } from "motion/react";
import {
  Menu,
  Sparkles,
  Settings,
  Bell,
} from "lucide-react";
import { useConversationStore } from "@/stores/conversationStore";
import { useNotificationStore } from "@/stores/notificationStore";
import NotificationPanel from "@/components/notifications/NotificationPanel";

interface HeaderProps {
  onOpenSettings: () => void;
  onToggleMobileSidebar: () => void;
}

export default function Header({ onOpenSettings, onToggleMobileSidebar }: HeaderProps) {
  const { conversations, activeId } = useConversationStore();
  const { togglePanel, unreadCount } = useNotificationStore();

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="h-17 shrink-0 ax-glass--light border-b border-[var(--ax-glass-border)] flex items-center justify-between px-4 lg:px-6 z-20"
    >
      {/* Left: mobile menu + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl hover:bg-[var(--ax-glass-highlight)] text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)] transition-colors lg:hidden"
          title="Menú"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        {activeConversation ? (
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-[var(--ax-text)] truncate">
              {activeConversation.title}
            </h1>
            <p className="text-[11px] text-[var(--ax-text-muted)] mt-0.5">
              {activeConversation.message_count} mensajes
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ax-wine/30 to-ax-wine/15 flex items-center justify-center border border-[var(--ax-glass-border)] shadow-md">
              <Sparkles className="w-4 h-4 text-[var(--ax-text)]" />
            </div>
            <div>
              <h1 className="ax-text-display text-lg leading-tight">
                <span className="text-ax-gold/85">Auto</span>
                <span className="text-[var(--ax-text)]">Expert</span>
                <span className="text-ax-steel/70 text-sm ml-1 font-normal not-italic ax-text-heading">AI</span>
              </h1>
            </div>
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={togglePanel}
            className="p-2.5 rounded-xl text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)] hover:bg-[var(--ax-glass-highlight)] transition-colors relative"
            title="Notificaciones"
            aria-label="Notificaciones"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-ax-gold/80 text-[10px] font-bold text-[#06080D] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel />
        </div>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-[var(--ax-text-muted)] hover:text-[var(--ax-text-secondary)] hover:bg-[var(--ax-glass-highlight)] transition-colors"
          title="Configuración"
          aria-label="Configuración"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </motion.header>
  );
}
