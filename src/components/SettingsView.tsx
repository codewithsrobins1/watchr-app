'use client'

import { useState } from 'react'
import { useAuth, useTheme } from '@/hooks'
import { ACCENT_COLORS, AVATAR_OPTIONS } from '@/lib/utils'
import type { AccentColor } from '@/types'
import { Check, Loader2 } from 'lucide-react'

export default function SettingsView() {
  const { profile, updateProfile } = useAuth()
  const { theme, darkMode, setDarkMode, accentColor, setAccentColor } = useTheme()

  const [username, setUsername] = useState(profile?.username || '')
  const [avatar, setAvatar] = useState(profile?.avatar_emoji || '😎')
  const [showAvatars, setShowAvatars] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    if (!username.trim()) return
    setSaving(true)
    setMessage('')

    const { error } = await updateProfile({ username: username.trim(), avatar_emoji: avatar })
    
    if (error) {
      setMessage(`Error: ${error}`)
    } else {
      setMessage('Profile saved!')
    }

    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8" style={{ color: theme.text }}>Settings</h1>

        {/* Profile */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: theme.text }}>Profile</h2>

          {/* Avatar */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <button
                onClick={() => setShowAvatars(!showAvatars)}
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-transform hover:scale-105"
                style={{ backgroundColor: theme.accent.bg, border: `3px solid ${theme.accent.primary}` }}
              >
                {avatar}
              </button>

              {showAvatars && (
                <div className="absolute top-full left-0 mt-2 p-4 rounded-xl z-50 w-56 modal-content" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, boxShadow: theme.shadowHeavy }}>
                  <p className="text-xs font-medium mb-3" style={{ color: theme.textMuted }}>Choose an avatar</p>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => { setAvatar(emoji); setShowAvatars(false) }}
                        className="w-10 h-10 rounded-xl text-xl transition-all hover:scale-110 flex items-center justify-center"
                        style={{ 
                          backgroundColor: avatar === emoji ? theme.accent.bg : theme.bgTertiary,
                          border: avatar === emoji ? `2px solid ${theme.accent.primary}` : '2px solid transparent'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <button onClick={() => setShowAvatars(!showAvatars)} className="px-4 py-2 rounded-xl text-sm font-medium btn-hover" style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}>
                Change Avatar
              </button>
              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Choose from 12 avatars</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
                style={{ backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}`, color: theme.text }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl outline-none opacity-60 cursor-not-allowed"
                style={{ backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}`, color: theme.textSecondary }}
              />
              <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
          <h2 className="text-lg font-semibold mb-6" style={{ color: theme.text }}>Appearance</h2>

          {/* Dark Mode */}
          <div className="flex items-center justify-between mb-6 pb-6" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div>
              <div className="font-medium" style={{ color: theme.text }}>Dark Mode</div>
              <div className="text-sm" style={{ color: theme.textMuted }}>Use dark theme across the app</div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-14 h-8 rounded-full relative transition-all"
              style={{ backgroundColor: darkMode ? theme.accent.primary : theme.bgTertiary }}
            >
              <div className="absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all" style={{ left: darkMode ? 'calc(100% - 28px)' : '4px' }} />
            </button>
          </div>

          {/* Accent Color */}
          <div>
            <div className="font-medium mb-2" style={{ color: theme.text }}>Accent Color</div>
            <div className="text-sm mb-4" style={{ color: theme.textMuted }}>Choose your personal color theme</div>
            
            <div className="flex gap-3 flex-wrap">
              {(Object.keys(ACCENT_COLORS) as AccentColor[]).map(colorName => (
                <button
                  key={colorName}
                  onClick={() => setAccentColor(colorName)}
                  className="w-10 h-10 rounded-full transition-all relative btn-hover"
                  style={{ 
                    backgroundColor: ACCENT_COLORS[colorName].primary,
                    transform: accentColor === colorName ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: accentColor === colorName ? `0 0 0 3px ${theme.bg}, 0 0 0 5px ${ACCENT_COLORS[colorName].primary}` : 'none'
                  }}
                >
                  {accentColor === colorName && <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button - Moved to bottom */}
        {message && (
          <p className={`text-sm font-medium mb-4 ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 rounded-xl font-medium text-white btn-hover disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.accent.primary }}
        >
          {saving ? <><Loader2 className="w-4 h-4 spinner" />Saving...</> : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
