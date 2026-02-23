'use client';

import { useState, useEffect } from 'react';
import { useAuth, useTheme } from '@/hooks';
import { createClient } from '@/lib/supabase/client';
import type { Board, Community } from '@/types';
import type { ViewType } from '@/app/page';
import CreateBoardModal from './modals/CreateBoardModal';
import CreateCommunityModal from './modals/CreateCommunityModal';
import {
  Settings,
  LogOut,
  Sun,
  Moon,
  Plus,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedBoardId: string | null;
  setSelectedBoardId: (id: string | null) => void;
  selectedCommunityId: string | null;
  setSelectedCommunityId: (id: string | null) => void;
}

export default function Sidebar({
  currentView,
  setCurrentView,
  selectedBoardId,
  setSelectedBoardId,
  selectedCommunityId,
  setSelectedCommunityId,
}: SidebarProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, darkMode, setDarkMode } = useTheme();
  const supabase = createClient();

  const [myBoards, setMyBoards] = useState<Board[]>([]);
  const [sharedBoards, setSharedBoards] = useState<Board[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [loading, setLoading] = useState(true);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'board' | 'community';
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        const { data: boards } = await supabase
          .from('boards')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (boards) {
          setMyBoards(boards);
          if (boards.length > 0 && !selectedBoardId) {
            setSelectedBoardId(boards[0].id);
          }
        }

        const { data: memberships } = await supabase
          .from('board_members')
          .select('board_id, boards(*)')
          .eq('user_id', user.id)
          .neq('role', 'owner');

        if (memberships) {
          const shared: Board[] = [];
          memberships.forEach((m) => {
            if (m.boards) shared.push(m.boards as unknown as Board);
          });
          setSharedBoards(shared);
        }

        const { data: communityMembers } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);

        if (communityMembers && communityMembers.length > 0) {
          const ids = communityMembers.map((m) => m.community_id);
          const { data: comms } = await supabase
            .from('communities')
            .select('*')
            .in('id', ids);
          if (comms) setCommunities(comms);
        }

        const { data: owned } = await supabase
          .from('communities')
          .select('*')
          .eq('owner_id', user.id);

        if (owned) {
          setCommunities((prev) => {
            const existing = new Set(prev.map((c) => c.id));
            return [...prev, ...owned.filter((c) => !existing.has(c.id))];
          });
        }
      } catch (err) {
        console.error('Sidebar fetch error:', err);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, supabase, selectedBoardId, setSelectedBoardId]);

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    setDeleting(true);

    try {
      if (deleteTarget.type === 'board') {
        // Delete board (cascade will delete cards, members, invitations)
        const { error } = await supabase
          .from('boards')
          .delete()
          .eq('id', deleteTarget.id)
          .eq('owner_id', user.id); // Safety: only owner can delete

        if (!error) {
          setMyBoards((prev) => prev.filter((b) => b.id !== deleteTarget.id));
          if (selectedBoardId === deleteTarget.id) {
            const remaining = myBoards.filter((b) => b.id !== deleteTarget.id);
            setSelectedBoardId(remaining.length > 0 ? remaining[0].id : null);
          }
        }
      } else {
        // Delete community (cascade will delete members, invitations)
        const { error } = await supabase
          .from('communities')
          .delete()
          .eq('id', deleteTarget.id)
          .eq('owner_id', user.id); // Safety: only owner can delete

        if (!error) {
          setCommunities((prev) =>
            prev.filter((c) => c.id !== deleteTarget.id)
          );
          if (selectedCommunityId === deleteTarget.id) {
            setSelectedCommunityId(null);
            setCurrentView('board');
          }
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleBoardCreated = (board: Board) => {
    setMyBoards((prev) => [board, ...prev]);
    setSelectedBoardId(board.id);
    setCurrentView('board');
  };

  const handleCommunityCreated = (community: Community) => {
    setCommunities((prev) => [community, ...prev]);
    setSelectedCommunityId(community.id);
    setCurrentView('community');
  };

  // Check if user owns a community
  const isOwner = (community: Community) => community.owner_id === user?.id;

  return (
    <>
      <div
        className="w-64 flex-shrink-0 flex flex-col h-screen"
        style={{
          backgroundColor: theme.bgSecondary,
          borderRight: `1px solid ${theme.border}`,
        }}
      >
        {/* Logo */}
        <div className="p-4">
          <Image
            src={darkMode ? '/logo_dark_800w.png' : '/logo_white_800w.png'}
            alt="Watchr"
            width={180}
            height={60}
            className="h-12 w-auto"
          />
        </div>

        {/* Create Board */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowCreateBoard(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white"
            style={{ backgroundColor: theme.accent.primary }}
          >
            <Plus className="w-4 h-4" />
            Create Board
          </button>
        </div>

        {/* Scrollable */}
        <div className="flex-1 overflow-auto px-4 space-y-6">
          {/* My Boards */}
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: theme.textMuted }}
            >
              Your Boards
            </span>
            <div className="mt-2 space-y-1">
              {loading ? (
                <p
                  className="text-sm px-3 py-2"
                  style={{ color: theme.textMuted }}
                >
                  Loading...
                </p>
              ) : myBoards.length > 0 ? (
                myBoards.map((board) => (
                  <div key={board.id} className="group flex items-center">
                    <button
                      onClick={() => {
                        setSelectedBoardId(board.id);
                        setCurrentView('board');
                      }}
                      className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor:
                          selectedBoardId === board.id &&
                          currentView === 'board'
                            ? theme.accent.bg
                            : 'transparent',
                        color:
                          selectedBoardId === board.id &&
                          currentView === 'board'
                            ? theme.accent.primary
                            : theme.textSecondary,
                      }}
                    >
                      <span className="text-lg">{board.icon}</span>
                      <span className="flex-1 truncate text-sm font-medium">
                        {board.name}
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: 'board',
                          id: board.id,
                          name: board.name,
                        })
                      }
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                      title="Delete board"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))
              ) : (
                <p
                  className="text-sm px-3 py-2"
                  style={{ color: theme.textMuted }}
                >
                  No boards yet
                </p>
              )}
            </div>
          </div>

          {/* Shared Boards - No delete button for these */}
          {sharedBoards.length > 0 && (
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: theme.textMuted }}
              >
                Shared Boards
              </span>
              <div className="mt-2 space-y-1">
                {sharedBoards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => {
                      setSelectedBoardId(board.id);
                      setCurrentView('board');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                    style={{
                      backgroundColor:
                        selectedBoardId === board.id && currentView === 'board'
                          ? theme.accent.bg
                          : 'transparent',
                      color:
                        selectedBoardId === board.id && currentView === 'board'
                          ? theme.accent.primary
                          : theme.textSecondary,
                    }}
                  >
                    <span className="text-lg">{board.icon}</span>
                    <span className="flex-1 truncate text-sm font-medium">
                      {board.name}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: theme.bgTertiary,
                        color: theme.textMuted,
                      }}
                    >
                      Shared
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Communities */}
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: theme.textMuted }}
            >
              Community Feeds
            </span>
            <button
              onClick={() => setShowCreateCommunity(true)}
              className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: theme.accent.bg,
                color: theme.accent.primary,
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">New Community</span>
            </button>
            <div className="mt-1 space-y-1">
              {communities.map((comm) => (
                <div key={comm.id} className="group flex items-center">
                  <button
                    onClick={() => {
                      setSelectedCommunityId(comm.id);
                      setCurrentView('community');
                    }}
                    className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                    style={{
                      backgroundColor:
                        selectedCommunityId === comm.id &&
                        currentView === 'community'
                          ? theme.accent.bg
                          : 'transparent',
                      color:
                        selectedCommunityId === comm.id &&
                        currentView === 'community'
                          ? theme.accent.primary
                          : theme.textSecondary,
                    }}
                  >
                    <span className="text-lg">{comm.icon}</span>
                    <span className="flex-1 truncate text-sm font-medium">
                      {comm.name}
                    </span>
                  </button>
                  {/* Only show delete for communities you own */}
                  {isOwner(comm) && (
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: 'community',
                          id: comm.id,
                          name: comm.name,
                        })
                      }
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                      title="Delete community"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="p-4 space-y-2"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <button
            onClick={() => setCurrentView('settings')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
            style={{
              backgroundColor:
                currentView === 'settings' ? theme.accent.bg : 'transparent',
              color:
                currentView === 'settings'
                  ? theme.accent.primary
                  : theme.textSecondary,
            }}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>

          <div className="flex items-center justify-between px-3 py-2">
            <div
              className="flex items-center gap-3"
              style={{ color: theme.textSecondary }}
            >
              {darkMode ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {darkMode ? 'Dark' : 'Light'}
              </span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-6 rounded-full relative transition-all"
              style={{
                backgroundColor: darkMode
                  ? theme.accent.primary
                  : theme.bgTertiary,
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ left: darkMode ? 'calc(100% - 20px)' : '4px' }}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{
                backgroundColor: theme.accent.bg,
                border: `2px solid ${theme.accent.primary}`,
              }}
            >
              {profile?.avatar_emoji || '😎'}
            </div>
            <span
              className="flex-1 text-sm font-medium truncate"
              style={{ color: theme.text }}
            >
              {profile?.username || 'User'}
            </span>
            <button
              onClick={signOut}
              className="p-2 rounded-lg transition-all hover:bg-red-500/10"
              style={{ color: theme.textMuted }}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: theme.text }}>
                  Delete {deleteTarget.type === 'board' ? 'Board' : 'Community'}
                  ?
                </h2>
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="mb-6" style={{ color: theme.textSecondary }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: theme.text }}>{deleteTarget.name}</strong>
              ?
              {deleteTarget.type === 'board'
                ? ' All cards in this board will be permanently deleted.'
                : ' All members will be removed from this community.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{
                  backgroundColor: theme.bgTertiary,
                  color: theme.textSecondary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateBoard && (
        <CreateBoardModal
          onClose={() => setShowCreateBoard(false)}
          onCreated={handleBoardCreated}
        />
      )}
      {showCreateCommunity && (
        <CreateCommunityModal
          onClose={() => setShowCreateCommunity(false)}
          onCreated={handleCommunityCreated}
        />
      )}
    </>
  );
}
