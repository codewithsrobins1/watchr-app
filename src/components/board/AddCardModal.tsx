import type { ColumnId, TMDBSearchResult } from '@/types';
import { COLUMNS } from '@/lib/utils';
import { getImageUrl } from '@/lib/tmdb';
import { X, Loader2, Lock } from 'lucide-react';
import Image from 'next/image';

interface AddCardModalProps {
  open: boolean;
  selectedResult: TMDBSearchResult | null;
  addColumn: ColumnId;
  setAddColumn: (value: ColumnId) => void;
  addPrivate: boolean;
  setAddPrivate: (value: boolean) => void;
  addLoading: boolean;
  onClose: () => void;
  onAdd: () => void;
  theme: any;
}

export function AddCardModal({
  open,
  selectedResult,
  addColumn,
  setAddColumn,
  addPrivate,
  setAddPrivate,
  addLoading,
  onClose,
  onAdd,
  theme,
}: AddCardModalProps) {
  if (!open || !selectedResult) return null;

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
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: theme.text }}>
            Add to Board
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative w-20 h-28 flex-shrink-0">
            <Image
              src={getImageUrl(selectedResult.poster_path, 'w185')}
              alt=""
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: theme.text }}>
              {selectedResult.title || selectedResult.name}
            </h3>
            <p className="text-sm mt-1 line-clamp-3" style={{ color: theme.textMuted }}>
              {selectedResult.overview}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
            Add to column
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                onClick={() => setAddColumn(col.id)}
                className="flex items-center gap-2 px-3 py-3 rounded-lg transition-all"
                style={{
                  backgroundColor:
                    addColumn === col.id ? theme.accent.bg : theme.bgTertiary,
                  border: `2px solid ${
                    addColumn === col.id ? theme.accent.primary : 'transparent'
                  }`,
                  color:
                    addColumn === col.id ? theme.accent.primary : theme.textSecondary,
                }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-medium">{col.title}</span>
              </button>
            ))}
          </div>
        </div>

        <label
          className="flex items-center gap-3 mb-6 p-4 rounded-xl cursor-pointer"
          style={{ backgroundColor: theme.bgTertiary }}
        >
          <input
            type="checkbox"
            checked={addPrivate}
            onChange={(e) => setAddPrivate(e.target.checked)}
            className="w-5 h-5 rounded"
          />
          <div>
            <div className="text-sm font-medium flex items-center gap-2" style={{ color: theme.text }}>
              <Lock className="w-4 h-4" />
              Make Private
            </div>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              {addPrivate ? "Won't appear in community feeds" : 'Will appear in community feeds'}
            </div>
          </div>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-medium text-base"
            style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={addLoading}
            className="flex-1 py-4 rounded-xl font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            style={{ backgroundColor: theme.accent.primary }}
          >
            {addLoading ? (
              <>
                <Loader2 className="w-5 h-5 spinner" />
                Adding...
              </>
            ) : (
              'Add to Board'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

