import type { Board } from '@/types';
import type { ViewType } from '@/app/page';
import { Plus, Trash2, LogOut } from 'lucide-react';

interface BoardsSectionProps {
  loading: boolean;
  myBoards: Board[];
  sharedBoards: Board[];
  currentView: ViewType;
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onCreateBoardClick: () => void;
  onRequestDeleteBoard: (board: Board) => void;
  onRequestLeaveBoard: (board: Board) => void;
  theme: any;
}

export function BoardsSection({
  loading,
  myBoards,
  sharedBoards,
  currentView,
  selectedBoardId,
  onSelectBoard,
  onCreateBoardClick,
  onRequestDeleteBoard,
  onRequestLeaveBoard,
  theme,
}: BoardsSectionProps) {
  return (
    <>
      {/* Create Board */}
      <div className="px-4 mb-4">
        <button
          onClick={onCreateBoardClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white"
          style={{ backgroundColor: theme.accent.primary }}
        >
          <Plus className="w-4 h-4" />
          Create Board
        </button>
      </div>

      {/* My Boards */}
      <div>
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.textMuted }}
        >
          Your Boards
        </span>
        <div className="mt-2 space-y-1">
          {loading ? (
            <p
              className="text-sm px-3 py-2"
              style={{ color: theme.textMuted }}
            >
              Loading...
            </p>
          ) : myBoards.length > 0 ? (
            myBoards.map((board) => (
              <div key={board.id} className="group flex items-center">
                <button
                  onClick={() => onSelectBoard(board.id)}
                  className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor:
                      selectedBoardId === board.id && currentView === 'board'
                        ? theme.accent.bg
                        : 'transparent',
                    color:
                      selectedBoardId === board.id && currentView === 'board'
                        ? theme.accent.primary
                        : theme.textSecondary,
                  }}
                >
                  <span className="text-lg">{board.icon}</span>
                  <span className="flex-1 truncate text-sm font-medium">
                    {board.name}
                  </span>
                </button>
                <button
                  onClick={() => onRequestDeleteBoard(board)}
                  className="p-1.5 rounded-lg hidden group-hover:block hover:bg-red-500/20"
                  title="Delete board"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))
          ) : (
            <p
              className="text-sm px-3 py-2"
              style={{ color: theme.textMuted }}
            >
              No boards yet
            </p>
          )}
        </div>
      </div>

      {/* Shared Boards */}
      {sharedBoards.length > 0 && (
        <div>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: theme.textMuted }}
          >
            Shared Boards
          </span>
          <div className="mt-2 space-y-1">
            {sharedBoards.map((board) => (
              <div key={board.id} className="group flex items-center">
                <button
                  onClick={() => onSelectBoard(board.id)}
                  className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor:
                      selectedBoardId === board.id && currentView === 'board'
                        ? theme.accent.bg
                        : 'transparent',
                    color:
                      selectedBoardId === board.id && currentView === 'board'
                        ? theme.accent.primary
                        : theme.textSecondary,
                  }}
                >
                  <span className="text-lg">{board.icon}</span>
                  <span className="flex-1 truncate text-sm font-medium">
                    {board.name}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: theme.bgTertiary,
                      color: theme.textMuted,
                    }}
                  >
                    Shared
                  </span>
                </button>
                <button
                  onClick={() => onRequestLeaveBoard(board)}
                  className="p-1.5 rounded-lg hidden group-hover:block hover:bg-orange-500/20"
                  title="Leave board"
                >
                  <LogOut className="w-4 h-4 text-orange-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

