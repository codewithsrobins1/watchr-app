import { Trash2 } from 'lucide-react';
import type { CommunityMember } from './types';

interface ConfirmRemoveModalProps {
  open: boolean;
  member: CommunityMember | null;
  removingMemberId: string | null;
  onClose: () => void;
  onConfirm: () => void;
  theme: any;
}

export function ConfirmRemoveModal({
  open,
  member,
  removingMemberId,
  onClose,
  onConfirm,
  theme,
}: ConfirmRemoveModalProps) {
  if (!open || !member) return null;

  const isRemoving = removingMemberId === member.user_id;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
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
          <strong style={{ color: theme.text }}>{member.profile.username}</strong>{' '}
          from this community?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRemoving}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

