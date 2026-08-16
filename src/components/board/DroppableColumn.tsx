import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card } from '@/types';
import type { Theme } from '@/lib/utils';

export interface BoardColumn {
  id: string;
  title: string;
  color: string;
}

interface DroppableColumnProps {
  id: string;
  column: BoardColumn;
  cards: Card[];
  children: ReactNode;
  isOver: boolean;
  theme: Theme;
}

export function DroppableColumn({
  id,
  column,
  cards,
  children,
  isOver,
  theme,
}: DroppableColumnProps) {
  const { setNodeRef, isOver: isOverThis } = useDroppable({
    id,
    data: { type: 'column', columnId: column.id },
  });

  const showHighlight = isOver || isOverThis;

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl p-4 h-full min-h-[400px] overflow-hidden transition-all duration-200 flex flex-col w-[85vw] max-w-[340px] flex-shrink-0 snap-center board:w-auto board:max-w-none board:flex-shrink board:snap-align-none"
      style={{
        backgroundColor: showHighlight ? theme.accent.bg : theme.bg,
        boxShadow: theme.shadow,
        border: showHighlight
          ? `2px solid ${theme.accent.primary}`
          : `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
        <h2 className="font-semibold" style={{ color: theme.text }}>
          {column.title}
        </h2>
        <span
          className="ml-auto text-sm px-2 py-0.5 rounded-full"
          style={{ backgroundColor: theme.bgTertiary, color: theme.textMuted }}
        >
          {cards.length}
        </span>
      </div>

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className={`flex-1 flex flex-col min-h-[200px] overflow-y-auto ${cards.length > 0 ? 'space-y-3 pt-1' : ''}`}>
          {children}
          {cards.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-sm" style={{ color: theme.textMuted }}>
                {showHighlight ? 'Drop here!' : 'Drag items here'}
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

