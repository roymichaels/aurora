import React from 'react';
import { useTheme } from 'next-themes';
import { useAppSettings } from '../../src/state/settings.ts';
import VoiceSettings from '../../src/components/settings/VoiceSettings.tsx';

export default function QuickSettingsPanel({ open, onClose }) {
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
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '260px',
        background: 'white',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 1000,
      }}
    >
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Quick Settings</h2>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Voice Controls</h3>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <input type="checkbox" checked={voiceOutput} onChange={toggleVoiceOutput} style={{ marginRight: '8px' }} />
            Voice Output
          </label>
          <div style={{ marginBottom: '12px' }}>
            <VoiceSettings />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Preferences</h3>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <input type="checkbox" checked={isDark} onChange={toggleTheme} style={{ marginRight: '8px' }} />
            Dark Theme
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={toggleNotifications}
              style={{ marginRight: '8px' }}
            />
            Notifications
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <input type="checkbox" checked={hypnosisMode} onChange={toggleHypnosisMode} style={{ marginRight: '8px' }} />
            Hypnosis Mode
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
            <span style={{ marginBottom: '4px' }}>Memory Retention (days): {memoryRetention}</span>
            <input
              type="range"
              min="1"
              max="365"
              value={memoryRetention}
              onChange={(e) => setMemoryRetention(Number(e.target.value))}
            />
          </label>
        </div>

        <button
          onClick={onClose}
          style={{ marginTop: '8px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
