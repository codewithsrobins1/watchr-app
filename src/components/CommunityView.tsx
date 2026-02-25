'use client';

import { useState, useEffect } from 'react';
import { useAuth, useTheme } from '@/hooks';
import { createClient } from '@/lib/supabase/client';
import { getImageUrl } from '@/lib/tmdb';
import {
  getMediaTypeStyle,
  calculateAverageRating,
  ACCENT_COLORS,
} from '@/lib/utils';
import type { Community, CommunityFeedItem, Board, AccentColor } from '@/types';
import StarRating from './StarRating';
import InviteModal from './modals/InviteModal';
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
}: {
  communityId: string | null;
}) {
  const { user } = useAuth();
  const { theme, darkMode } = useTheme();
  const supabase = createClient();

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

  const isOwner = community?.owner_id === user?.id;

  useEffect(() => {
    if (!communityId || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const { data: comm } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();
      if (comm) setCommunity(comm);

      const { data: membersData } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId);
      if (!membersData?.length) {
        setLoading(false);
        return;
      }

      const memberIds = membersData.map((m) => m.user_id);
      const { data: cards } = await supabase
        .from('cards')
        .select(
          '*, profiles:added_by(id, username, avatar_emoji, accent_color)'
        )
        .in('added_by', memberIds)
        .eq('is_private', false)
        .in('column_id', ['watching', 'finished']);

      if (cards) {
        const watchingMap = new Map<number, CommunityFeedItem>();
        const finishedMap = new Map<number, CommunityFeedItem>();

        cards.forEach((card: any) => {
          const map = card.column_id === 'watching' ? watchingMap : finishedMap;
          const watcher = {
            user_id: card.profiles.id,
            username: card.profiles.username,
            avatar_emoji: card.profiles.avatar_emoji,
            accent_color: card.profiles.accent_color,
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
      }

      const { data: myCards } = await supabase
        .from('cards')
        .select('tmdb_id')
        .eq('added_by', user.id);
      if (myCards) setMyCardIds(new Set(myCards.map((c) => c.tmdb_id)));

      // Fetch user's boards for the board selector
      const { data: boards } = await supabase
        .from('boards')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (boards) {
        setMyBoards(boards);
        if (boards.length > 0) setSelectedBoardId(boards[0].id);
      }

      setLoading(false);
    };

    fetchData();
  }, [communityId, user, supabase]);

  const fetchMembers = async () => {
    if (!communityId) return;
    setLoadingMembers(true);

    const { data } = await supabase
      .from('community_members')
      .select('user_id, role, profile:profiles(id, username, avatar_emoji, accent_color)')
      .eq('community_id', communityId);

    if (data) {
      setMembers(data as unknown as CommunityMember[]);
    }
    setLoadingMembers(false);
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove || !communityId) return;
    setRemovingMemberId(confirmRemove.user_id);

    await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', confirmRemove.user_id);

    setMembers((prev) => prev.filter((m) => m.user_id !== confirmRemove.user_id));
    setRemovingMemberId(null);
    setConfirmRemove(null);
  };

  const handleAddToBacklog = async () => {
    if (!selected || !user || !selectedBoardId) return;
    setAdding(true);

    await supabase.from('cards').insert({
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
    </div>
  );
}
