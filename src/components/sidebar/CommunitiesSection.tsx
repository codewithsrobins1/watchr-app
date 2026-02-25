import type { Community } from '@/types';
import type { ViewType } from '@/app/page';
import { Plus, Trash2, LogOut } from 'lucide-react';
import type { IsOwnerFn } from './types';

interface CommunitiesSectionProps {
  communities: Community[];
  currentView: ViewType;
  selectedCommunityId: string | null;
  onSelectCommunity: (communityId: string) => void;
  onCreateCommunityClick: () => void;
  onRequestDeleteCommunity: (community: Community) => void;
  onRequestLeaveCommunity: (community: Community) => void;
  isOwner: IsOwnerFn;
  theme: any;
}

export function CommunitiesSection({
  communities,
  currentView,
  selectedCommunityId,
  onSelectCommunity,
  onCreateCommunityClick,
  onRequestDeleteCommunity,
  onRequestLeaveCommunity,
  isOwner,
  theme,
}: CommunitiesSectionProps) {
  return (
    <div>
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: theme.textMuted }}
      >
        Community Feeds
      </span>
      <button
        onClick={onCreateCommunityClick}
        className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-lg font-medium transition-all"
        style={{
          backgroundColor: theme.accent.bg,
          color: theme.accent.primary,
        }}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">New Community</span>
      </button>
      <div className="mt-1 space-y-1">
        {communities.map((comm) => (
          <div key={comm.id} className="group flex items-center">
            <button
              onClick={() => onSelectCommunity(comm.id)}
              className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
              style={{
                backgroundColor:
                  selectedCommunityId === comm.id &&
                  currentView === 'community'
                    ? theme.accent.bg
                    : 'transparent',
                color:
                  selectedCommunityId === comm.id &&
                  currentView === 'community'
                    ? theme.accent.primary
                    : theme.textSecondary,
              }}
            >
              <span className="text-lg">{comm.icon}</span>
              <span className="flex-1 truncate text-sm font-medium">
                {comm.name}
              </span>
            </button>
            {isOwner(comm) ? (
              <button
                onClick={() => onRequestDeleteCommunity(comm)}
                className="p-1.5 rounded-lg hidden group-hover:block hover:bg-red-500/20"
                title="Delete community"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            ) : (
              <button
                onClick={() => onRequestLeaveCommunity(comm)}
                className="p-1.5 rounded-lg hidden group-hover:block hover:bg-orange-500/20"
                title="Leave community"
              >
                <LogOut className="w-4 h-4 text-orange-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

