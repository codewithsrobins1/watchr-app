import type { TMDBSearchResult, TMDBDetails } from '@/types'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p'

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western', 10759: 'Action', 10765: 'Sci-Fi',
}

export function getImageUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' = 'w185'): string {
  if (!path) return '/icon.png'
  return `${TMDB_IMAGE}/${size}${path}`
}

export function mapGenreIds(ids: number[]): string[] {
  return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3)
}

export async function searchMedia(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return []
  
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
  if (!apiKey) {
    console.error('TMDB API key not configured')
    return []
  }

  try {
    const response = await fetch(
      `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
    )
    
    if (!response.ok) {
      console.error('TMDB search failed:', response.status)
      return []
    }
    
    const data = await response.json()
    
    return data.results
      .filter((item: any) => item.media_type === 'tv' || item.media_type === 'movie')
      .slice(0, 8)
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        name: item.name,
        media_type: item.media_type,
        poster_path: item.poster_path,
        overview: item.overview || '',
        first_air_date: item.first_air_date,
        release_date: item.release_date,
        genre_ids: item.genre_ids || [],
      }))
  } catch (error) {
    console.error('TMDB search error:', error)
    return []
  }
}

export async function getMediaDetails(id: number, type: 'tv' | 'movie'): Promise<TMDBDetails | null> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(`${TMDB_BASE}/${type}/${id}?api_key=${apiKey}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('TMDB details error:', error)
    return null
  }
}

export function isAnime(genreIds: number[]): boolean {
  return genreIds.includes(16) // Animation genre
}

export function getDisplayType(mediaType: 'tv' | 'movie', genreIds: number[]): string {
  if (mediaType === 'movie') return 'movie'
  if (isAnime(genreIds)) return 'anime'
  return 'tv'
}
