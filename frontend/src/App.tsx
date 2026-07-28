import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import ChatWindow from "@/components/chat/ChatWindow";
import Sidebar from "@/components/sidebar/Sidebar";
import { GarageSidebar } from "@/components/sidebar/GarageSidebar";
import Header from "@/components/layout/Header";
import PhysicalPanel from "@/components/chat/PhysicalPanel";
import MessageInput from "@/components/chat/MessageInput";
import { AuthPage } from "@/components/auth/AuthPage";
import SettingsModal from "@/components/settings/SettingsModal";
import { useAuthStore } from "@/stores/authStore";
import { useGarageStore } from "@/stores/garageStore";
import { useConversationStore } from "@/stores/conversationStore";
import { applyTheme, getStoredTheme } from "@/utils/theme";

export default function App() {
  const { isAuthenticated, isInitialized, checkSession } = useAuthStore();
  const loadGarage = useGarageStore((s) => s.loadGarage);
  const loadConversations = useConversationStore((s) => s.loadConversations);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadGarage();
      loadConversations();
    }
  }, [isAuthenticated, loadGarage, loadConversations]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((o) => !o);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ax-bg-deep">
        <div className="ax-ambient-bg" aria-hidden="true" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ax-wine/20 to-ax-wine/5 flex items-center justify-center border border-ax-wine/15 animate-pulse">
            <svg className="h-8 w-8 text-ax-wine-light/70 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-xs text-white/40">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: "var(--ax-bg)" }}>
      {/* Ambient background */}
      <div className="ax-ambient-bg" aria-hidden="true" />

      {/* Desktop Sidebar — single toggle control */}
      <div className="hidden lg:flex relative z-30">
        <Sidebar
          onClose={closeSidebar}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      {/* Mobile Sidebar — overlay sheet */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50"
          >
            <div className="ax-sheet-overlay" onClick={closeSidebar} />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="ax-sheet-content w-[280px]"
              aria-label="Menú de navegación"
            >
              <Sidebar
                onClose={closeSidebar}
                isCollapsed={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 min-h-0">
        <Header
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleMobileSidebar={toggleSidebar}
        />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ChatWindow />
          <MessageInput />
        </div>
      </main>

      <PhysicalPanel />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GarageSidebar />
    </div>
  );
}
