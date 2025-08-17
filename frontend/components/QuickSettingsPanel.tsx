import * as React from 'react';
import { useTheme } from 'next-themes';
import { useAppSettings } from '../../src/state/settings.ts';
import VoiceSettings from '../../src/components/settings/VoiceSettings.tsx';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '../../src/components/ui/sheet.tsx';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function QuickSettingsPanel({ open, onClose }: Props) {
  const {
    voiceOutput,
    hypnosisMode,
    memoryRetention,
    toggleVoiceOutput,
    toggleHypnosisMode,
    setMemoryRetention,
  } = useAppSettings();

  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const toggleNotifications = () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else if (typeof Notification !== 'undefined') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') setNotificationsEnabled(true);
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-64 space-y-4 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Quick Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Voice Controls</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={voiceOutput}
                onChange={toggleVoiceOutput}
              />
              Voice Output
            </label>
            <div>
              <VoiceSettings />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Preferences</h3>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isDark} onChange={toggleTheme} />
              Dark Theme
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={toggleNotifications}
              />
              Notifications
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hypnosisMode}
                onChange={toggleHypnosisMode}
              />
              Hypnosis Mode
            </label>
            <label className="flex flex-col gap-2">
              <span>Memory Retention (days): {memoryRetention}</span>
              <input
                type="range"
                min="1"
                max="365"
                value={memoryRetention}
                onChange={(e) => setMemoryRetention(Number(e.target.value))}
              />
            </label>
          </div>
        </div>
        <SheetClose asChild>
          <button className="mt-2 rounded border border-gray-300 px-2 py-1">
            Close
          </button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
