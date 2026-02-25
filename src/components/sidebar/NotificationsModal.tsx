import { Bell, X, Check } from 'lucide-react';
import type { Invitation } from './types';

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
  invitations: Invitation[];
  pendingCount: number;
  acceptingId: string | null;
  decliningId: string | null;
  onAcceptInvitation: (invitation: Invitation) => void;
  onDeclineInvitation: (invitation: Invitation) => void;
  theme: any;
}

export function NotificationsModal({
  open,
  onClose,
  invitations,
  pendingCount,
  acceptingId,
  decliningId,
  onAcceptInvitation,
  onDeclineInvitation,
  theme,
}: NotificationsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
            onClick={onClose}
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
                You&apos;re all caught up!
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
                      <span className="font-semibold">{invitation.name}</span>
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: theme.textMuted }}
                    >
                      {invitation.type === 'board' ? '📋 Board' : '👥 Community'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onDeclineInvitation(invitation)}
                    disabled={decliningId === invitation.id}
                    className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{
                      backgroundColor: theme.bgSecondary,
                      color: theme.textSecondary,
                    }}
                  >
                    {decliningId === invitation.id ? 'Declining...' : 'Decline'}
                  </button>
                  <button
                    onClick={() => onAcceptInvitation(invitation)}
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
  );
}

