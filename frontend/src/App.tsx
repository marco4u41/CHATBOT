import { ChatWindow } from "@/components/chat/ChatWindow";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { GarageSidebar } from "@/components/sidebar/GarageSidebar";

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-obsidian-deep relative">
      {/* Liquid light orbs — ambient depth */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vh] rounded-full bg-gold-premium/[0.03] blur-[120px] animate-liquid-orb-1" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vh] rounded-full bg-gold-light/[0.02] blur-[100px] animate-liquid-orb-2" />
        <div className="absolute top-1/3 left-1/2 w-[40vw] h-[40vh] rounded-full bg-gold-premium/[0.015] blur-[80px] animate-liquid-orb-3" />
      </div>

      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <ChatWindow />
      </main>
      <GarageSidebar />
    </div>
  );
}
