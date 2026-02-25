import type { AccentColor, CommunityFeedItem } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import { getMediaTypeStyle, calculateAverageRating, ACCENT_COLORS } from '@/lib/utils';
import StarRating from '../StarRating';
import Image from 'next/image';

interface CommunitySectionProps {
  title: string;
  items: CommunityFeedItem[];
  color: string;
  isWatching: boolean;
  onSelect: (item: CommunityFeedItem) => void;
  darkMode: boolean;
  theme: any;
}

export function CommunitySection({
  title,
  items,
  color,
  isWatching,
  onSelect,
  darkMode,
  theme,
}: CommunitySectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
          {title}
        </h2>
        <span
          className="text-sm px-2 py-0.5 rounded-full"
          style={{ backgroundColor: theme.bgTertiary, color: theme.textMuted }}
        >
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const avgRating = calculateAverageRating(item.watchers.map((w) => w.rating));
            const typeStyle = getMediaTypeStyle(item.media_type, darkMode);

            return (
              <div
                key={item.tmdb_id}
                onClick={() => onSelect(item)}
                className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div className="flex gap-3">
                  <div className="relative w-16 h-24 flex-shrink-0">
                    <Image
                      src={getImageUrl(item.poster_path)}
                      alt={item.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-sm line-clamp-2"
                      style={{ color: theme.text }}
                    >
                      {item.title}
                    </h3>

                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium mt-1 inline-block"
                      style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                    >
                      {typeStyle.label}
                    </span>

                    {avgRating && (
                      <div className="flex items-center gap-1 mt-2">
                        <StarRating rating={Number(avgRating)} size="xs" />
                        <span className="text-xs font-medium" style={{ color: theme.textSecondary }}>
                          {Number(avgRating).toFixed(1)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-1">
                        {item.watchers.slice(0, 3).map((w, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: ACCENT_COLORS[w.accent_color as AccentColor]?.bg,
                              border: `1.5px solid ${
                                ACCENT_COLORS[w.accent_color as AccentColor]?.primary
                              }`,
                            }}
                          >
                            {w.avatar_emoji}
                          </div>
                        ))}
                        {item.watchers.length > 3 && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: theme.bgTertiary,
                              color: theme.textMuted,
                            }}
                          >
                            +{item.watchers.length - 3}
                          </div>
                        )}
                      </div>

                      <span className="text-xs" style={{ color: theme.textMuted }}>
                        {isWatching ? 'watching' : 'finished'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: theme.bgSecondary }}>
          <p style={{ color: theme.textMuted }}>Nothing here yet</p>
        </div>
      )}
    </div>
  );
}

