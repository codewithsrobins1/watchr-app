'use client'

import { useTheme } from '@/hooks'
import { FILTER_TYPES, FILTER_GENRES } from '@/lib/utils'
import type { FilterState } from '@/types'
import { X } from 'lucide-react'

interface FilterDropdownProps {
  filters: FilterState
  setFilters: (filters: FilterState) => void
  onClose: () => void
}

export default function FilterDropdown({ filters, setFilters, onClose }: FilterDropdownProps) {
  const { theme } = useTheme()

  const toggleType = (value: string) => {
    setFilters({
      ...filters,
      types: filters.types.includes(value)
        ? filters.types.filter(t => t !== value)
        : [...filters.types, value]
    })
  }

  const toggleGenre = (value: string) => {
    setFilters({
      ...filters,
      genres: filters.genres.includes(value)
        ? filters.genres.filter(g => g !== value)
        : [...filters.genres, value]
    })
  }

  const clearAll = () => {
    setFilters({ types: [], genres: [] })
  }

  const hasFilters = filters.types.length > 0 || filters.genres.length > 0

  return (
    <div 
      className="absolute top-full right-0 mt-2 w-64 rounded-xl p-4 z-50 modal-content"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, boxShadow: theme.shadowHeavy }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: theme.text }}>Filters</h3>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs font-medium hover:underline" style={{ color: theme.accent.primary }}>
            Clear all
          </button>
        )}
      </div>

      {/* Type */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Type</h4>
        <div className="space-y-2">
          {FILTER_TYPES.map(type => (
            <label key={type.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.types.includes(type.value)}
                onChange={() => toggleType(type.value)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: theme.text }}>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Genre */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Genre</h4>
        <div className="space-y-2 max-h-48 overflow-auto">
          {FILTER_GENRES.map(genre => (
            <label key={genre} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.genres.includes(genre)}
                onChange={() => toggleGenre(genre)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm" style={{ color: theme.text }}>{genre}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
