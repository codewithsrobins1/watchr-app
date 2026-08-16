import type { Card, ColumnId } from '@/types';
import { COLUMNS, type Theme } from '@/lib/utils';
import { X } from 'lucide-react';

interface MoveCardModalProps {
  open: boolean;
  card: Card | null;
  onClose: () => void;
  onSelectColumn: (columnId: ColumnId) => void;
  theme: Theme;
}

export function MoveCardModal({
  open,
  card,
  onClose,
  onSelectColumn,
  theme,
}: MoveCardModalProps) {
  if (!open || !card) return null;

  const otherColumns = COLUMNS.filter((col) => col.id !== card.column_id);

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-md rounded-2xl p-6"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold truncate" style={{ color: theme.text }}>
            Move &ldquo;{card.title}&rdquo;
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex-shrink-0 ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {otherColumns.map((col) => (
            <button
              key={col.id}
              onClick={() => onSelectColumn(col.id)}
              className="flex items-center gap-2 px-3 py-4 rounded-lg transition-all"
              style={{
                backgroundColor: theme.bgTertiary,
                color: theme.textSecondary,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-sm font-medium">{col.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
