import type { Community } from '@/types';
import type { ViewType } from '@/app/page';
import type { Theme } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface CommunitiesSectionProps {
  communities: Community[];
  currentView: ViewType;
  selectedCommunityId: string | null;
  onSelectCommunity: (communityId: string) => void;
  onCreateCommunityClick: () => void;
  theme: Theme;
}

export function CommunitiesSection({
  communities,
  currentView,
  selectedCommunityId,
  onSelectCommunity,
  onCreateCommunityClick,
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
          <button
            key={comm.id}
            onClick={() => onSelectCommunity(comm.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
              selectedCommunityId === comm.id && currentView === 'community'
                ? ''
                : 'hover:bg-[var(--row-hover)]'
            }`}
            style={{
              backgroundColor:
                selectedCommunityId === comm.id && currentView === 'community'
                  ? theme.accent.bg
                  : 'transparent',
              color:
                selectedCommunityId === comm.id && currentView === 'community'
                  ? theme.accent.primary
                  : theme.textSecondary,
              ['--row-hover' as string]: theme.bgTertiary,
            }}
          >
            <span className="text-lg">{comm.icon}</span>
            <span className="flex-1 truncate text-sm font-medium">
              {comm.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
