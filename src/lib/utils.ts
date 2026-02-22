import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AccentColor, Column, PasswordRequirement } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Accent color configurations
export const ACCENT_COLORS: Record<AccentColor, { primary: string; bg: string; hover: string }> = {
  purple: { primary: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', hover: 'rgba(139, 92, 246, 0.2)' },
  blue: { primary: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', hover: 'rgba(59, 130, 246, 0.2)' },
  green: { primary: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', hover: 'rgba(16, 185, 129, 0.2)' },
  teal: { primary: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)', hover: 'rgba(20, 184, 166, 0.2)' },
  orange: { primary: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', hover: 'rgba(249, 115, 22, 0.2)' },
  pink: { primary: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', hover: 'rgba(236, 72, 153, 0.2)' },
  red: { primary: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', hover: 'rgba(239, 68, 68, 0.2)' },
}

// Column definitions
export const COLUMNS: Column[] = [
  { id: 'dropped', title: 'Dropped', color: '#6b7280' },
  { id: 'backlog', title: 'Backlog', color: '#8b5cf6' },
  { id: 'watching', title: 'Watching', color: '#3b82f6' },
  { id: 'finished', title: 'Finished', color: '#10b981' },
]

// Avatar and icon options
export const AVATAR_OPTIONS = ['😎', '🤓', '😊', '🥳', '😈', '🤠', '👻', '🦊', '🐱', '🐼', '🦄', '🌟']
export const BOARD_ICONS = ['📺', '🎬', '❤️', '🍿', '🎮', '🎭', '📚', '🎵']
export const COMMUNITY_ICONS = ['👥', '🎓', '💼', '🏠', '🎉', '⚔️', '🎮', '🌟']

// Filter options
export const FILTER_TYPES = [
  { value: 'tv', label: 'TV Show' },
  { value: 'anime', label: 'Anime' },
  { value: 'movie', label: 'Movie' },
]

export const FILTER_GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 
  'Fantasy', 'Thriller', 'Crime', 'Romance', 'Animation'
]

// Media type styling
export function getMediaTypeStyle(mediaType: string, isDark: boolean) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    tv: { bg: isDark ? '#1e3a5f' : '#dbeafe', text: '#3b82f6', label: 'TV Show' },
    anime: { bg: isDark ? '#4c1d4c' : '#fae8ff', text: '#d946ef', label: 'Anime' },
    movie: { bg: isDark ? '#4a3728' : '#fef3c7', text: '#f59e0b', label: 'Movie' },
  }
  return styles[mediaType] || styles.tv
}

// Genre styling
export function getGenreStyle(genre: string, isDark: boolean) {
  const styles: Record<string, { bg: string; text: string }> = {
    'Action': { bg: isDark ? '#7f1d1d' : '#fee2e2', text: '#ef4444' },
    'Comedy': { bg: isDark ? '#713f12' : '#fef9c3', text: '#eab308' },
    'Drama': { bg: isDark ? '#1e3a5f' : '#dbeafe', text: '#3b82f6' },
    'Horror': { bg: isDark ? '#3f3f46' : '#f4f4f5', text: '#71717a' },
    'Sci-Fi': { bg: isDark ? '#164e63' : '#cffafe', text: '#06b6d4' },
    'Fantasy': { bg: isDark ? '#4c1d95' : '#ede9fe', text: '#8b5cf6' },
    'Thriller': { bg: isDark ? '#1f2937' : '#f3f4f6', text: '#6b7280' },
    'Crime': { bg: isDark ? '#451a03' : '#ffedd5', text: '#ea580c' },
    'Romance': { bg: isDark ? '#831843' : '#fce7f3', text: '#ec4899' },
    'Animation': { bg: isDark ? '#4c1d4c' : '#fae8ff', text: '#d946ef' },
  }
  return styles[genre] || { bg: isDark ? '#1f2937' : '#f3f4f6', text: '#6b7280' }
}

// Theme colors
export function getThemeColors(isDark: boolean, accentColor: AccentColor) {
  const accent = ACCENT_COLORS[accentColor]
  return {
    bg: isDark ? '#0a0a0f' : '#f5f3ff',
    bgSecondary: isDark ? '#12121a' : '#ffffff',
    bgTertiary: isDark ? '#1a1a24' : '#f8f7ff',
    bgCard: isDark ? '#1e1e2a' : '#ffffff',
    border: isDark ? '#2a2a3a' : '#e9e5ff',
    text: isDark ? '#ffffff' : '#1e1b4b',
    textSecondary: isDark ? '#a1a1aa' : '#6b7280',
    textMuted: isDark ? '#52525b' : '#9ca3af',
    accent,
    shadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 4px 15px -3px rgba(139,92,246,0.15)',
    shadowHeavy: isDark ? '0 10px 25px -5px rgba(0,0,0,0.4)' : '0 10px 30px -5px rgba(139,92,246,0.2)',
  }
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; requirements: PasswordRequirement[] } {
  const requirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]
  return { isValid: requirements.every(r => r.met), requirements }
}

// Calculate average rating
export function calculateAverageRating(ratings: (number | null)[]): string | null {
  const valid = ratings.filter((r): r is number => r !== null)
  if (valid.length === 0) return null
  return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)
}

// Generate position for new card
export function generatePosition(existingPositions: number[]): number {
  if (existingPositions.length === 0) return 1000
  return Math.max(...existingPositions) + 1000
}

// Reorder items for drag and drop
export function reorderItems<T extends { id: string; position: number }>(
  items: T[],
  activeId: string,
  overId: string
): T[] {
  const oldIndex = items.findIndex(item => item.id === activeId)
  const newIndex = items.findIndex(item => item.id === overId)
  
  if (oldIndex === -1 || newIndex === -1) return items
  
  const newItems = [...items]
  const [movedItem] = newItems.splice(oldIndex, 1)
  newItems.splice(newIndex, 0, movedItem)
  
  // Recalculate positions
  return newItems.map((item, index) => ({
    ...item,
    position: (index + 1) * 1000
  }))
}
