import type { Card } from '@/types';
import StarRating from '../StarRating';

interface ReviewModalProps {
  open: boolean;
  reviewCard: Card | null;
  reviewRating: number;
  setReviewRating: (value: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  theme: any;
}

export function ReviewModal({
  open,
  reviewCard,
  reviewRating,
  setReviewRating,
  onClose,
  onSubmit,
  theme,
}: ReviewModalProps) {
  if (!open || !reviewCard) return null;

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
        <h2 className="text-xl font-bold mb-2" style={{ color: theme.text }}>
          You finished it! 🎉
        </h2>
        <p className="mb-6" style={{ color: theme.textSecondary }}>
          Rate{' '}
          <span className="font-semibold" style={{ color: theme.text }}>
            {reviewCard.title}
          </span>
        </p>

        <div className="flex justify-center mb-4">
          <StarRating
            rating={reviewRating}
            onSelect={setReviewRating}
            interactive
            size="lg"
          />
        </div>

        <div className="text-center mb-6">
          <span
            className="text-4xl font-bold"
            style={{ color: theme.accent.primary }}
          >
            {reviewRating > 0 ? reviewRating.toFixed(1) : '—'}
          </span>
          <span className="text-lg" style={{ color: theme.textMuted }}>
            {' '}
            / 5
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-medium text-base"
            style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!reviewRating}
            className="flex-1 py-4 rounded-xl font-medium text-white disabled:opacity-50 text-base"
            style={{ backgroundColor: theme.accent.primary }}
          >
            Save Rating
          </button>
        </div>
      </div>
    </div>
  );
}

