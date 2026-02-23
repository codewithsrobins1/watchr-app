'use client';

import { useState } from 'react';
import { useAuth, useTheme } from '@/hooks';
import { createClient } from '@/lib/supabase/client';
import { BOARD_ICONS } from '@/lib/utils';
import type { Board } from '@/types';
import { X, Loader2 } from 'lucide-react';

interface CreateBoardModalProps {
  onClose: () => void;
  onCreated: (board: Board) => void;
}

export default function CreateBoardModal({
  onClose,
  onCreated,
}: CreateBoardModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📺');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setLoading(true);
    setError('');

    try {
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({ name: name.trim(), icon, owner_id: user.id })
        .select()
        .single();

      if (boardError) {
        console.error('Create board error:', boardError);
        setError(boardError.message);
        setLoading(false);
        return;
      }

      await supabase.from('board_members').insert({
        board_id: board.id,
        user_id: user.id,
        role: 'owner',
      });

      onCreated(board);
      onClose();
    } catch (err) {
      console.error('Create board exception:', err);
      setError('Failed to create board');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 modal-overlay"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 sm:p-6 modal-content max-h-[90vh] overflow-auto"
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl sm:text-xl font-bold"
            style={{ color: theme.text }}
          >
            Create New Board
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white btn-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textSecondary }}
            >
              Board Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Board"
              required
              disabled={loading}
              className="w-full px-4 py-4 rounded-xl outline-none transition-all focus:ring-2 disabled:opacity-50 text-base"
              style={{
                backgroundColor: theme.bgTertiary,
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: theme.textSecondary }}
            >
              Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {BOARD_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  disabled={loading}
                  className="aspect-square rounded-xl text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
                  style={{
                    backgroundColor:
                      icon === emoji ? theme.accent.bg : theme.bgTertiary,
                    border: `2px solid ${icon === emoji ? theme.accent.primary : 'transparent'}`,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 rounded-xl font-medium btn-hover disabled:opacity-50 text-base"
              style={{
                backgroundColor: theme.bgTertiary,
                color: theme.textSecondary,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-4 rounded-xl font-medium text-white btn-hover disabled:opacity-50 flex items-center justify-center gap-2 text-base"
              style={{ backgroundColor: theme.accent.primary }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 spinner" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
