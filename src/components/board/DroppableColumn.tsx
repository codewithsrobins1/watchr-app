import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card } from '@/types';

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
  theme: any;
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
      className="rounded-xl p-4 min-h-[400px] transition-all duration-200"
      style={{
        backgroundColor: showHighlight ? theme.accent.bg : theme.bgSecondary,
        boxShadow: theme.shadow,
        border: showHighlight
          ? `2px dashed ${theme.accent.primary}`
          : '2px solid transparent',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
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
        <div className="space-y-3 min-h-[200px]">
          {children}
          {cards.length === 0 && (
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center"
              style={{
                borderColor: showHighlight ? theme.accent.primary : theme.border,
              }}
            >
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

