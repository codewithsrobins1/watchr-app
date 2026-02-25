import type { Profile } from '@/types';
import type { ViewType } from '@/app/page';
import { Bell, Settings, Sun, Moon, LogOut } from 'lucide-react';

interface FooterSectionProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  pendingCount: number;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  profile: Profile | null;
  user: { email?: string | null } | null;
  onSignOut: () => void;
  onOpenNotifications: () => void;
  theme: any;
}

export function FooterSection({
  currentView,
  onChangeView,
  pendingCount,
  darkMode,
  setDarkMode,
  profile,
  user,
  onSignOut,
  onOpenNotifications,
  theme,
}: FooterSectionProps) {
  const displayName =
    profile?.username || user?.email?.split('@')[0] || 'User';

  return (
    <div
      className="p-3 sm:pb-4 space-y-2 flex-shrink-0"
      style={{ borderTop: `1px solid ${theme.border}` }}
    >
      {/* Notifications */}
      <button
        onClick={onOpenNotifications}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative"
        style={{
          backgroundColor: 'transparent',
          color: theme.textSecondary,
        }}
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </div>
        <span className="text-sm font-medium">Notifications</span>
        {pendingCount > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">
            {pendingCount} new
          </span>
        )}
      </button>

      {/* Settings */}
      <button
        onClick={() => onChangeView('settings')}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
        style={{
          backgroundColor:
            currentView === 'settings' ? theme.accent.bg : 'transparent',
          color:
            currentView === 'settings'
              ? theme.accent.primary
              : theme.textSecondary,
        }}
      >
        <Settings className="w-5 h-5" />
        <span className="text-sm font-medium">Settings</span>
      </button>

      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between px-3 py-2">
        <div
          className="flex items-center gap-3"
          style={{ color: theme.textSecondary }}
        >
          {darkMode ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">
            {darkMode ? 'Dark' : 'Light'}
          </span>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-6 rounded-full relative transition-all"
          style={{
            backgroundColor: darkMode
              ? theme.accent.primary
              : theme.bgTertiary,
          }}
        >
          <div
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
            style={{ left: darkMode ? 'calc(100% - 20px)' : '4px' }}
          />
        </button>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{
            backgroundColor: theme.accent.bg,
            border: `2px solid ${theme.accent.primary}`,
          }}
        >
          {profile?.avatar_emoji || '😎'}
        </div>
        <span
          className="flex-1 text-sm font-medium truncate"
          style={{ color: theme.text }}
        >
          {displayName}
        </span>
        <button
          onClick={onSignOut}
          className="p-2 rounded-lg transition-all hover:bg-red-500/10"
          style={{ color: theme.textMuted }}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

