import { useEffect, useRef, useState, useCallback } from "react";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { DashboardHeader } from "./DashboardHeader";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";
import { MarketHighlights } from "./MarketHighlights";
import { ExportModal } from "./ExportModal";
import { PageContainer } from "@/components/design-system/PageContainer";
import { ContentContainer } from "@/components/design-system/ContentContainer";

interface DashboardPageProps {
  onNavigate: (view: "chat" | "dashboard") => void;
  headerRef?: React.Ref<HTMLHeadingElement>;
}

export function DashboardPage({ onNavigate, headerRef }: DashboardPageProps) {
  const fetchAll = useAnalyticsStore((s) => s.fetchAll);
  const isLoading = useAnalyticsStore((s) => s.isLoading);
  const overview = useAnalyticsStore((s) => s.overview);
  const internalHeaderRef = useRef<HTMLHeadingElement>(null);
  const ref = headerRef ?? internalHeaderRef;
  const [openExportModal, setOpenExportModal] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function handleExploreData() {
    document.getElementById("market-highlights")?.scrollIntoView({ behavior: "smooth" });
  }

  const handleOpenExport = useCallback(() => {
    setOpenExportModal(true);
  }, []);

  const handleCloseExport = useCallback(() => {
    setOpenExportModal(false);
    exportButtonRef.current?.focus();
  }, []);

  const showFullSkeleton = isLoading && !overview;

  return (
    <PageContainer className="flex-1 overflow-y-auto">
      <ContentContainer maxWidth="2xl" className="space-y-8">
        {showFullSkeleton ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-64 rounded-xl bg-ax-surface-light animate-ax-shimmer" />
              <div className="h-3 w-40 rounded-lg bg-ax-surface-light animate-ax-shimmer" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-ax-surface animate-ax-shimmer" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-ax-surface animate-ax-shimmer" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {isLoading && overview && (
              <div className="flex items-center gap-2 text-[10px] text-ax-text-muted font-ax-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ax-gold animate-ax-glow-pulse" />
                Actualizando...
              </div>
            )}
            <DashboardHeader
              headerRef={ref}
              onOpenExport={handleOpenExport}
              exportButtonRef={exportButtonRef}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickActions
                onNavigateToChat={() => onNavigate("chat")}
                onExploreData={handleExploreData}
              />
              <RecentActivity onNavigateToChat={() => onNavigate("chat")} />
            </div>

            <MarketHighlights />
          </>
        )}
      </ContentContainer>

      <ExportModal
        isOpen={openExportModal}
        onClose={handleCloseExport}
      />
    </PageContainer>
  );
}
