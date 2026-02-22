'use client'

import { useTheme } from '@/hooks'

interface StarRatingProps {
  rating: number
  onSelect?: (rating: number) => void
  interactive?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export default function StarRating({ rating, onSelect, interactive = false, size = 'md' }: StarRatingProps) {
  const { darkMode } = useTheme()

  const sizeMap = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  const sizeClass = sizeMap[size]

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = rating >= star
        const half = rating >= star - 0.5 && rating < star

        return (
          <div key={star} className={`relative ${sizeClass}`}>
            {interactive && onSelect && (
              <>
                <div 
                  className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10" 
                  onClick={() => onSelect(star - 0.5)} 
                />
                <div 
                  className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10" 
                  onClick={() => onSelect(star)} 
                />
              </>
            )}
            <svg viewBox="0 0 24 24" className={sizeClass}>
              <defs>
                <linearGradient id={`half-${star}-${size}`}>
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor={darkMode ? '#374151' : '#e5e7eb'} />
                </linearGradient>
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={filled ? '#fbbf24' : half ? `url(#half-${star}-${size})` : (darkMode ? '#374151' : '#e5e7eb')}
                stroke={filled || half ? '#fbbf24' : (darkMode ? '#6b7280' : '#d1d5db')}
                strokeWidth="1"
              />
            </svg>
          </div>
        )
      })}
    </div>
  )
}
