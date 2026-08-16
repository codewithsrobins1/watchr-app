'use client';

import { useState, useEffect } from 'react';
import { useAuth, useTheme } from '@/hooks';
import { db } from '@/lib/firebase/client';
import { nowIso, getDocsByIds } from '@/lib/firebase/firestore';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import type { Board, Community } from '@/types';
import type { ViewType } from '@/app/page';
import CreateBoardModal from './modals/CreateBoardModal';
import CreateCommunityModal from './modals/CreateCommunityModal';
import Image from 'next/image';
import { BoardsSection } from './sidebar/BoardsSection';
import { CommunitiesSection } from './sidebar/CommunitiesSection';
import { FooterSection } from './sidebar/FooterSection';
import { NotificationsModal } from './sidebar/NotificationsModal';
import type { Invitation } from './sidebar/types';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedBoardId: string | null;
  setSelectedBoardId: (id: string | null) => void;
  selectedCommunityId: string | null;
  setSelectedCommunityId: (id: string | null) => void;
}

// Resolves the raw invitation docs (which only hold ids) into the display
// shape the UI needs, batch-fetching the target board/community and inviter.
async function resolveInvitations(
  docs: QueryDocumentSnapshot<DocumentData>[],
  type: 'board' | 'community'
): Promise<Invitation[]> {
  if (docs.length === 0) return [];

  const idField = type === 'board' ? 'board_id' : 'community_id';
  const targetCollection = type === 'board' ? 'boards' : 'communities';

  const targetIds = docs.map((d) => d.data()[idField] as string);
  const inviterIds = docs.map((d) => d.data().inviter_id as string);

  const [targets, inviters] = await Promise.all([
    getDocsByIds<{ name: string; icon: string }>(targetCollection, targetIds),
    getDocsByIds<{ username: string; avatar_emoji: string }>('users', inviterIds),
  ]);

  const result: Invitation[] = [];
  docs.forEach((d) => {
    const data = d.data();
    const targetId = data[idField] as string;
    const target = targets[targetId];
    const inviter = inviters[data.inviter_id];
    if (!target || !inviter) return;

    result.push({
      id: d.id,
      type,
      target_id: targetId,
      name: target.name,
      icon: target.icon,
      inviter_username: inviter.username,
      inviter_avatar: inviter.avatar_emoji,
      created_at: data.created_at,
    });
  });

  return result;
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

  const [myBoards, setMyBoards] = useState<Board[]>([]);
  const [sharedBoards, setSharedBoards] = useState<Board[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  // Boards/communities lists stay live via onSnapshot, so deleting or
  // leaving one from inside BoardView/CommunityView is reflected here
  // automatically without any cross-component callback wiring.
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubBoards = onSnapshot(
      query(collection(db, 'boards'), where('member_ids', 'array-contains', user.id)),
      (snap) => {
        const boards = snap.docs
          .map((d) => ({ ...d.data(), id: d.id } as Board))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const owned = boards.filter((b) => b.owner_id === user.id);
        const shared = boards.filter((b) => b.owner_id !== user.id);
        setMyBoards(owned);
        setSharedBoards(shared);
        if (owned.length > 0 && !selectedBoardId) {
          setSelectedBoardId(owned[0].id);
        }
        setLoading(false);
      }
    );

    const unsubCommunities = onSnapshot(
      query(collection(db, 'communities'), where('member_ids', 'array-contains', user.id)),
      (snap) => {
        setCommunities(
          snap.docs
            .map((d) => ({ ...d.data(), id: d.id } as Community))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        );
      }
    );

    return () => {
      unsubBoards();
      unsubCommunities();
    };
  }, [user, selectedBoardId, setSelectedBoardId]);

  // Live-updating pending invitations
  useEffect(() => {
    if (!user) return;

    const boardInvitesQuery = query(
      collection(db, 'boardInvitations'),
      where('invitee_id', '==', user.id),
      where('status', '==', 'pending')
    );
    const commInvitesQuery = query(
      collection(db, 'communityInvitations'),
      where('invitee_id', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubBoard = onSnapshot(boardInvitesQuery, async (snap) => {
      const resolved = await resolveInvitations(snap.docs, 'board');
      setInvitations((prev) =>
        [...prev.filter((i) => i.type !== 'board'), ...resolved].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    });

    const unsubComm = onSnapshot(commInvitesQuery, async (snap) => {
      const resolved = await resolveInvitations(snap.docs, 'community');
      setInvitations((prev) =>
        [...prev.filter((i) => i.type !== 'community'), ...resolved].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    });

    return () => {
      unsubBoard();
      unsubComm();
    };
  }, [user]);

  const handleAcceptInvitation = async (invitation: Invitation) => {
    if (!user) return;
    setAcceptingId(invitation.id);

    try {
      const timestamp = nowIso();

      if (invitation.type === 'board') {
        await updateDoc(doc(db, 'boardInvitations', invitation.id), { status: 'accepted' });
        await updateDoc(doc(db, 'boards', invitation.target_id), {
          member_ids: arrayUnion(user.id),
        });
        await addDoc(collection(db, 'boardMembers'), {
          board_id: invitation.target_id,
          user_id: user.id,
          role: 'member',
          joined_at: timestamp,
        });
      } else {
        await updateDoc(doc(db, 'communityInvitations', invitation.id), { status: 'accepted' });
        await updateDoc(doc(db, 'communities', invitation.target_id), {
          member_ids: arrayUnion(user.id),
        });
        await addDoc(collection(db, 'communityMembers'), {
          community_id: invitation.target_id,
          user_id: user.id,
          role: 'member',
          joined_at: timestamp,
        });
      }
      // No need to touch myBoards/sharedBoards/communities here — the
      // onSnapshot listener above picks up the member_ids change.
    } catch (err) {
      console.error('Accept invitation error:', err);
    }

    setAcceptingId(null);
  };

  const handleDeclineInvitation = async (invitation: Invitation) => {
    setDecliningId(invitation.id);

    try {
      const collectionName =
        invitation.type === 'board' ? 'boardInvitations' : 'communityInvitations';
      await updateDoc(doc(db, collectionName, invitation.id), { status: 'declined' });
    } catch (err) {
      console.error('Decline invitation error:', err);
    }

    setDecliningId(null);
  };

  const handleBoardCreated = (board: Board) => {
    setSelectedBoardId(board.id);
    setCurrentView('board');
  };

  const handleCommunityCreated = (community: Community) => {
    setSelectedCommunityId(community.id);
    setCurrentView('community');
  };

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
            theme={theme}
          />

          <CommunitiesSection
            communities={communities}
            currentView={currentView}
            selectedCommunityId={selectedCommunityId}
            onSelectCommunity={handleSelectCommunity}
            onCreateCommunityClick={() => setShowCreateCommunity(true)}
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
