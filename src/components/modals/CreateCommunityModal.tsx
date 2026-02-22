'use client'

import { useState } from 'react'
import { useAuth, useTheme } from '@/hooks'
import { createClient } from '@/lib/supabase/client'
import { COMMUNITY_ICONS } from '@/lib/utils'
import type { Community } from '@/types'
import { X, Loader2 } from 'lucide-react'

interface CreateCommunityModalProps {
  onClose: () => void
  onCreated: (community: Community) => void
}

export default function CreateCommunityModal({ onClose, onCreated }: CreateCommunityModalProps) {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('👥')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !profile) return

    setLoading(true)
    setError('')

    try {
      const { data: community, error: commError } = await supabase
        .from('communities')
        .insert({ name: name.trim(), icon, owner_id: profile.id })
        .select()
        .single()

      if (commError) {
        console.error('Create community error:', commError)
        setError(commError.message)
        setLoading(false)
        return
      }

      await supabase.from('community_members').insert({
        community_id: community.id,
        user_id: profile.id,
        role: 'owner'
      })

      onCreated(community)
      onClose()
    } catch (err) {
      console.error('Create community exception:', err)
      setError('Failed to create community')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 modal-overlay" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl p-6 modal-content"
        style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: theme.text }}>Create New Community</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white btn-hover">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Community Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Friend Group"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2 disabled:opacity-50"
              style={{ backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}`, color: theme.text }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Icon</label>
            <div className="flex gap-2 flex-wrap">
              {COMMUNITY_ICONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  disabled={loading}
                  className="w-10 h-10 rounded-xl text-xl transition-all hover:scale-110 flex items-center justify-center disabled:opacity-50"
                  style={{ 
                    backgroundColor: icon === emoji ? theme.accent.bg : theme.bgTertiary,
                    border: `2px solid ${icon === emoji ? theme.accent.primary : 'transparent'}`
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-medium btn-hover disabled:opacity-50"
              style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-3 rounded-xl font-medium text-white btn-hover disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.accent.primary }}
            >
              {loading ? <><Loader2 className="w-4 h-4 spinner" />Creating...</> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
