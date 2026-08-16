'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, rectIntersection, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useAuth, useTheme } from '@/hooks'
import { db } from '@/lib/firebase/client'
import { nowIso, getDocsByIds } from '@/lib/firebase/firestore'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { searchMedia, getMediaDetails, getImageUrl, mapGenreIds, getDisplayType } from '@/lib/tmdb'
import { getMediaTypeStyle, getGenreStyle, COLUMNS, generatePosition, ACCENT_COLORS } from '@/lib/utils'
import { deleteBoardCascade, leaveBoard } from '@/lib/firebase/actions'
import type { Card, Board, ColumnId, TMDBSearchResult, BoardMember, Profile, ConfirmAction } from '@/types'
import InviteModal from './modals/InviteModal'
import { ConfirmActionModal } from './ConfirmActionModal'
import { Search, Filter, Trash2, Lock, UserPlus, X, Loader2, Info, Pencil, Check } from 'lucide-react'
import Image from 'next/image'
import { SortableCard } from './board/SortableCard'
import { DroppableColumn } from './board/DroppableColumn'
import { BoardHeader } from './board/BoardHeader'
import { BoardSearch } from './board/BoardSearch'
import { AddCardModal } from './board/AddCardModal'
import { ReviewModal } from './board/ReviewModal'
import { CardInfoModal } from './board/CardInfoModal'
import { MoveCardModal } from './board/MoveCardModal'

export default function BoardView({ boardId, onDeleted }: { boardId: string | null; onDeleted: () => void }) {
  const { user } = useAuth()
  const { theme, darkMode } = useTheme()

  const [board, setBoard] = useState<Board | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [members, setMembers] = useState<(BoardMember & { profile: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [processingAction, setProcessingAction] = useState(false)

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
  const [moveCardTarget, setMoveCardTarget] = useState<Card | null>(null)

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

    let boardAndMembersLoaded = false
    setLoading(true)

    const fetchBoardAndMembers = async () => {
      const boardSnap = await getDoc(doc(db, 'boards', boardId))
      if (boardSnap.exists()) {
        const boardData = { ...boardSnap.data(), id: boardSnap.id } as Board
        setBoard(boardData)
        setEditedName(boardData.name)
      }

      const membersSnap = await getDocs(query(collection(db, 'boardMembers'), where('board_id', '==', boardId)))
      const memberDocs = membersSnap.docs.map(d => ({ ...d.data(), id: d.id } as BoardMember))
      const profiles = await getDocsByIds<Profile>('users', memberDocs.map(m => m.user_id))
      setMembers(memberDocs.map(m => ({ ...m, profile: profiles[m.user_id] })).filter(m => m.profile) as (BoardMember & { profile: Profile })[])

      boardAndMembersLoaded = true
      setLoading(false)
    }

    fetchBoardAndMembers()

    // Cards stay live via onSnapshot instead of a one-time fetch.
    const unsubscribe = onSnapshot(
      query(collection(db, 'cards'), where('board_id', '==', boardId)),
      (snap) => {
        const cardsData = snap.docs
          .map(d => ({ ...d.data(), id: d.id } as Card))
          .sort((a, b) => a.position - b.position)
        setCards(cardsData)
        if (!boardAndMembersLoaded) setLoading(false)
      }
    )

    return () => { unsubscribe() }
  }, [boardId])

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

    try {
      await updateDoc(doc(db, 'boards', boardId), { name: editedName.trim(), updated_at: nowIso() })
      setBoard(prev => prev ? { ...prev, name: editedName.trim() } : null)
    } catch (err) {
      console.error('Save board name error:', err)
    }

    setSavingName(false)
    setIsEditingName(false)
  }

  const isOwner = !!(board && user && board.owner_id === user.id)

  const handleRequestDeleteOrLeave = () => {
    if (!board) return
    setConfirmAction({ type: isOwner ? 'delete-board' : 'leave-board', name: board.name })
  }

  const handleConfirmDeleteOrLeave = async () => {
    if (!confirmAction || !board || !user) return
    setProcessingAction(true)

    try {
      if (confirmAction.type === 'delete-board') {
        await deleteBoardCascade(board.id)
      } else {
        await leaveBoard(board.id, user.id)
      }
      setConfirmAction(null)
      onDeleted()
    } catch (err) {
      console.error('Delete/leave board error:', err)
      setProcessingAction(false)
    }
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

      const timestamp = nowIso()
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
        created_at: timestamp,
        updated_at: timestamp,
      }

      await addDoc(collection(db, 'cards'), newCard)
    } catch (err: any) {
      console.error('Add card exception:', err)
      alert('Failed to add card: ' + (err.message || ''))
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
    await deleteDoc(doc(db, 'cards', cardId))
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
            await updateDoc(doc(db, 'cards', card.id), { position: card.position, updated_at: nowIso() })
          }
        }
      }
    }
    // Different column - move card
    else {
      await moveCardToColumn(activeCard, targetColumnId)
    }
  }

  const moveCardToColumn = useCallback(async (card: Card, targetColumnId: ColumnId) => {
    if (card.column_id === targetColumnId) return

    // Moving to finished - show review modal instead of moving directly
    if (targetColumnId === 'finished') {
      setReviewCard(card)
      setShowReview(true)
      return
    }

    const targetCards = cards.filter(c => c.column_id === targetColumnId)
    const newPosition = generatePosition(targetCards.map(c => c.position))

    setCards(prev => prev.map(c =>
      c.id === card.id
        ? { ...c, column_id: targetColumnId, position: newPosition }
        : c
    ))

    await updateDoc(doc(db, 'cards', card.id), {
      column_id: targetColumnId,
      position: newPosition,
      updated_at: nowIso(),
    })
  }, [cards])

  const handleReviewSubmit = async () => {
    if (!reviewCard) return
    const targetCards = cards.filter(c => c.column_id === 'finished')
    const newPosition = generatePosition(targetCards.map(c => c.position))

    setCards(prev => prev.map(c => c.id === reviewCard.id ? { ...c, column_id: 'finished', rating: reviewRating, position: newPosition } : c))
    await updateDoc(doc(db, 'cards', reviewCard.id), {
      column_id: 'finished',
      rating: reviewRating,
      position: newPosition,
      updated_at: nowIso(),
    })

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
    <div className="flex-1 p-4 lg:p-6 overflow-auto flex flex-col min-h-0">
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
        isOwner={isOwner}
        onRequestDeleteOrLeave={handleRequestDeleteOrLeave}
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
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 items-stretch flex-1 min-h-0 board:grid board:grid-cols-4 board:overflow-visible board:snap-none board:pb-0">
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
                    onMove={() => setMoveCardTarget(card)}
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

      <MoveCardModal
        open={!!moveCardTarget}
        card={moveCardTarget}
        onClose={() => setMoveCardTarget(null)}
        onSelectColumn={(columnId) => {
          if (moveCardTarget) moveCardToColumn(moveCardTarget, columnId)
          setMoveCardTarget(null)
        }}
        theme={theme}
      />

      {showInvite && boardId && <InviteModal type="board" targetId={boardId} onClose={() => setShowInvite(false)} />}

      <ConfirmActionModal
        action={confirmAction}
        processing={processingAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmDeleteOrLeave}
        theme={theme}
      />
    </div>
  )
}
