'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useTheme } from '@/hooks';
import Sidebar from '@/components/Sidebar';
import BoardView from '@/components/BoardView';
import CommunityView from '@/components/CommunityView';
import SettingsView from '@/components/SettingsView';
import { Menu } from 'lucide-react';

export type ViewType = 'board' | 'community' | 'settings';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [currentView, setCurrentView] = useState<ViewType>('board');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated (only after loading is complete)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Loading state - only show while actually loading
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full spinner mx-auto mb-4"
            style={{
              borderColor: theme.accent.primary,
              borderTopColor: 'transparent',
            }}
          />
          <p style={{ color: theme.textMuted }}>Loading Watchr...</p>
        </div>
      </div>
    );
  }

  // Not logged in - will redirect
  if (!user) {
    return null;
  }

  // Main app - show even if profile is still loading
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar-mobile md:relative md:transform-none ${sidebarOpen ? 'open' : ''}`}
      >
        <Sidebar
          currentView={currentView}
          setCurrentView={(view) => {
            setCurrentView(view);
            setSidebarOpen(false);
          }}
          selectedBoardId={selectedBoardId}
          setSelectedBoardId={(id) => {
            setSelectedBoardId(id);
            setCurrentView('board');
            setSidebarOpen(false);
          }}
          selectedCommunityId={selectedCommunityId}
          setSelectedCommunityId={(id) => {
            setSelectedCommunityId(id);
            setCurrentView('community');
            setSidebarOpen(false);
          }}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div
          className="md:hidden flex items-center gap-3 p-4"
          style={{
            backgroundColor: theme.bgSecondary,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg"
            style={{ backgroundColor: theme.bgTertiary, color: theme.text }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold" style={{ color: theme.accent.primary }}>
            Watchr
          </span>
        </div>

        <main className="flex-1 overflow-auto">
          {currentView === 'settings' ? (
            <SettingsView />
          ) : currentView === 'community' ? (
            <CommunityView communityId={selectedCommunityId} />
          ) : (
            <BoardView boardId={selectedBoardId} />
          )}
        </main>
      </div>
    </div>
  );
}
