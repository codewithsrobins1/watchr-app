import { AVATAR_OPTIONS } from '@/lib/utils';

interface ProfileSettingsProps {
  username: string;
  onChangeUsername: (value: string) => void;
  email: string;
  avatar: string;
  onChangeAvatar: (value: string) => void;
  showAvatars: boolean;
  setShowAvatars: (open: boolean) => void;
  theme: any;
}

export function ProfileSettings({
  username,
  onChangeUsername,
  email,
  avatar,
  onChangeAvatar,
  showAvatars,
  setShowAvatars,
  theme,
}: ProfileSettingsProps) {
  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      <h2 className="text-lg font-semibold mb-6" style={{ color: theme.text }}>
        Profile
      </h2>

      {/* Avatar */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative">
          <button
            onClick={() => setShowAvatars(!showAvatars)}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-transform hover:scale-105"
            style={{
              backgroundColor: theme.accent.bg,
              border: `3px solid ${theme.accent.primary}`,
            }}
          >
            {avatar}
          </button>

          {showAvatars && (
            <div
              className="absolute top-full left-0 mt-2 p-4 rounded-xl z-50 w-56 modal-content"
              style={{
                backgroundColor: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                boxShadow: theme.shadowHeavy,
              }}
            >
              <p
                className="text-xs font-medium mb-3"
                style={{ color: theme.textMuted }}
              >
                Choose an avatar
              </p>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onChangeAvatar(emoji);
                    }}
                    className="w-10 h-10 rounded-xl text-xl transition-all hover:scale-110 flex items-center justify-center"
                    style={{
                      backgroundColor:
                        avatar === emoji ? theme.accent.bg : theme.bgTertiary,
                      border:
                        avatar === emoji
                          ? `2px solid ${theme.accent.primary}`
                          : '2px solid transparent',
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
          <button
            onClick={() => setShowAvatars(!showAvatars)}
            className="px-4 py-2 rounded-xl text-sm font-medium btn-hover"
            style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
          >
            Change Avatar
          </button>
          <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
            Choose from 12 avatars
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: theme.textSecondary }}
          >
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => onChangeUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
            style={{
              backgroundColor: theme.bgTertiary,
              border: `1px solid ${theme.border}`,
              color: theme.text,
            }}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: theme.textSecondary }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 rounded-xl outline-none opacity-60 cursor-not-allowed"
            style={{
              backgroundColor: theme.bgTertiary,
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
            }}
          />
          <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
            Email cannot be changed
          </p>
        </div>
      </div>
    </div>
  );
}

