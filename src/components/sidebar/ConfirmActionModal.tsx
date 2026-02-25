import { LogOut, AlertTriangle } from 'lucide-react';
import type { ConfirmAction } from './types';

interface ConfirmActionModalProps {
  action: ConfirmAction | null;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  theme: any;
}

export function ConfirmActionModal({
  action,
  processing,
  onCancel,
  onConfirm,
  theme,
}: ConfirmActionModalProps) {
  if (!action) return null;

  const isLeave = action.type.startsWith('leave');
  const isBoard = action.type.includes('board');

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
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
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isLeave ? 'bg-orange-500/20' : 'bg-red-500/20'
            }`}
          >
            {isLeave ? (
              <LogOut className="w-6 h-6 text-orange-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: theme.text }}>
              {isLeave ? 'Leave' : 'Delete'} {isBoard ? 'Board' : 'Community'}?
            </h2>
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {isLeave
                ? 'You can rejoin if invited again'
                : 'This action cannot be undone'}
            </p>
          </div>
        </div>

        <p className="mb-6" style={{ color: theme.textSecondary }}>
          Are you sure you want to {isLeave ? 'leave' : 'delete'}{' '}
          <strong style={{ color: theme.text }}>{action.name}</strong>?
          {action.type === 'delete-board' &&
            ' All cards will be permanently deleted.'}
          {action.type === 'delete-community' &&
            ' All members will be removed.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{
              backgroundColor: theme.bgTertiary,
              color: theme.textSecondary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className={`flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-50 ${
              isLeave
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {processing
              ? isLeave
                ? 'Leaving...'
                : 'Deleting...'
              : isLeave
                ? 'Leave'
                : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

