'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Bell,
  Check,
} from 'lucide-react';
import Image from 'next/image';

interface Invitation {
  id: string;
  type: 'board' | 'community';
  name: string;
  icon: string;
  inviter_username: string;
  inviter_avatar: string;
  created_at: string;
}

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

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;

    const allInvitations: Invitation[] = [];

    try {
      // Fetch board invitations
      const { data: boardInvites, error: boardError } = await supabase
        .from('board_invitations')
        .select(
          `
          id, 
          board_id, 
          inviter_id, 
          created_at, 
          boards(name, icon),
          inviter:profiles!board_invitations_inviter_id_fkey(username, avatar_emoji)
        `
        )
        .eq('invitee_id', user.id)
        .eq('status', 'pending');

      if (boardError) {
        console.error('Board invitations error:', boardError);
      }

      if (boardInvites) {
        boardInvites.forEach((inv: any) => {
          if (inv.boards && inv.inviter) {
            allInvitations.push({
              id: inv.id,
              type: 'board',
              name: inv.boards.name,
              icon: inv.boards.icon,
              inviter_username: inv.inviter.username,
              inviter_avatar: inv.inviter.avatar_emoji,
              created_at: inv.created_at,
            });
          }
        });
      }

      // Fetch community invitations
      const { data: commInvites, error: commError } = await supabase
        .from('community_invitations')
        .select(
          `
          id, 
          community_id, 
          inviter_id, 
          created_at, 
          communities(name, icon),
          inviter:profiles!community_invitations_inviter_id_fkey(username, avatar_emoji)
        `
        )
        .eq('invitee_id', user.id)
        .eq('status', 'pending');

      if (commError) {
        console.error('Community invitations error:', commError);
      }

      if (commInvites) {
        commInvites.forEach((inv: any) => {
          if (inv.communities && inv.inviter) {
            allInvitations.push({
              id: inv.id,
              type: 'community',
              name: inv.communities.name,
              icon: inv.communities.icon,
              inviter_username: inv.inviter.username,
              inviter_avatar: inv.inviter.avatar_emoji,
              created_at: inv.created_at,
            });
          }
        });
      }

      setInvitations(
        allInvitations.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      console.error('Fetch invitations error:', err);
    }
  }, [user, supabase]);

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

        // Fetch invitations on initial load
        await fetchInvitations();
      } catch (err) {
        console.error('Sidebar fetch error:', err);
      }

      setLoading(false);
    };

    fetchData();

    // Set up realtime subscriptions for new invitations
    const boardInvitesChannel = supabase
      .channel(`board-invites-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_invitations',
          filter: `invitee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New board invitation!', payload);
          fetchInvitations();
        }
      )
      .subscribe();

    const commInvitesChannel = supabase
      .channel(`comm-invites-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_invitations',
          filter: `invitee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New community invitation!', payload);
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(boardInvitesChannel);
      supabase.removeChannel(commInvitesChannel);
    };
  }, [user, supabase, selectedBoardId, setSelectedBoardId, fetchInvitations]);

  const handleAcceptInvitation = async (invitation: Invitation) => {
    if (!user) return;
    setAcceptingId(invitation.id);

    try {
      if (invitation.type === 'board') {
        const { data: inv } = await supabase
          .from('board_invitations')
          .select('board_id')
          .eq('id', invitation.id)
          .single();

        if (inv) {
          await supabase.from('board_members').insert({
            board_id: inv.board_id,
            user_id: user.id,
            role: 'member',
          });

          await supabase
            .from('board_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);

          const { data: board } = await supabase
            .from('boards')
            .select('*')
            .eq('id', inv.board_id)
            .single();

          if (board) {
            setSharedBoards((prev) => [...prev, board]);
          }
        }
      } else {
        const { data: inv } = await supabase
          .from('community_invitations')
          .select('community_id')
          .eq('id', invitation.id)
          .single();

        if (inv) {
          await supabase.from('community_members').insert({
            community_id: inv.community_id,
            user_id: user.id,
            role: 'member',
          });

          await supabase
            .from('community_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);

          const { data: comm } = await supabase
            .from('communities')
            .select('*')
            .eq('id', inv.community_id)
            .single();

          if (comm) {
            setCommunities((prev) => [...prev, comm]);
          }
        }
      }

      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    } catch (err) {
      console.error('Accept invitation error:', err);
    }

    setAcceptingId(null);
  };

  const handleDeclineInvitation = async (invitation: Invitation) => {
    setDecliningId(invitation.id);

    try {
      const table =
        invitation.type === 'board'
          ? 'board_invitations'
          : 'community_invitations';
      await supabase
        .from(table)
        .update({ status: 'declined' })
        .eq('id', invitation.id);

      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    } catch (err) {
      console.error('Decline invitation error:', err);
    }

    setDecliningId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    setDeleting(true);

    try {
      if (deleteTarget.type === 'board') {
        const { error } = await supabase
          .from('boards')
          .delete()
          .eq('id', deleteTarget.id)
          .eq('owner_id', user.id);

        if (!error) {
          setMyBoards((prev) => prev.filter((b) => b.id !== deleteTarget.id));
          if (selectedBoardId === deleteTarget.id) {
            const remaining = myBoards.filter((b) => b.id !== deleteTarget.id);
            setSelectedBoardId(remaining.length > 0 ? remaining[0].id : null);
          }
        }
      } else {
        const { error } = await supabase
          .from('communities')
          .delete()
          .eq('id', deleteTarget.id)
          .eq('owner_id', user.id);

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

  const isOwner = (community: Community) => community.owner_id === user?.id;
  const pendingCount = invitations.length;

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
            width={250}
            height={100}
            className="h-10 w-auto"
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

          {/* Shared Boards */}
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
          {/* Notifications */}
          <button
            onClick={() => {
              setShowNotifications(true);
              fetchInvitations();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative"
            style={{
              backgroundColor: 'transparent',
              color: theme.textSecondary,
            }}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium">Notifications</span>
            {pendingCount > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">
                {pendingCount} new
              </span>
            )}
          </button>

          {/* Settings */}
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

          {/* Dark Mode Toggle */}
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

          {/* User */}
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
              {profile?.username || user?.email?.split('@')[0] || 'User'}
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

      {/* Notifications Modal */}
      {showNotifications && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col"
            style={{
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell
                  className="w-5 h-5"
                  style={{ color: theme.accent.primary }}
                />
                <h2 className="text-lg font-bold" style={{ color: theme.text }}>
                  Notifications
                </h2>
                {pendingCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {pendingCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 rounded-full hover:bg-red-500/20"
                style={{ color: theme.textMuted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-3">
              {invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Bell
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: theme.textMuted }}
                  />
                  <p style={{ color: theme.textMuted }}>No notifications</p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: theme.textMuted }}
                  >
                    You're all caught up!
                  </p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: theme.bgTertiary }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: theme.accent.bg }}
                      >
                        {invitation.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: theme.text }}>
                          <span className="font-semibold">
                            {invitation.inviter_username}
                          </span>
                          {' invited you to join '}
                          <span className="font-semibold">
                            {invitation.name}
                          </span>
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: theme.textMuted }}
                        >
                          {invitation.type === 'board'
                            ? '📋 Board'
                            : '👥 Community'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDeclineInvitation(invitation)}
                        disabled={decliningId === invitation.id}
                        className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        style={{
                          backgroundColor: theme.bgSecondary,
                          color: theme.textSecondary,
                        }}
                      >
                        {decliningId === invitation.id
                          ? 'Declining...'
                          : 'Decline'}
                      </button>
                      <button
                        onClick={() => handleAcceptInvitation(invitation)}
                        disabled={acceptingId === invitation.id}
                        className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-1"
                        style={{ backgroundColor: theme.accent.primary }}
                      >
                        {acceptingId === invitation.id ? (
                          'Accepting...'
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Accept
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
