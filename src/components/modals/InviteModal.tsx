'use client';

import { useState, useEffect } from 'react';
import { useAuth, useTheme } from '@/hooks';
import { createClient } from '@/lib/supabase/client';
import { ACCENT_COLORS } from '@/lib/utils';
import type { Profile } from '@/types';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';

interface InviteModalProps {
  type: 'board' | 'community';
  targetId: string;
  onClose: () => void;
}

export default function InviteModal({
  type,
  targetId,
  onClose,
}: InviteModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [inviting, setInviting] = useState<string | null>(null);

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .neq('id', user?.id)
        .limit(10);

      if (data) setResults(data);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id, supabase]);

  const handleInvite = async (userId: string) => {
    if (!user || invitedIds.has(userId)) return;

    setInviting(userId);

    const tableName =
      type === 'board' ? 'board_invitations' : 'community_invitations';
    const idField = type === 'board' ? 'board_id' : 'community_id';

    const { error } = await supabase.from(tableName).insert({
      [idField]: targetId,
      inviter_id: user.id,
      invitee_id: userId,
      status: 'pending',
    });

    if (error) {
      console.error('Invite error:', error);
      if (error.code === '23505') {
        // Already invited
        setInvitedIds((prev) => new Set([...Array.from(prev), userId]));
      }
    } else {
      setInvitedIds((prev) => new Set([...Array.from(prev), userId]));
    }

    setInviting(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-auto"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: theme.text }}>
            Invite to {type === 'board' ? 'Board' : 'Community'}
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
          Search by username or email to invite someone
        </p>

        {/* Search input */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full px-4 py-4 pl-11 rounded-xl outline-none transition-all focus:ring-2 text-base"
            style={{
              backgroundColor: theme.bgTertiary,
              border: `1px solid ${theme.border}`,
              color: theme.text,
            }}
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: theme.textMuted }}
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2
                className="w-5 h-5 spinner"
                style={{ color: theme.accent.primary }}
              />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-72 overflow-auto">
          {results.length === 0 && searchQuery && !searching && (
            <p className="text-center py-8" style={{ color: theme.textMuted }}>
              No users found
            </p>
          )}

          {results.length === 0 && !searchQuery && (
            <p className="text-center py-8" style={{ color: theme.textMuted }}>
              Start typing to search for users
            </p>
          )}

          {results.map((foundUser) => {
            const isInvited = invitedIds.has(foundUser.id);
            const isInviting = inviting === foundUser.id;

            return (
              <div
                key={foundUser.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: theme.bgTertiary }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: ACCENT_COLORS[foundUser.accent_color]?.bg,
                    border: `2px solid ${ACCENT_COLORS[foundUser.accent_color]?.primary}`,
                  }}
                >
                  {foundUser.avatar_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium truncate"
                    style={{ color: theme.text }}
                  >
                    {foundUser.username}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: theme.textMuted }}
                  >
                    {foundUser.email}
                  </div>
                </div>
                {isInvited ? (
                  <div className="flex items-center gap-1 text-sm font-medium text-green-500">
                    <Check className="w-4 h-4" />
                    Invited
                  </div>
                ) : (
                  <button
                    onClick={() => handleInvite(foundUser.id)}
                    disabled={isInviting}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: theme.accent.primary }}
                  >
                    {isInviting ? (
                      <Loader2 className="w-4 h-4 spinner" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Invite
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
