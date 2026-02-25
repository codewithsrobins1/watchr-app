'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, rectIntersection, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useAuth, useTheme } from '@/hooks'
import { createClient } from '@/lib/supabase/client'
import { searchMedia, getMediaDetails, getImageUrl, mapGenreIds, getDisplayType } from '@/lib/tmdb'
import { getMediaTypeStyle, getGenreStyle, COLUMNS, generatePosition, ACCENT_COLORS } from '@/lib/utils'
import type { Card, Board, ColumnId, TMDBSearchResult, BoardMember, Profile } from '@/types'
import InviteModal from './modals/InviteModal'
import { Search, Filter, Trash2, Lock, UserPlus, X, Loader2, Info, Pencil, Check } from 'lucide-react'
import Image from 'next/image'
import { SortableCard } from './board/SortableCard'
import { DroppableColumn } from './board/DroppableColumn'
import { BoardHeader } from './board/BoardHeader'
import { BoardSearch } from './board/BoardSearch'
import { AddCardModal } from './board/AddCardModal'
import { ReviewModal } from './board/ReviewModal'
import { CardInfoModal } from './board/CardInfoModal'

export default function BoardView({ boardId }: { boardId: string | null }) {
  const { user } = useAuth()
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

  // Editable board name state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    if (!boardId) { setLoading(false); return }

    const fetchData = async () => {
      setLoading(true)
      
      const { data: boardData } = await supabase.from('boards').select('*').eq('id', boardId).single()
      if (boardData) {
        setBoard(boardData)
        setEditedName(boardData.name)
      }

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

  const handleSaveBoardName = async () => {
    if (!boardId || !editedName.trim() || savingName) return
    setSavingName(true)

    const { error } = await supabase
      .from('boards')
      .update({ name: editedName.trim() })
      .eq('id', boardId)

    if (!error) {
      setBoard(prev => prev ? { ...prev, name: editedName.trim() } : null)
    }

    setSavingName(false)
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setEditedName(board?.name || '')
    setIsEditingName(false)
  }

  const handleAddCard = async () => {
    if (!selectedResult || !boardId || !user) return
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
        added_by: user.id,
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
      <BoardHeader
        board={board}
        members={members}
        isEditingName={isEditingName}
        editedName={editedName}
        savingName={savingName}
        onChangeEditedName={setEditedName}
        onSaveName={handleSaveBoardName}
        onCancelEdit={handleCancelEdit}
        onStartEdit={() => setIsEditingName(true)}
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filterCount={filterCount}
        onInvite={() => setShowInvite(true)}
        darkMode={darkMode}
        theme={theme}
      />

      <BoardSearch
        searchQuery={searchQuery}
        onChangeQuery={setSearchQuery}
        searchResults={searchResults}
        showResults={showResults}
        isSearching={isSearching}
        onSelectResult={(result) => {
          setSelectedResult(result);
          setShowAddModal(true);
          setShowResults(false);
        }}
        darkMode={darkMode}
        theme={theme}
      />

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

      <AddCardModal
        open={showAddModal}
        selectedResult={selectedResult}
        addColumn={addColumn}
        setAddColumn={setAddColumn}
        addPrivate={addPrivate}
        setAddPrivate={setAddPrivate}
        addLoading={addLoading}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCard}
        theme={theme}
      />

      <ReviewModal
        open={showReview}
        reviewCard={reviewCard}
        reviewRating={reviewRating}
        setReviewRating={setReviewRating}
        onClose={() => {
          setShowReview(false);
          setReviewCard(null);
        }}
        onSubmit={handleReviewSubmit}
        theme={theme}
      />

      <CardInfoModal
        open={!!showCardInfo}
        card={showCardInfo}
        darkMode={darkMode}
        onClose={() => setShowCardInfo(null)}
        theme={theme}
      />

      {showInvite && boardId && <InviteModal type="board" targetId={boardId} onClose={() => setShowInvite(false)} />}
    </div>
  )
}
