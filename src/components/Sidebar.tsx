'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useTheme } from '@/hooks';
import { createClient } from '@/lib/supabase/client';
import type { Board, Community } from '@/types';
import type { ViewType } from '@/app/page';
import CreateBoardModal from './modals/CreateBoardModal';
import CreateCommunityModal from './modals/CreateCommunityModal';
import Image from 'next/image';
import { BoardsSection } from './sidebar/BoardsSection';
import { CommunitiesSection } from './sidebar/CommunitiesSection';
import { FooterSection } from './sidebar/FooterSection';
import { NotificationsModal } from './sidebar/NotificationsModal';
import { ConfirmActionModal } from './sidebar/ConfirmActionModal';
import type { Invitation, ConfirmAction, IsOwnerFn } from './sidebar/types';

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

  // Confirm action (delete/leave) modal
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );
  const [processing, setProcessing] = useState(false);

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

  const handleConfirmAction = async () => {
    if (!confirmAction || !user) return;
    setProcessing(true);

    try {
      if (confirmAction.type === 'delete-board') {
        const { error } = await supabase
          .from('boards')
          .delete()
          .eq('id', confirmAction.id)
          .eq('owner_id', user.id);

        if (!error) {
          setMyBoards((prev) => prev.filter((b) => b.id !== confirmAction.id));
          if (selectedBoardId === confirmAction.id) {
            const remaining = myBoards.filter((b) => b.id !== confirmAction.id);
            setSelectedBoardId(remaining.length > 0 ? remaining[0].id : null);
          }
        }
      } else if (confirmAction.type === 'delete-community') {
        const { error } = await supabase
          .from('communities')
          .delete()
          .eq('id', confirmAction.id)
          .eq('owner_id', user.id);

        if (!error) {
          setCommunities((prev) =>
            prev.filter((c) => c.id !== confirmAction.id)
          );
          if (selectedCommunityId === confirmAction.id) {
            setSelectedCommunityId(null);
            setCurrentView('board');
          }
        }
      } else if (confirmAction.type === 'leave-board') {
        await supabase
          .from('board_members')
          .delete()
          .eq('board_id', confirmAction.id)
          .eq('user_id', user.id);

        setSharedBoards((prev) =>
          prev.filter((b) => b.id !== confirmAction.id)
        );
        if (selectedBoardId === confirmAction.id) {
          setSelectedBoardId(myBoards.length > 0 ? myBoards[0].id : null);
        }
      } else if (confirmAction.type === 'leave-community') {
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', confirmAction.id)
          .eq('user_id', user.id);

        setCommunities((prev) => prev.filter((c) => c.id !== confirmAction.id));
        if (selectedCommunityId === confirmAction.id) {
          setSelectedCommunityId(null);
          setCurrentView('board');
        }
      }
    } catch (err) {
      console.error('Action error:', err);
    }

    setProcessing(false);
    setConfirmAction(null);
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

  const isOwner: IsOwnerFn = (community) => community.owner_id === user?.id;
  const pendingCount = invitations.length;

  const handleSelectBoard = (boardId: string) => {
    setSelectedBoardId(boardId);
    setCurrentView('board');
  };

  const handleSelectCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setCurrentView('community');
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    fetchInvitations();
  };

  return (
    <>
      <div
        className="w-[85vw] sm:w-64 flex-shrink-0 flex flex-col h-[100dvh] sm:h-screen overflow-hidden"
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
            width={200}
            height={200}
            className="h-auto w-auto"
          />
        </div>

        {/* Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-6 min-h-0">
          <BoardsSection
            loading={loading}
            myBoards={myBoards}
            sharedBoards={sharedBoards}
            currentView={currentView}
            selectedBoardId={selectedBoardId}
            onSelectBoard={handleSelectBoard}
            onCreateBoardClick={() => setShowCreateBoard(true)}
            onRequestDeleteBoard={(board) =>
              setConfirmAction({
                type: 'delete-board',
                id: board.id,
                name: board.name,
              })
            }
            onRequestLeaveBoard={(board) =>
              setConfirmAction({
                type: 'leave-board',
                id: board.id,
                name: board.name,
              })
            }
            theme={theme}
          />

          <CommunitiesSection
            communities={communities}
            currentView={currentView}
            selectedCommunityId={selectedCommunityId}
            onSelectCommunity={handleSelectCommunity}
            onCreateCommunityClick={() => setShowCreateCommunity(true)}
            onRequestDeleteCommunity={(community) =>
              setConfirmAction({
                type: 'delete-community',
                id: community.id,
                name: community.name,
              })
            }
            onRequestLeaveCommunity={(community) =>
              setConfirmAction({
                type: 'leave-community',
                id: community.id,
                name: community.name,
              })
            }
            isOwner={isOwner}
            theme={theme}
          />
        </div>

        <FooterSection
          currentView={currentView}
          onChangeView={setCurrentView}
          pendingCount={pendingCount}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          profile={profile}
          user={user}
          onSignOut={signOut}
          onOpenNotifications={handleOpenNotifications}
          theme={theme}
        />
      </div>

      <NotificationsModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        invitations={invitations}
        pendingCount={pendingCount}
        acceptingId={acceptingId}
        decliningId={decliningId}
        onAcceptInvitation={handleAcceptInvitation}
        onDeclineInvitation={handleDeclineInvitation}
        theme={theme}
      />

      <ConfirmActionModal
        action={confirmAction}
        processing={processing}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        theme={theme}
      />

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
