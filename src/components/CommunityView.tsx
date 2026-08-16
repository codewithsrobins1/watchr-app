'use client';

import { useState, useEffect } from 'react';
import { useAuth, useTheme } from '@/hooks';
import { db } from '@/lib/firebase/client';
import { nowIso, getDocsByIds } from '@/lib/firebase/firestore';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { getImageUrl } from '@/lib/tmdb';
import {
  getMediaTypeStyle,
  calculateAverageRating,
  ACCENT_COLORS,
} from '@/lib/utils';
import { deleteCommunityCascade, leaveCommunity } from '@/lib/firebase/actions';
import type { Community, CommunityFeedItem, Board, AccentColor, Card, Profile, ConfirmAction } from '@/types';
import StarRating from './StarRating';
import InviteModal from './modals/InviteModal';
import { ConfirmActionModal } from './ConfirmActionModal';
import { UserPlus, Users, X, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { CommunityHeader } from './community/CommunityHeader';
import { CommunitySection } from './community/CommunitySection';
import { ItemDetailModal } from './community/ItemDetailModal';
import { MembersModal } from './community/MembersModal';
import { ConfirmRemoveModal } from './community/ConfirmRemoveModal';
import type { CommunityMember } from './community/types';

export default function CommunityView({
  communityId,
  onDeleted,
}: {
  communityId: string | null;
  onDeleted: () => void;
}) {
  const { user } = useAuth();
  const { theme, darkMode } = useTheme();

  const [community, setCommunity] = useState<Community | null>(null);
  const [watching, setWatching] = useState<CommunityFeedItem[]>([]);
  const [finished, setFinished] = useState<CommunityFeedItem[]>([]);
  const [myCardIds, setMyCardIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CommunityFeedItem | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [adding, setAdding] = useState(false);

  // Board selector state
  const [myBoards, setMyBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // View Members state
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<CommunityMember | null>(null);

  // Delete/leave community (distinct from confirmRemove, which is for
  // kicking a single member)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  const isOwner = community?.owner_id === user?.id;

  const handleRequestDeleteOrLeave = () => {
    if (!community) return;
    setConfirmAction({ type: isOwner ? 'delete-community' : 'leave-community', name: community.name });
  };

  const handleConfirmDeleteOrLeave = async () => {
    if (!confirmAction || !community || !user) return;
    setProcessingAction(true);

    try {
      if (confirmAction.type === 'delete-community') {
        await deleteCommunityCascade(community.id);
      } else {
        await leaveCommunity(community.id, user.id);
      }
      setConfirmAction(null);
      onDeleted();
    } catch (err) {
      console.error('Delete/leave community error:', err);
      setProcessingAction(false);
    }
  };

  useEffect(() => {
    if (!communityId || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const commSnap = await getDoc(doc(db, 'communities', communityId));
      if (commSnap.exists()) setCommunity({ ...commSnap.data(), id: commSnap.id } as Community);

      const membersSnap = await getDocs(
        query(collection(db, 'communityMembers'), where('community_id', '==', communityId))
      );
      const memberIds = membersSnap.docs.map((d) => d.data().user_id as string);
      if (memberIds.length === 0) {
        setLoading(false);
        return;
      }

      // Firestore 'in' queries cap at 30 values, plenty for a low-use app.
      const cardsSnap = await getDocs(
        query(
          collection(db, 'cards'),
          where('added_by', 'in', memberIds.slice(0, 30)),
          where('is_private', '==', false),
          where('column_id', 'in', ['watching', 'finished'])
        )
      );
      const cardDocs = cardsSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Card));
      const profiles = await getDocsByIds<Profile>('users', cardDocs.map((c) => c.added_by));

      const watchingMap = new Map<number, CommunityFeedItem>();
      const finishedMap = new Map<number, CommunityFeedItem>();

      cardDocs.forEach((card) => {
        const addedByProfile = profiles[card.added_by];
        if (!addedByProfile) return;

        const map = card.column_id === 'watching' ? watchingMap : finishedMap;
        const watcher = {
          user_id: addedByProfile.id,
          username: addedByProfile.username,
          avatar_emoji: addedByProfile.avatar_emoji,
          accent_color: addedByProfile.accent_color,
          rating: card.rating,
          column_id: card.column_id,
        };

        const existing = map.get(card.tmdb_id);
        if (existing) {
          existing.watchers.push(watcher);
        } else {
          map.set(card.tmdb_id, {
            tmdb_id: card.tmdb_id,
            media_type: card.media_type,
            title: card.title,
            poster_path: card.poster_path,
            description: card.description,
            genres: card.genres,
            seasons_count: card.seasons_count,
            episodes_count: card.episodes_count,
            runtime: card.runtime,
            watchers: [watcher],
          });
        }
      });

      setWatching(Array.from(watchingMap.values()));
      setFinished(Array.from(finishedMap.values()));

      const myCardsSnap = await getDocs(query(collection(db, 'cards'), where('added_by', '==', user.id)));
      setMyCardIds(new Set(myCardsSnap.docs.map((d) => d.data().tmdb_id as number)));

      // Fetch user's boards for the board selector
      const boardsSnap = await getDocs(query(collection(db, 'boards'), where('owner_id', '==', user.id)));
      const boards = boardsSnap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Board))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMyBoards(boards);
      if (boards.length > 0) setSelectedBoardId(boards[0].id);

      setLoading(false);
    };

    fetchData();
  }, [communityId, user]);

  const fetchMembers = async () => {
    if (!communityId) return;
    setLoadingMembers(true);

    const membersSnap = await getDocs(
      query(collection(db, 'communityMembers'), where('community_id', '==', communityId))
    );
    const memberDocs = membersSnap.docs.map((d) => d.data() as { user_id: string; role: string });
    const profiles = await getDocsByIds<Profile>('users', memberDocs.map((m) => m.user_id));

    setMembers(
      memberDocs
        .filter((m) => profiles[m.user_id])
        .map((m) => ({
          user_id: m.user_id,
          role: m.role,
          profile: profiles[m.user_id],
        }))
    );
    setLoadingMembers(false);
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove || !communityId) return;
    setRemovingMemberId(confirmRemove.user_id);

    const memberSnap = await getDocs(
      query(
        collection(db, 'communityMembers'),
        where('community_id', '==', communityId),
        where('user_id', '==', confirmRemove.user_id)
      )
    );
    await Promise.all(memberSnap.docs.map((d) => deleteDoc(d.ref)));

    setMembers((prev) => prev.filter((m) => m.user_id !== confirmRemove.user_id));
    setRemovingMemberId(null);
    setConfirmRemove(null);
  };

  const handleAddToBacklog = async () => {
    if (!selected || !user || !selectedBoardId) return;
    setAdding(true);

    const timestamp = nowIso();
    await addDoc(collection(db, 'cards'), {
      board_id: selectedBoardId,
      tmdb_id: selected.tmdb_id,
      media_type: selected.media_type,
      title: selected.title,
      poster_path: selected.poster_path,
      description: selected.description,
      genres: selected.genres,
      seasons_count: selected.seasons_count,
      episodes_count: selected.episodes_count,
      runtime: selected.runtime,
      column_id: 'backlog',
      position: 1000,
      rating: null,
      is_private: false,
      added_by: user.id,
      created_at: timestamp,
      updated_at: timestamp,
    });

    setMyCardIds((prev) => new Set([...Array.from(prev), selected.tmdb_id]));
    setAdding(false);
    setSelected(null);
  };

  if (!communityId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-lg font-medium mb-2" style={{ color: theme.text }}>
            No community selected
          </p>
          <p style={{ color: theme.textMuted }}>
            Create or select a community from the sidebar
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2
          className="w-8 h-8 spinner"
          style={{ color: theme.accent.primary }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-auto">
      <CommunityHeader
        community={community}
        onOpenMembers={() => {
          setShowMembers(true);
          fetchMembers();
        }}
        onInvite={() => setShowInvite(true)}
        isOwner={!!isOwner}
        onRequestDeleteOrLeave={handleRequestDeleteOrLeave}
        theme={theme}
      />

      <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
        👥 See what everyone is watching • Click any card to view details
      </p>

      <CommunitySection
        title="Currently Watching"
        items={watching}
        color="#3b82f6"
        isWatching
        onSelect={setSelected}
        darkMode={darkMode}
        theme={theme}
      />
      <CommunitySection
        title="Recently Finished"
        items={finished}
        color="#10b981"
        isWatching={false}
        onSelect={setSelected}
        darkMode={darkMode}
        theme={theme}
      />

      <ItemDetailModal
        open={!!selected}
        item={selected}
        onClose={() => setSelected(null)}
        myCardAlreadyAdded={!!(selected && myCardIds.has(selected.tmdb_id))}
        myBoards={myBoards}
        selectedBoardId={selectedBoardId}
        setSelectedBoardId={(id) => setSelectedBoardId(id)}
        adding={adding}
        onAddToBacklog={handleAddToBacklog}
        theme={theme}
      />

      <MembersModal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        members={members}
        loadingMembers={loadingMembers}
        isOwner={!!isOwner}
        currentUserId={user?.id}
        removingMemberId={removingMemberId}
        onRequestRemove={(member) => setConfirmRemove(member)}
        theme={theme}
      />

      <ConfirmRemoveModal
        open={!!confirmRemove}
        member={confirmRemove}
        removingMemberId={removingMemberId}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemoveMember}
        theme={theme}
      />

      {showInvite && communityId && (
        <InviteModal
          type="community"
          targetId={communityId}
          onClose={() => setShowInvite(false)}
        />
      )}

      <ConfirmActionModal
        action={confirmAction}
        processing={processingAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmDeleteOrLeave}
        theme={theme}
      />
    </div>
  );
}
