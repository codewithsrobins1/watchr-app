import type { Board, CommunityFeedItem } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import { ACCENT_COLORS } from '@/lib/utils';
import type { AccentColor } from '@/types';
import StarRating from '../StarRating';
import { X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ItemDetailModalProps {
  open: boolean;
  item: CommunityFeedItem | null;
  onClose: () => void;
  myCardAlreadyAdded: boolean;
  myBoards: Board[];
  selectedBoardId: string | null;
  setSelectedBoardId: (id: string) => void;
  adding: boolean;
  onAddToBacklog: () => void;
  theme: any;
}

export function ItemDetailModal({
  open,
  item,
  onClose,
  myCardAlreadyAdded,
  myBoards,
  selectedBoardId,
  setSelectedBoardId,
  adding,
  onAddToBacklog,
  theme,
}: ItemDetailModalProps) {
  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-auto"
        style={{ backgroundColor: theme.bgSecondary }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: theme.text }}>
            {item.title}
          </h2>
          <button onClick={onClose} className="p-2.5 rounded-full bg-red-500 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative w-20 h-28 flex-shrink-0">
            <Image
              src={getImageUrl(item.poster_path, 'w185')}
              alt=""
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <p className="text-sm line-clamp-4" style={{ color: theme.textMuted }}>
              {item.description}
            </p>
            {item.seasons_count && (
              <p className="text-sm mt-2" style={{ color: theme.textSecondary }}>
                {item.seasons_count} seasons
              </p>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: theme.bgTertiary }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: theme.text }}>
            Watchers ({item.watchers.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-auto">
            {item.watchers.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{
                    backgroundColor: ACCENT_COLORS[w.accent_color as AccentColor]?.bg,
                    border: `2px solid ${
                      ACCENT_COLORS[w.accent_color as AccentColor]?.primary
                    }`,
                  }}
                >
                  {w.avatar_emoji}
                </div>
                <span className="text-sm flex-1" style={{ color: theme.text }}>
                  {w.username}
                </span>
                <span className="text-xs" style={{ color: theme.textMuted }}>
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

        {myCardAlreadyAdded ? (
          <button
            disabled
            className="w-full py-4 rounded-xl font-medium text-base"
            style={{ backgroundColor: theme.bgTertiary, color: theme.textMuted }}
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
                        border: `2px solid ${
                          selectedBoardId === board.id ? theme.accent.primary : 'transparent'
                        }`,
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
              onClick={onAddToBacklog}
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
  );
}

