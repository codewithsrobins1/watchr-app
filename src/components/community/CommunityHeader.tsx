import type { Community } from '@/types';
import { UserPlus, Users } from 'lucide-react';

interface CommunityHeaderProps {
  community: Community | null;
  onOpenMembers: () => void;
  onInvite: () => void;
  theme: any;
}

export function CommunityHeader({
  community,
  onOpenMembers,
  onInvite,
  theme,
}: CommunityHeaderProps) {
  return (
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
          onClick={onOpenMembers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
          style={{
            backgroundColor: theme.bgTertiary,
            color: theme.textSecondary,
          }}
        >
          <Users className="w-4 h-4" />
          Members
        </button>
        <button
          onClick={onInvite}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white"
          style={{ backgroundColor: theme.accent.primary }}
        >
          <UserPlus className="w-4 h-4" />
          Invite
        </button>
      </div>
    </div>
  );
}

