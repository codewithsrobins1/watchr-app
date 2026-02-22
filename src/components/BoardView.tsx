'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, rectIntersection, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth, useTheme } from '@/hooks'
import { createClient } from '@/lib/supabase/client'
import { searchMedia, getMediaDetails, getImageUrl, mapGenreIds, getDisplayType } from '@/lib/tmdb'
import { getMediaTypeStyle, getGenreStyle, COLUMNS, generatePosition, ACCENT_COLORS } from '@/lib/utils'
import type { Card, Board, ColumnId, TMDBSearchResult, BoardMember, Profile } from '@/types'
import StarRating from './StarRating'
import FilterDropdown from './FilterDropdown'
import InviteModal from './modals/InviteModal'
import { Search, Filter, Trash2, Lock, UserPlus, X, Loader2, Info } from 'lucide-react'
import Image from 'next/image'

function SortableCard({ card, onDelete, onShowInfo, isDark, theme }: { 
  card: Card; onDelete: () => void; onShowInfo: () => void; isDark: boolean; theme: any 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: card.id,
    data: { type: 'card', card }
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeStyle = getMediaTypeStyle(getDisplayType(card.media_type, card.genres.includes('Animation') ? [16] : []), isDark)

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}
      className="rounded-xl p-3 cursor-grab active:cursor-grabbing group card-hover"
      {...attributes}
      {...listeners}
    >
      <div className="flex gap-3">
        <div className="relative w-14 h-20 flex-shrink-0">
          <Image src={getImageUrl(card.poster_path)} alt={card.title} fill className="object-cover rounded-lg" />
          {card.is_private && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.bgTertiary }}>
              <Lock className="w-3 h-3" style={{ color: theme.textMuted }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-medium text-sm leading-tight line-clamp-2" style={{ color: theme.text }}>{card.title}</h3>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onShowInfo() }} className="p-1 rounded" style={{ backgroundColor: theme.bgTertiary }}>
                <Info className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
              </button>
              <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-red-500/20" style={{ backgroundColor: theme.bgTertiary }}>
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}>{typeStyle.label}</span>
            {card.genres.slice(0, 1).map(genre => {
              const gs = getGenreStyle(genre, isDark)
              return <span key={genre} className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: gs.bg, color: gs.text }}>{genre}</span>
            })}
          </div>
          {card.rating && <div className="mt-2"><StarRating rating={card.rating} size="xs" /></div>}
        </div>
      </div>
    </div>
  )
}

function DroppableColumn({ id, column, cards, children, isOver, theme }: { 
  id: string; column: typeof COLUMNS[0]; cards: Card[]; children: React.ReactNode; isOver: boolean; theme: any 
}) {
  const { setNodeRef, isOver: isOverThis } = useDroppable({ 
    id,
    data: { type: 'column', columnId: column.id }
  })

  const showHighlight = isOver || isOverThis

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl p-4 min-h-[400px] transition-all duration-200"
      style={{ 
        backgroundColor: showHighlight ? theme.accent.bg : theme.bgSecondary, 
        boxShadow: theme.shadow,
        border: showHighlight ? `2px dashed ${theme.accent.primary}` : '2px solid transparent'
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
        <h2 className="font-semibold" style={{ color: theme.text }}>{column.title}</h2>
        <span className="ml-auto text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.bgTertiary, color: theme.textMuted }}>
          {cards.length}
        </span>
      </div>
      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {children}
          {cards.length === 0 && (
            <div className="border-2 border-dashed rounded-xl p-8 text-center" style={{ borderColor: showHighlight ? theme.accent.primary : theme.border }}>
              <p className="text-sm" style={{ color: theme.textMuted }}>{showHighlight ? 'Drop here!' : 'Drag items here'}</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function BoardView({ boardId }: { boardId: string | null }) {
  const { profile } = useAuth()
  const { theme, darkMode } = useTheme()
  const supabase = createClient()

  const [board, setBoard] = useState<Board | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [members, setMembers] = useState<(BoardMember & { profile: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ types: [] as string[], genres: [] as string[] })

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState<TMDBSearchResult | null>(null)
  const [addColumn, setAddColumn] = useState<ColumnId>('backlog')
  const [addPrivate, setAddPrivate] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const [showReview, setShowReview] = useState(false)
  const [reviewCard, setReviewCard] = useState<Card | null>(null)
  const [reviewRating, setReviewRating] = useState(0)

  const [showInvite, setShowInvite] = useState(false)
  const [showCardInfo, setShowCardInfo] = useState<Card | null>(null)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnId | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    if (!boardId) { setLoading(false); return }

    const fetchData = async () => {
      setLoading(true)
      
      const { data: boardData } = await supabase.from('boards').select('*').eq('id', boardId).single()
      if (boardData) setBoard(boardData)

      const { data: cardsData } = await supabase
        .from('cards')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true })
      if (cardsData) setCards(cardsData)

      const { data: membersData } = await supabase
        .from('board_members')
        .select('*, profile:profiles(*)')
        .eq('board_id', boardId)
      if (membersData) setMembers(membersData as any)

      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel(`board-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards', filter: `board_id=eq.${boardId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCards(prev => [...prev, payload.new as Card].sort((a, b) => a.position - b.position))
        } else if (payload.eventType === 'UPDATE') {
          setCards(prev => prev.map(c => c.id === payload.new.id ? payload.new as Card : c).sort((a, b) => a.position - b.position))
        } else if (payload.eventType === 'DELETE') {
          setCards(prev => prev.filter(c => c.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [boardId, supabase])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowResults(false); return }
    setIsSearching(true)
    const timer = setTimeout(async () => {
      const results = await searchMedia(searchQuery)
      setSearchResults(results)
      setIsSearching(false)
      setShowResults(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const getColumnCards = useCallback((columnId: ColumnId) => {
    let result = cards.filter(c => c.column_id === columnId)
    if (filters.types.length > 0) {
      result = result.filter(c => {
        const type = getDisplayType(c.media_type, c.genres.includes('Animation') ? [16] : [])
        return filters.types.includes(type)
      })
    }
    if (filters.genres.length > 0) {
      result = result.filter(c => c.genres.some(g => filters.genres.includes(g)))
    }
    return result
  }, [cards, filters])

  const findColumnForCard = (cardId: string): ColumnId | null => {
    const card = cards.find(c => c.id === cardId)
    return card?.column_id || null
  }

  const handleAddCard = async () => {
    if (!selectedResult || !boardId || !profile) return
    setAddLoading(true)

    try {
      const details = await getMediaDetails(selectedResult.id, selectedResult.media_type)
      const genres = details?.genres?.map(g => g.name) || mapGenreIds(selectedResult.genre_ids)
      const position = generatePosition(cards.filter(c => c.column_id === addColumn).map(c => c.position))

      const newCard = {
        board_id: boardId,
        tmdb_id: selectedResult.id,
        media_type: selectedResult.media_type,
        title: selectedResult.title || selectedResult.name || 'Unknown',
        poster_path: selectedResult.poster_path,
        description: selectedResult.overview || details?.overview || '',
        genres,
        seasons_count: details?.number_of_seasons || null,
        episodes_count: details?.number_of_episodes || null,
        runtime: details?.runtime || null,
        column_id: addColumn,
        position,
        rating: null,
        is_private: addPrivate,
        added_by: profile.id,
      }

      const { error } = await supabase.from('cards').insert(newCard)
      if (error) {
        console.error('Add card error:', error)
        alert('Failed to add card: ' + error.message)
      }
    } catch (err) {
      console.error('Add card exception:', err)
      alert('Failed to add card')
    }

    setAddLoading(false)
    setShowAddModal(false)
    setSelectedResult(null)
    setSearchQuery('')
    setShowResults(false)
    setAddPrivate(false)
  }

  const handleDelete = async (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
    await supabase.from('cards').delete().eq('id', cardId)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    
    if (!over) {
      setActiveColumn(null)
      return
    }

    const overId = over.id as string
    
    // Check if hovering over a column
    if (COLUMNS.some(col => col.id === overId)) {
      setActiveColumn(overId as ColumnId)
      return
    }
    
    // Check if hovering over a card
    const overCard = cards.find(c => c.id === overId)
    if (overCard) {
      setActiveColumn(overCard.column_id)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setActiveColumn(null)

    if (!over) return

    const activeCardId = active.id as string
    const activeCard = cards.find(c => c.id === activeCardId)
    if (!activeCard) return

    const overId = over.id as string
    
    // Determine target column
    let targetColumnId: ColumnId
    
    if (COLUMNS.some(col => col.id === overId)) {
      // Dropped on column
      targetColumnId = overId as ColumnId
    } else {
      // Dropped on card - get its column
      const overCard = cards.find(c => c.id === overId)
      if (!overCard) return
      targetColumnId = overCard.column_id
    }

    // Moving to finished - show review modal
    if (targetColumnId === 'finished' && activeCard.column_id !== 'finished') {
      setReviewCard(activeCard)
      setShowReview(true)
      return
    }

    // Same column - reorder
    if (activeCard.column_id === targetColumnId) {
      const overCard = cards.find(c => c.id === overId)
      if (overCard && activeCardId !== overId) {
        const columnCards = cards.filter(c => c.column_id === targetColumnId)
        const oldIndex = columnCards.findIndex(c => c.id === activeCardId)
        const newIndex = columnCards.findIndex(c => c.id === overId)
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnCards, oldIndex, newIndex)
          const updates = reordered.map((card, idx) => ({ ...card, position: (idx + 1) * 1000 }))
          
          setCards(prev => {
            const others = prev.filter(c => c.column_id !== targetColumnId)
            return [...others, ...updates].sort((a, b) => a.position - b.position)
          })

          for (const card of updates) {
            await supabase.from('cards').update({ position: card.position }).eq('id', card.id)
          }
        }
      }
    } 
    // Different column - move card
    else {
      const targetCards = cards.filter(c => c.column_id === targetColumnId)
      const newPosition = generatePosition(targetCards.map(c => c.position))

      setCards(prev => prev.map(c => 
        c.id === activeCardId 
          ? { ...c, column_id: targetColumnId, position: newPosition } 
          : c
      ))
      
      await supabase.from('cards').update({ 
        column_id: targetColumnId, 
        position: newPosition 
      }).eq('id', activeCardId)
    }
  }

  const handleReviewSubmit = async () => {
    if (!reviewCard) return
    const targetCards = cards.filter(c => c.column_id === 'finished')
    const newPosition = generatePosition(targetCards.map(c => c.position))

    setCards(prev => prev.map(c => c.id === reviewCard.id ? { ...c, column_id: 'finished', rating: reviewRating, position: newPosition } : c))
    await supabase.from('cards').update({ column_id: 'finished', rating: reviewRating, position: newPosition }).eq('id', reviewCard.id)

    setShowReview(false)
    setReviewCard(null)
    setReviewRating(0)
  }

  const activeCard = activeId ? cards.find(c => c.id === activeId) : null
  const filterCount = filters.types.length + filters.genres.length

  if (!boardId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-medium mb-2" style={{ color: theme.text }}>No board selected</p>
          <p style={{ color: theme.textMuted }}>Create a board or select one from the sidebar</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 spinner" style={{ color: theme.accent.primary }} />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{board?.icon}</span>
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>{board?.name}</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {members.length > 0 && (
            <div className="flex -space-x-2">
              {members.slice(0, 4).map(m => (
                <div key={m.id} className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2" 
                  style={{ backgroundColor: theme.bgTertiary, borderColor: ACCENT_COLORS[m.profile?.accent_color || 'purple'].primary }}>
                  {m.profile?.avatar_emoji || '😎'}
                </div>
              ))}
              {members.length > 4 && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: theme.bgTertiary, color: theme.textMuted }}>
                  +{members.length - 4}
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg btn-hover"
              style={{ backgroundColor: filterCount > 0 ? theme.accent.bg : theme.bgSecondary, border: `1px solid ${theme.border}`, color: filterCount > 0 ? theme.accent.primary : theme.textSecondary }}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {filterCount > 0 && (
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white" style={{ backgroundColor: theme.accent.primary }}>{filterCount}</span>
              )}
            </button>
            {showFilters && <FilterDropdown filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} />}
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white btn-hover"
            style={{ backgroundColor: theme.accent.primary }}
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>
      </div>

      <div className="relative mb-4 max-w-xl">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search shows, anime, or movies to add..."
          className="w-full px-4 py-3 pl-11 pr-11 rounded-xl outline-none transition-all focus:ring-2"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.text }}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.textMuted }} />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 spinner" style={{ color: theme.accent.primary }} />
          </div>
        )}

        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-96 overflow-auto" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, boxShadow: theme.shadowHeavy }}>
            {searchResults.map(result => {
              const title = result.title || result.name || 'Unknown'
              const year = (result.release_date || result.first_air_date || '').split('-')[0]
              const typeStyle = getMediaTypeStyle(getDisplayType(result.media_type, result.genre_ids), darkMode)
              return (
                <div
                  key={result.id}
                  onClick={() => { setSelectedResult(result); setShowAddModal(true); setShowResults(false) }}
                  className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:opacity-80"
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                >
                  <div className="relative w-12 h-16 flex-shrink-0">
                    <Image src={getImageUrl(result.poster_path)} alt={title} fill className="object-cover rounded" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: theme.text }}>{title}</div>
                    <div className="text-sm" style={{ color: theme.textMuted }}>{year}</div>
                    <span className="px-2 py-0.5 rounded text-xs font-medium mt-1 inline-block" style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}>{typeStyle.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(column => {
            const columnCards = getColumnCards(column.id)
            return (
              <DroppableColumn 
                key={column.id} 
                id={column.id}
                column={column} 
                cards={columnCards} 
                isOver={activeColumn === column.id} 
                theme={theme}
              >
                {columnCards.map(card => (
                  <SortableCard 
                    key={card.id} 
                    card={card} 
                    isDark={darkMode} 
                    theme={theme} 
                    onDelete={() => handleDelete(card.id)} 
                    onShowInfo={() => setShowCardInfo(card)} 
                  />
                ))}
              </DroppableColumn>
            )
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard && (
            <div 
              className="rounded-xl p-3 cursor-grabbing rotate-2" 
              style={{ 
                backgroundColor: theme.bgCard, 
                border: `2px solid ${theme.accent.primary}`, 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                width: 280
              }}
            >
              <div className="flex gap-3">
                <div className="relative w-14 h-20 flex-shrink-0">
                  <Image src={getImageUrl(activeCard.poster_path)} alt={activeCard.title} fill className="object-cover rounded-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm line-clamp-2" style={{ color: theme.text }}>{activeCard.title}</h3>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showAddModal && selectedResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: theme.text }}>Add to Board</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="relative w-20 h-28 flex-shrink-0"><Image src={getImageUrl(selectedResult.poster_path, 'w185')} alt="" fill className="object-cover rounded-lg" /></div>
              <div>
                <h3 className="font-semibold" style={{ color: theme.text }}>{selectedResult.title || selectedResult.name}</h3>
                <p className="text-sm mt-1 line-clamp-3" style={{ color: theme.textMuted }}>{selectedResult.overview}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Add to column</label>
              <div className="grid grid-cols-2 gap-2">
                {COLUMNS.map(col => (
                  <button key={col.id} onClick={() => setAddColumn(col.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                    style={{ backgroundColor: addColumn === col.id ? theme.accent.bg : theme.bgTertiary, border: `2px solid ${addColumn === col.id ? theme.accent.primary : 'transparent'}`, color: addColumn === col.id ? theme.accent.primary : theme.textSecondary }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-sm font-medium">{col.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 mb-6 p-3 rounded-xl cursor-pointer" style={{ backgroundColor: theme.bgTertiary }}>
              <input type="checkbox" checked={addPrivate} onChange={e => setAddPrivate(e.target.checked)} className="w-4 h-4 rounded" />
              <div>
                <div className="text-sm font-medium flex items-center gap-2" style={{ color: theme.text }}><Lock className="w-4 h-4" />Make Private</div>
                <div className="text-xs" style={{ color: theme.textMuted }}>{addPrivate ? "Won't appear in community feeds" : "Will appear in community feeds"}</div>
              </div>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-medium" style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}>Cancel</button>
              <button onClick={handleAddCard} disabled={addLoading} className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: theme.accent.primary }}>
                {addLoading ? <><Loader2 className="w-4 h-4 spinner" />Adding...</> : 'Add to Board'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReview && reviewCard && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowReview(false); setReviewCard(null) }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: theme.bgSecondary }} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2" style={{ color: theme.text }}>You finished it! 🎉</h2>
            <p className="mb-6" style={{ color: theme.textSecondary }}>Rate <span className="font-semibold" style={{ color: theme.text }}>{reviewCard.title}</span></p>
            <div className="flex justify-center mb-4"><StarRating rating={reviewRating} onSelect={setReviewRating} interactive size="lg" /></div>
            <div className="text-center mb-6"><span className="text-4xl font-bold" style={{ color: theme.accent.primary }}>{reviewRating > 0 ? reviewRating.toFixed(1) : '—'}</span><span className="text-lg" style={{ color: theme.textMuted }}> / 5</span></div>
            <div className="flex gap-3">
              <button onClick={() => { setShowReview(false); setReviewCard(null) }} className="flex-1 py-3 rounded-xl font-medium" style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}>Cancel</button>
              <button onClick={handleReviewSubmit} disabled={!reviewRating} className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-50" style={{ backgroundColor: theme.accent.primary }}>Save Rating</button>
            </div>
          </div>
        </div>
      )}

      {showCardInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCardInfo(null)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: theme.bgSecondary }} onClick={e => e.stopPropagation()}>
            <div className="relative h-32" style={{ background: `linear-gradient(to bottom, ${theme.accent.primary}40, transparent)` }}>
              <button onClick={() => setShowCardInfo(null)} className="absolute top-4 right-4 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 pb-6 -mt-16">
              <div className="flex gap-4">
                <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                  <Image src={getImageUrl(showCardInfo.poster_path, 'w342')} alt={showCardInfo.title} fill className="object-cover" />
                </div>
                <div className="pt-16">
                  <h2 className="text-xl font-bold" style={{ color: theme.text }}>{showCardInfo.title}</h2>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {showCardInfo.genres.slice(0, 3).map(g => (
                      <span key={g} className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: getGenreStyle(g, darkMode).bg, color: getGenreStyle(g, darkMode).text }}>{g}</span>
                    ))}
                  </div>
                  {showCardInfo.rating && (
                    <div className="flex items-center gap-2 mt-3">
                      <StarRating rating={showCardInfo.rating} size="sm" />
                      <span className="font-semibold text-yellow-400">{showCardInfo.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              {showCardInfo.seasons_count && (
                <div className="mt-4 flex gap-4 text-sm" style={{ color: theme.textSecondary }}>
                  <span>{showCardInfo.seasons_count} seasons</span>
                  <span>{showCardInfo.episodes_count} episodes</span>
                </div>
              )}
              {showCardInfo.runtime && (
                <div className="mt-2 text-sm" style={{ color: theme.textSecondary }}>{showCardInfo.runtime} minutes</div>
              )}
              <p className="mt-4 text-sm leading-relaxed" style={{ color: theme.textMuted }}>{showCardInfo.description}</p>
              {showCardInfo.is_private && (
                <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
                  <Lock className="w-4 h-4" /> This card is private
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showInvite && boardId && <InviteModal type="board" targetId={boardId} onClose={() => setShowInvite(false)} />}
    </div>
  )
}
