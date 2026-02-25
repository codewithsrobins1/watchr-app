import type { Board, BoardMember, ColumnId, Profile } from '@/types';
import type { FilterState } from '@/types';
import { ACCENT_COLORS } from '@/lib/utils';
import FilterDropdown from '../FilterDropdown';
import { Filter, UserPlus, X, Loader2, Pencil, Check } from 'lucide-react';

interface BoardHeaderProps {
  board: Board | null;
  members: (BoardMember & { profile: Profile })[];
  isEditingName: boolean;
  editedName: string;
  savingName: boolean;
  onChangeEditedName: (value: string) => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  showFilters: boolean;
  setShowFilters: (open: boolean) => void;
  filterCount: number;
  onInvite: () => void;
  darkMode: boolean;
  theme: any;
}

export function BoardHeader({
  board,
  members,
  isEditingName,
  editedName,
  savingName,
  onChangeEditedName,
  onSaveName,
  onCancelEdit,
  onStartEdit,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  filterCount,
  onInvite,
  theme,
}: BoardHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{board?.icon}</span>

        {/* Editable Board Name */}
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => onChangeEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveName();
                if (e.key === 'Escape') onCancelEdit();
              }}
              autoFocus
              className="text-xl font-bold px-2 py-1 rounded-lg outline-none focus:ring-2"
              style={{
                backgroundColor: theme.bgTertiary,
                border: `1px solid ${theme.border}`,
                color: theme.text,
                minWidth: '150px',
              }}
            />
            <button
              onClick={onSaveName}
              disabled={savingName || !editedName.trim()}
              className="p-2 rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: theme.accent.primary }}
              title="Save"
            >
              {savingName ? (
                <Loader2 className="w-4 h-4 spinner" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onCancelEdit}
              className="p-2 rounded-lg"
              style={{ backgroundColor: theme.bgTertiary, color: theme.textMuted }}
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-xl font-bold" style={{ color: theme.text }}>
              {board?.name}
            </h1>
            <button
              onClick={onStartEdit}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: theme.bgTertiary }}
              title="Edit board name"
            >
              <Pencil className="w-4 h-4" style={{ color: theme.textMuted }} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {members.length > 0 && (
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                title={m.profile?.username || 'User'}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2"
                style={{
                  backgroundColor: theme.bgTertiary,
                  borderColor:
                    ACCENT_COLORS[m.profile?.accent_color || 'purple'].primary,
                }}
              >
                {m.profile?.avatar_emoji || '😎'}
              </div>
            ))}
            {members.length > 4 && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: theme.bgTertiary,
                  color: theme.textMuted,
                }}
              >
                +{members.length - 4}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: filterCount > 0 ? theme.accent.bg : theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              color: filterCount > 0 ? theme.accent.primary : theme.textSecondary,
            }}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {filterCount > 0 && (
              <span
                className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white"
                style={{ backgroundColor: theme.accent.primary }}
              >
                {filterCount}
              </span>
            )}
          </button>
          {showFilters && (
            <FilterDropdown
              filters={filters}
              setFilters={setFilters}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>

        <button
          onClick={onInvite}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white"
          style={{ backgroundColor: theme.accent.primary }}
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Invite</span>
        </button>
      </div>
    </div>
  );
}

