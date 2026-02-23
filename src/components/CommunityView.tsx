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

interface CommunityMember {
  user_id: string;
  role: string;
  profile: {
    id: string;
    username: string;
    avatar_emoji: string;
    accent_color: string;
  };
}

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

  const renderSection = (
    title: string,
    items: CommunityFeedItem[],
    color: string,
    isWatching: boolean
  ) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
          {title}
        </h2>
        <span
          className="text-sm px-2 py-0.5 rounded-full"
          style={{ backgroundColor: theme.bgTertiary, color: theme.textMuted }}
        >
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const avgRating = calculateAverageRating(
              item.watchers.map((w) => w.rating)
            );
            const typeStyle = getMediaTypeStyle(item.media_type, darkMode);

            return (
              <div
                key={item.tmdb_id}
                onClick={() => setSelected(item)}
                className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div className="flex gap-3">
                  <div className="relative w-16 h-24 flex-shrink-0">
                    <Image
                      src={getImageUrl(item.poster_path)}
                      alt={item.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-sm line-clamp-2"
                      style={{ color: theme.text }}
                    >
                      {item.title}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium mt-1 inline-block"
                      style={{
                        backgroundColor: typeStyle.bg,
                        color: typeStyle.text,
                      }}
                    >
                      {typeStyle.label}
                    </span>

                    {avgRating && (
                      <div className="flex items-center gap-1 mt-2">
                        <StarRating rating={Number(avgRating)} size="xs" />
                        <span
                          className="text-xs font-medium"
                          style={{ color: theme.textSecondary }}
                        >
                          {Number(avgRating).toFixed(1)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-1">
                        {item.watchers.slice(0, 3).map((w, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: ACCENT_COLORS[w.accent_color as AccentColor]?.bg,
                              border: `1.5px solid ${
                                ACCENT_COLORS[w.accent_color as AccentColor]?.primary
                              }`,
                            }}
                          >
                            {w.avatar_emoji}
                          </div>
                        ))}
                        {item.watchers.length > 3 && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: theme.bgTertiary,
                              color: theme.textMuted,
                            }}
                          >
                            +{item.watchers.length - 3}
                          </div>
                        )}
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: theme.textMuted }}
                      >
                        {isWatching ? 'watching' : 'finished'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-xl"
          style={{ backgroundColor: theme.bgSecondary }}
        >
          <p style={{ color: theme.textMuted }}>Nothing here yet</p>
        </div>
      )}
    </div>
  );

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{community?.icon}</span>
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>
            {community?.name}
          </h1>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}
          >
            Community
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowMembers(true);
              fetchMembers();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
            style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
          >
            <Users className="w-4 h-4" />
            Members
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
            style={{ backgroundColor: theme.accent.primary }}
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        </div>
      </div>

      <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
        👥 See what everyone is watching • Click any card to view details
      </p>

      {renderSection('Currently Watching', watching, '#3b82f6', true)}
      {renderSection('Recently Finished', finished, '#10b981', false)}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-auto"
            style={{ backgroundColor: theme.bgSecondary }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: theme.text }}>
                {selected.title}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="p-2.5 rounded-full bg-red-500 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="relative w-20 h-28 flex-shrink-0">
                <Image
                  src={getImageUrl(selected.poster_path, 'w185')}
                  alt=""
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div>
                <p
                  className="text-sm line-clamp-4"
                  style={{ color: theme.textMuted }}
                >
                  {selected.description}
                </p>
                {selected.seasons_count && (
                  <p
                    className="text-sm mt-2"
                    style={{ color: theme.textSecondary }}
                  >
                    {selected.seasons_count} seasons
                  </p>
                )}
              </div>
            </div>

            <div
              className="p-3 rounded-xl mb-4"
              style={{ backgroundColor: theme.bgTertiary }}
            >
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: theme.text }}
              >
                Watchers ({selected.watchers.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-auto">
                {selected.watchers.map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: ACCENT_COLORS[w.accent_color as AccentColor]?.bg,
                        border: `2px solid ${ACCENT_COLORS[w.accent_color as AccentColor]?.primary}`,
                      }}
                    >
                      {w.avatar_emoji}
                    </div>
                    <span
                      className="text-sm flex-1"
                      style={{ color: theme.text }}
                    >
                      {w.username}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: theme.textMuted }}
                    >
                      {w.column_id === 'watching' ? 'watching' : 'finished'}
                    </span>
                    {w.rating && (
                      <div className="flex items-center gap-1">
                        <StarRating rating={w.rating} size="xs" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {myCardIds.has(selected.tmdb_id) ? (
              <button
                disabled
                className="w-full py-4 rounded-xl font-medium text-base"
                style={{
                  backgroundColor: theme.bgTertiary,
                  color: theme.textMuted,
                }}
              >
                Already in Your Boards
              </button>
            ) : (
              <>
                {/* Board Selector */}
                {myBoards.length > 0 ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                      Add to Board
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {myBoards.map((board) => (
                        <button
                          key={board.id}
                          onClick={() => setSelectedBoardId(board.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left"
                          style={{
                            backgroundColor: selectedBoardId === board.id ? theme.accent.bg : theme.bgTertiary,
                            border: `2px solid ${selectedBoardId === board.id ? theme.accent.primary : 'transparent'}`,
                            color: selectedBoardId === board.id ? theme.accent.primary : theme.textSecondary,
                          }}
                        >
                          <span className="text-lg">{board.icon}</span>
                          <span className="text-sm font-medium truncate">{board.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm mb-4 text-center" style={{ color: theme.textMuted }}>
                    Create a board first to add shows
                  </p>
                )}

                <button
                  onClick={handleAddToBacklog}
                  disabled={adding || myBoards.length === 0}
                  className="w-full py-4 rounded-xl font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                  style={{ backgroundColor: theme.accent.primary }}
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-5 h-5 spinner" />
                      Adding...
                    </>
                  ) : (
                    'Add to Backlog'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {showMembers && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowMembers(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-auto"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" style={{ color: theme.accent.primary }} />
                <h2 className="text-lg font-bold" style={{ color: theme.text }}>
                  Members
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: theme.bgTertiary, color: theme.textMuted }}
                >
                  {members.length}
                </span>
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="p-2 rounded-full hover:bg-red-500/20"
                style={{ color: theme.textMuted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 spinner" style={{ color: theme.accent.primary }} />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: theme.bgTertiary }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: ACCENT_COLORS[member.profile.accent_color as AccentColor]?.bg,
                        border: `2px solid ${ACCENT_COLORS[member.profile.accent_color as AccentColor]?.primary}`,
                      }}
                    >
                      {member.profile.avatar_emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: theme.text }}>
                        {member.profile.username}
                      </div>
                      {member.role === 'owner' && (
                        <span className="text-xs" style={{ color: theme.accent.primary }}>
                          Owner
                        </span>
                      )}
                    </div>
                    {isOwner && member.user_id !== user?.id && (
                      <button
                        onClick={() => setConfirmRemove(member)}
                        disabled={removingMemberId === member.user_id}
                        className="p-2 rounded-lg hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Remove Modal */}
      {confirmRemove && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
          onClick={() => setConfirmRemove(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: theme.text }}>
                  Remove Member?
                </h2>
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="mb-6" style={{ color: theme.textSecondary }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: theme.text }}>{confirmRemove.profile.username}</strong>{' '}
              from this community?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={removingMemberId === confirmRemove.user_id}
                className="flex-1 py-3 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {removingMemberId === confirmRemove.user_id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

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
