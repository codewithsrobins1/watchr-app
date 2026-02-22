export interface Profile {
  id: string
  username: string
  email: string
  avatar_emoji: string
  accent_color: AccentColor
  created_at: string
  updated_at: string
}

export type AccentColor = 'purple' | 'blue' | 'green' | 'teal' | 'orange' | 'pink' | 'red'

export interface Board {
  id: string
  name: string
  icon: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface BoardMember {
  id: string
  board_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profile?: Profile
}

export interface Card {
  id: string
  board_id: string
  tmdb_id: number
  media_type: 'tv' | 'movie'
  title: string
  poster_path: string | null
  description: string
  genres: string[]
  seasons_count: number | null
  episodes_count: number | null
  runtime: number | null
  column_id: ColumnId
  position: number
  rating: number | null
  is_private: boolean
  added_by: string
  created_at: string
  updated_at: string
}

export type ColumnId = 'dropped' | 'backlog' | 'watching' | 'finished'

export interface Column {
  id: ColumnId
  title: string
  color: string
}

export interface Community {
  id: string
  name: string
  icon: string
  owner_id: string
  created_at: string
}

export interface CommunityMember {
  id: string
  community_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profile?: Profile
}

export interface CommunityFeedItem {
  tmdb_id: number
  media_type: 'tv' | 'movie'
  title: string
  poster_path: string | null
  description: string
  genres: string[]
  seasons_count: number | null
  episodes_count: number | null
  runtime: number | null
  watchers: CommunityWatcher[]
}

export interface CommunityWatcher {
  user_id: string
  username: string
  avatar_emoji: string
  accent_color: AccentColor
  rating: number | null
  column_id: ColumnId
}

export interface Invitation {
  id: string
  type: 'board' | 'community'
  target_id: string
  target_name: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  inviter?: Profile
}

export interface TMDBSearchResult {
  id: number
  title?: string
  name?: string
  media_type: 'tv' | 'movie'
  poster_path: string | null
  overview: string
  first_air_date?: string
  release_date?: string
  genre_ids: number[]
}

export interface TMDBDetails {
  id: number
  name?: string
  title?: string
  overview: string
  poster_path: string | null
  number_of_seasons?: number
  number_of_episodes?: number
  runtime?: number
  genres: { id: number; name: string }[]
}

export interface PasswordRequirement {
  label: string
  met: boolean
}

export interface FilterState {
  types: string[]
  genres: string[]
}
