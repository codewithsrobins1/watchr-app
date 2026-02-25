import type { Card } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import { getGenreStyle } from '@/lib/utils';
import StarRating from '../StarRating';
import { X, Lock } from 'lucide-react';
import Image from 'next/image';

interface CardInfoModalProps {
  open: boolean;
  card: Card | null;
  darkMode: boolean;
  onClose: () => void;
  theme: any;
}

export function CardInfoModal({
  open,
  card,
  darkMode,
  onClose,
  theme,
}: CardInfoModalProps) {
  if (!open || !card) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[85vh] overflow-auto"
        style={{ backgroundColor: theme.bgSecondary }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-32"
          style={{
            background: `linear-gradient(to bottom, ${theme.accent.primary}40, transparent)`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 -mt-16">
          <div className="flex gap-4">
            <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={getImageUrl(card.poster_path, 'w342')}
                alt={card.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="pt-16">
              <h2 className="text-xl font-bold" style={{ color: theme.text }}>
                {card.title}
              </h2>

              <div className="flex gap-2 mt-2 flex-wrap">
                {card.genres.slice(0, 3).map((g) => {
                  const gs = getGenreStyle(g, darkMode);
                  return (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: gs.bg, color: gs.text }}
                    >
                      {g}
                    </span>
                  );
                })}
              </div>

              {card.rating && (
                <div className="flex items-center gap-2 mt-3">
                  <StarRating rating={card.rating} size="sm" />
                  <span className="font-semibold text-yellow-400">
                    {card.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {card.seasons_count && (
            <div
              className="mt-4 flex gap-4 text-sm"
              style={{ color: theme.textSecondary }}
            >
              <span>{card.seasons_count} seasons</span>
              <span>{card.episodes_count} episodes</span>
            </div>
          )}

          {card.runtime && (
            <div className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
              {card.runtime} minutes
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            {card.description}
          </p>

          {card.is_private && (
            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
              <Lock className="w-4 h-4" /> This card is private
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

