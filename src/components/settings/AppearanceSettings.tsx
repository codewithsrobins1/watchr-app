import { ACCENT_COLORS } from '@/lib/utils';
import type { AccentColor } from '@/types';
import { Check } from 'lucide-react';

interface AppearanceSettingsProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  accentColor: AccentColor;
  setAccentColor: (value: AccentColor) => void;
  theme: any;
}

export function AppearanceSettings({
  darkMode,
  setDarkMode,
  accentColor,
  setAccentColor,
  theme,
}: AppearanceSettingsProps) {
  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
    >
      <h2 className="text-lg font-semibold mb-6" style={{ color: theme.text }}>
        Appearance
      </h2>

      {/* Dark Mode */}
      <div
        className="flex items-center justify-between mb-6 pb-6"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div>
          <div className="font-medium" style={{ color: theme.text }}>
            Dark Mode
          </div>
          <div className="text-sm" style={{ color: theme.textMuted }}>
            Use dark theme across the app
          </div>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-14 h-8 rounded-full relative transition-all"
          style={{
            backgroundColor: darkMode ? theme.accent.primary : theme.bgTertiary,
          }}
        >
          <div
            className="absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all"
            style={{ left: darkMode ? 'calc(100% - 28px)' : '4px' }}
          />
        </button>
      </div>

      {/* Accent Color */}
      <div>
        <div className="font-medium mb-2" style={{ color: theme.text }}>
          Accent Color
        </div>
        <div className="text-sm mb-4" style={{ color: theme.textMuted }}>
          Choose your personal color theme
        </div>

        <div className="flex gap-3 flex-wrap">
          {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((colorName) => (
            <button
              key={colorName}
              onClick={() => setAccentColor(colorName)}
              className="w-10 h-10 rounded-full transition-all relative btn-hover"
              style={{
                backgroundColor: ACCENT_COLORS[colorName].primary,
                transform: accentColor === colorName ? 'scale(1.15)' : 'scale(1)',
                boxShadow:
                  accentColor === colorName
                    ? `0 0 0 3px ${theme.bg}, 0 0 0 5px ${ACCENT_COLORS[colorName].primary}`
                    : 'none',
              }}
            >
              {accentColor === colorName && (
                <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

