'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, useTheme } from '@/hooks'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const { theme, darkMode, setDarkMode } = useTheme()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Watchr"
            width={160}
            height={40}
            className="mx-auto mb-3"
            priority
          />
          <p style={{ color: theme.textSecondary }}>Track shows with friends</p>
        </div>

        {/* Form */}
        <div 
          className="rounded-2xl p-8"
          style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, boxShadow: theme.shadowHeavy }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: theme.text }}>Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2 disabled:opacity-50"
                style={{ backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}`, color: theme.text }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 rounded-xl outline-none transition-all focus:ring-2 disabled:opacity-50"
                  style={{ backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}`, color: theme.text }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: theme.textMuted }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white btn-hover flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ backgroundColor: theme.accent.primary }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: theme.textMuted }}>
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: theme.accent.primary }}>
              Sign up
            </Link>
          </p>
        </div>

        {/* Theme toggle */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm px-4 py-2 rounded-full btn-hover"
            style={{ backgroundColor: theme.bgSecondary, color: theme.textSecondary, border: `1px solid ${theme.border}` }}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>
    </div>
  )
}
