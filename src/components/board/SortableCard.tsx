import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '@/types';
import { getImageUrl, getDisplayType } from '@/lib/tmdb';
import { getMediaTypeStyle, getGenreStyle } from '@/lib/utils';
import StarRating from '../StarRating';
import { Info, Trash2, Lock } from 'lucide-react';
import Image from 'next/image';

interface SortableCardProps {
  card: Card;
  onDelete: () => void;
  onShowInfo: () => void;
  isDark: boolean;
  theme: any;
}

export function SortableCard({
  card,
  onDelete,
  onShowInfo,
  isDark,
  theme,
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: 'card', card },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeStyle = getMediaTypeStyle(
    getDisplayType(
      card.media_type,
      card.genres.includes('Animation') ? [16] : []
    ),
    isDark
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: theme.bgCard,
        border: `1px solid ${theme.border}`,
      }}
      className="rounded-xl p-3 cursor-grab active:cursor-grabbing group card-hover"
      {...attributes}
      {...listeners}
    >
      <div className="flex gap-3">
        <div className="relative w-14 h-20 flex-shrink-0">
          <Image
            src={getImageUrl(card.poster_path)}
            alt={card.title}
            fill
            className="object-cover rounded-lg"
          />
          {card.is_private && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.bgTertiary }}
            >
              <Lock className="w-3 h-3" style={{ color: theme.textMuted }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3
              className="font-medium text-sm leading-tight line-clamp-2"
              style={{ color: theme.text }}
            >
              {card.title}
            </h3>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onShowInfo();
                }}
                className="p-1 rounded"
                style={{ backgroundColor: theme.bgTertiary }}
              >
                <Info className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded hover:bg-red-500/20"
                style={{ backgroundColor: theme.bgTertiary }}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-1.5 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
            >
              {typeStyle.label}
            </span>
            {card.genres.slice(0, 1).map((genre) => {
              const gs = getGenreStyle(genre, isDark);
              return (
                <span
                  key={genre}
                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: gs.bg, color: gs.text }}
                >
                  {genre}
                </span>
              );
            })}
          </div>

          {card.rating && (
            <div className="mt-2">
              <StarRating rating={card.rating} size="xs" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

