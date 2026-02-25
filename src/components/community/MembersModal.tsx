import type { AccentColor } from '@/types';
import { ACCENT_COLORS } from '@/lib/utils';
import { Users, X, Loader2, Trash2 } from 'lucide-react';
import type { CommunityMember } from './types';

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  members: CommunityMember[];
  loadingMembers: boolean;
  isOwner: boolean;
  currentUserId?: string;
  removingMemberId: string | null;
  onRequestRemove: (member: CommunityMember) => void;
  theme: any;
}

export function MembersModal({
  open,
  onClose,
  members,
  loadingMembers,
  isOwner,
  currentUserId,
  removingMemberId,
  onRequestRemove,
  theme,
}: MembersModalProps) {
  if (!open) return null;

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
            onClick={onClose}
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
                    backgroundColor:
                      ACCENT_COLORS[member.profile.accent_color as AccentColor]?.bg,
                    border: `2px solid ${
                      ACCENT_COLORS[member.profile.accent_color as AccentColor]?.primary
                    }`,
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
                {isOwner && member.user_id !== currentUserId && (
                  <button
                    onClick={() => onRequestRemove(member)}
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
  );
}

