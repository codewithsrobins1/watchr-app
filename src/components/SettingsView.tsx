'use client'

import { useState } from 'react'
import { useAuth, useTheme } from '@/hooks'
import { Loader2 } from 'lucide-react'
import { ProfileSettings } from './settings/ProfileSettings'
import { AppearanceSettings } from './settings/AppearanceSettings'

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

        <ProfileSettings
          username={username}
          onChangeUsername={setUsername}
          email={profile?.email || ''}
          avatar={avatar}
          onChangeAvatar={(value) => {
            setAvatar(value)
            setShowAvatars(false)
          }}
          showAvatars={showAvatars}
          setShowAvatars={setShowAvatars}
          theme={theme}
        />

        <AppearanceSettings
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          theme={theme}
        />

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
