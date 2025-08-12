import React from 'react';
import { useAppSettings } from '../../src/state/settings.ts';

export default function SettingsPanel({ open, onClose }) {
  const {
    voiceOutput,
    hypnosisMode,
    memoryRetention,
    toggleVoiceOutput,
    toggleHypnosisMode,
    setMemoryRetention,
  } = useAppSettings();

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
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Settings</h2>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <input type="checkbox" checked={voiceOutput} onChange={toggleVoiceOutput} style={{ marginRight: '8px' }} />
          Voice Output
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
        <button onClick={onClose} style={{ marginTop: '8px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }}>
          Close
        </button>
      </div>
    </div>
  );
}
