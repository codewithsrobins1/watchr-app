import type { TMDBSearchResult } from '@/types';
import { getImageUrl, getDisplayType } from '@/lib/tmdb';
import { getMediaTypeStyle } from '@/lib/utils';
import { Search, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface BoardSearchProps {
  searchQuery: string;
  onChangeQuery: (value: string) => void;
  searchResults: TMDBSearchResult[];
  showResults: boolean;
  isSearching: boolean;
  onSelectResult: (result: TMDBSearchResult) => void;
  darkMode: boolean;
  theme: any;
}

export function BoardSearch({
  searchQuery,
  onChangeQuery,
  searchResults,
  showResults,
  isSearching,
  onSelectResult,
  darkMode,
  theme,
}: BoardSearchProps) {
  return (
    <div className="relative mb-4 max-w-xl">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onChangeQuery(e.target.value)}
        placeholder="Search shows, anime, or movies to add..."
        className="w-full px-4 py-3 pl-11 pr-11 rounded-xl outline-none transition-all focus:ring-2 text-base"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          color: theme.text,
        }}
      />
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
        style={{ color: theme.textMuted }}
      />
      {isSearching && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Loader2 className="w-5 h-5 spinner" style={{ color: theme.accent.primary }} />
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-96 overflow-auto"
          style={{
            backgroundColor: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadowHeavy,
          }}
        >
          {searchResults.map((result) => {
            const title = result.title || result.name || 'Unknown';
            const year = (result.release_date || result.first_air_date || '').split('-')[0];
            const typeStyle = getMediaTypeStyle(
              getDisplayType(result.media_type, result.genre_ids),
              darkMode
            );

            return (
              <div
                key={result.id}
                onClick={() => onSelectResult(result)}
                className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:opacity-80"
                style={{ borderBottom: `1px solid ${theme.border}` }}
              >
                <div className="relative w-12 h-16 flex-shrink-0">
                  <Image
                    src={getImageUrl(result.poster_path)}
                    alt={title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" style={{ color: theme.text }}>
                    {title}
                  </div>
                  <div className="text-sm" style={{ color: theme.textMuted }}>
                    {year}
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium mt-1 inline-block"
                    style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                  >
                    {typeStyle.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

