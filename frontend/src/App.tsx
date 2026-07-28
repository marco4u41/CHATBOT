import { useState, useRef, useEffect, useCallback } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { GarageSidebar } from "@/components/sidebar/GarageSidebar";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Header } from "@/components/layout/Header";
import { AuthPage } from "@/components/auth/AuthPage";
import { useAuthStore } from "@/stores/authStore";
import { useGarageStore } from "@/stores/garageStore";
import { cn } from "@/utils/cn";

export default function App() {
  const { isAuthenticated, isInitialized, checkSession, user } = useAuthStore();
  const loadGarage = useGarageStore((s) => s.loadGarage);
  const [view, setView] = useState<"chat" | "dashboard">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatViewRef = useRef<HTMLDivElement>(null);
  const dashboardViewRef = useRef<HTMLDivElement>(null);
  const dashboardHeaderRef = useRef<HTMLHeadingElement>(null);
  const isAdmin = user?.is_admin ?? false;

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (isAuthenticated) {
      loadGarage();
    }
  }, [isAuthenticated, loadGarage]);

  const setViewStable = useCallback((v: "chat" | "dashboard") => {
    if (v === "dashboard" && !isAdmin) {
      return;
    }
    setView(v);
    setSidebarOpen(false);
  }, [isAdmin]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((o) => !o);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (view === "chat") {
      chatViewRef.current?.focus();
    } else {
      dashboardHeaderRef.current?.focus();
    }
  }, [view]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ax-bg-deep">
        <div className="ax-ambient-bg" aria-hidden="true" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ax-wine/20 to-ax-wine/5 flex items-center justify-center border border-ax-wine/15 animate-ax-scale-in">
            <svg className="h-8 w-8 text-ax-wine-light/70 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-xs text-ax-text-muted font-ax-sans">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ax-bg-deep font-ax-sans">
      {/* Ambient background */}
      <div className="ax-ambient-bg" aria-hidden="true" />

      <Sidebar
        view={view}
        onNavigate={setViewStable}
        isMobileOpen={sidebarOpen}
        onMobileClose={closeSidebar}
      />

      {/* Main content area — visually separated from sidebar */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 min-h-0 bg-ax-bg-deep/60">
        <Header view={view} onToggleSidebar={toggleSidebar} />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div
            ref={chatViewRef}
            className={cn(
              "flex-1 flex flex-col min-h-0",
              view !== "chat" && "hidden",
            )}
            aria-hidden={view !== "chat" || undefined}
            tabIndex={-1}
          >
            <ChatWindow />
          </div>

          <div
            ref={dashboardViewRef}
            className={cn(
              "flex-1 flex flex-col min-h-0",
              view !== "dashboard" && "hidden",
            )}
            aria-hidden={view !== "dashboard" || undefined}
            tabIndex={-1}
          >
            {isAdmin && (
              <DashboardPage
                onNavigate={setViewStable}
                headerRef={dashboardHeaderRef}
              />
            )}
          </div>
        </div>
      </main>

      <GarageSidebar />
    </div>
  );
}
