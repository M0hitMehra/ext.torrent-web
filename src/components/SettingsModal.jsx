/**
 * SettingsModal.jsx
 * Glassmorphic & Neumorphic Settings Dialog.
 * Provides granular storage control, "Clear All Data" master action,
 * player preferences, and appearance controls.
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Trash2,
  AlertTriangle,
  Check,
  HardDrive,
  History,
  Bookmark,
  Search,
  Zap,
  Moon,
  Sun,
  Server,
  Film,
  RefreshCw,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import {
  getStorageSummary,
  clearSearchHistory,
  clearWatchHistory,
  clearWatchlist,
  clearAllUserData,
  getUserPreferences,
  saveUserPreferences,
} from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { checkBackendHealth } from '../api/torrentApi';

export function SettingsModal({ visible, onClose, onDataCleared }) {
  const { isDark, toggleTheme } = useTheme();
  const [summary, setSummary] = useState(getStorageSummary());
  const [prefs, setPrefs] = useState(getUserPreferences());
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearedMsg, setClearedMsg] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  const refreshStats = () => {
    setSummary(getStorageSummary());
    setPrefs(getUserPreferences());
  };

  useEffect(() => {
    if (visible) {
      refreshStats();
      setConfirmClearAll(false);
      setClearedMsg(null);
      checkBackendHealth().then((res) => setBackendStatus(res.ok ? 'online' : 'offline'));
    }
  }, [visible]);

  if (!visible) return null;

  const showTempMessage = (msg) => {
    setClearedMsg(msg);
    refreshStats();
    if (onDataCleared) onDataCleared(msg);
    setTimeout(() => setClearedMsg(null), 3000);
  };

  const handleClearSearches = () => {
    clearSearchHistory();
    showTempMessage('Search history cleared.');
  };

  const handleClearHistory = () => {
    clearWatchHistory();
    showTempMessage('Watch history cleared.');
  };

  const handleClearWatchlist = () => {
    clearWatchlist();
    showTempMessage('Watchlist cleared.');
  };

  const handleClearAll = () => {
    clearAllUserData();
    setConfirmClearAll(false);
    showTempMessage('All local storage data has been cleared.');
  };

  const handlePlayerChange = (player) => {
    const updated = saveUserPreferences({ defaultPlayer: player });
    setPrefs(updated);
  };

  const handleToggleAutoCopy = () => {
    const updated = saveUserPreferences({ autoCopyMagnet: !prefs.autoCopyMagnet });
    setPrefs(updated);
  };

  return (
    <div className="settings-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="settings-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-title">
            <div className="settings-icon-bubble">
              <Settings size={22} className="spin-hover" />
            </div>
            <div>
              <h2 className="settings-heading">Settings & Storage</h2>
              <span className="settings-subheading">Personalize player behavior and manage device data</span>
            </div>
          </div>
          <button className="settings-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Temporary Notification Banner */}
        {clearedMsg && (
          <div className="settings-notice-banner animate-fade-in">
            <Check size={16} color="#10b981" />
            <span>{clearedMsg}</span>
          </div>
        )}

        <div className="settings-body-scroll">
          {/* Section 1: Storage Management */}
          <div className="settings-section">
            <div className="settings-section-head">
              <HardDrive size={18} color="var(--accent-primary)" />
              <h3>Local Storage & User Data</h3>
            </div>
            <p className="settings-section-desc">
              Search history, watch history, and saved watchlist are stored privately in your browser's local storage.
            </p>

            <div className="storage-stats-grid">
              {/* Searches Stat Card */}
              <div className="storage-stat-card neu-inset">
                <div className="stat-card-top">
                  <Search size={16} color="var(--accent-primary)" />
                  <span className="stat-count">{summary.searchCount}</span>
                </div>
                <span className="stat-label">Saved Searches</span>
                <button
                  className="stat-action-btn"
                  onClick={handleClearSearches}
                  disabled={summary.searchCount === 0}
                >
                  Clear Searches
                </button>
              </div>

              {/* Watch History Stat Card */}
              <div className="storage-stat-card neu-inset">
                <div className="stat-card-top">
                  <History size={16} color="#ec4899" />
                  <span className="stat-count">{summary.watchCount}</span>
                </div>
                <span className="stat-label">Watch History</span>
                <button
                  className="stat-action-btn"
                  onClick={handleClearHistory}
                  disabled={summary.watchCount === 0}
                >
                  Clear History
                </button>
              </div>

              {/* Watchlist Stat Card */}
              <div className="storage-stat-card neu-inset">
                <div className="stat-card-top">
                  <Bookmark size={16} color="#f59e0b" />
                  <span className="stat-count">{summary.watchlistCount}</span>
                </div>
                <span className="stat-label">My Watchlist</span>
                <button
                  className="stat-action-btn"
                  onClick={handleClearWatchlist}
                  disabled={summary.watchlistCount === 0}
                >
                  Clear Watchlist
                </button>
              </div>
            </div>

            {/* Clear All Data Master Button */}
            <div className="clear-all-data-wrap">
              {!confirmClearAll ? (
                <button
                  className="neu-button clear-all-master-btn"
                  onClick={() => setConfirmClearAll(true)}
                  disabled={summary.totalItems === 0}
                >
                  <Trash2 size={16} />
                  <span>CLEAR ALL DATA</span>
                </button>
              ) : (
                <div className="confirm-clear-box glass-panel animate-fade-in">
                  <div className="confirm-clear-icon">
                    <AlertTriangle size={22} color="#ef4444" />
                  </div>
                  <div className="confirm-clear-text">
                    <strong>Are you sure?</strong>
                    <p>This will permanently erase all search history, watch history, and watchlist bookmarks from this browser.</p>
                  </div>
                  <div className="confirm-clear-actions">
                    <button
                      className="confirm-cancel-btn"
                      onClick={() => setConfirmClearAll(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="confirm-delete-btn"
                      onClick={handleClearAll}
                    >
                      Yes, Clear Everything
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Playback & Streaming Preferences */}
          <div className="settings-section">
            <div className="settings-section-head">
              <Zap size={18} color="#ec4899" />
              <h3>Streaming Preferences</h3>
            </div>
            <div className="settings-control-row">
              <div className="control-info">
                <span className="control-title">Preferred Streaming Player</span>
                <span className="control-desc">Default engine used when launching direct video streams</span>
              </div>
              <div className="player-pills-selector">
                <button
                  className={`player-pref-pill ${prefs.defaultPlayer === 'instant' ? 'active' : ''}`}
                  onClick={() => handlePlayerChange('instant')}
                >
                  Instant Cinema (1080p)
                </button>
                <button
                  className={`player-pref-pill ${prefs.defaultPlayer === 'webtorrent' ? 'active' : ''}`}
                  onClick={() => handlePlayerChange('webtorrent')}
                >
                  WebTorrent P2P
                </button>
                <button
                  className={`player-pref-pill ${prefs.defaultPlayer === 'vlc' ? 'active' : ''}`}
                  onClick={() => handlePlayerChange('vlc')}
                >
                  VLC App
                </button>
              </div>
            </div>

            <div className="settings-control-row">
              <div className="control-info">
                <span className="control-title">Auto-Copy Magnet Link</span>
                <span className="control-desc">Automatically copy magnet URI to clipboard on play / stream start</span>
              </div>
              <button
                className={`neu-button toggle-pill-btn ${prefs.autoCopyMagnet ? 'on' : 'off'}`}
                onClick={handleToggleAutoCopy}
              >
                {prefs.autoCopyMagnet ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Section 3: Appearance */}
          <div className="settings-section">
            <div className="settings-section-head">
              {isDark ? <Moon size={18} color="#6366f1" /> : <Sun size={18} color="#f59e0b" />}
              <h3>Theme & UI Appearance</h3>
            </div>
            <div className="settings-control-row">
              <div className="control-info">
                <span className="control-title">Display Mode</span>
                <span className="control-desc">Toggle between Netflix Dark Cinema and Day Frosted Glass</span>
              </div>
              <button
                className="neu-button theme-switch-action-btn"
                onClick={toggleTheme}
              >
                {isDark ? (
                  <>
                    <Sun size={16} color="#f59e0b" />
                    <span>Switch to Day Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} color="#6366f1" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 4: Backend API Status */}
          <div className="settings-section">
            <div className="settings-section-head">
              <Server size={18} color="var(--text-muted)" />
              <h3>API Gateway Health</h3>
            </div>
            <div className="backend-info-tile neu-inset">
              <div className="backend-url-text">
                <ShieldCheck size={16} color="#10b981" />
                <span>Gateway: https://ext-torrent-backend.onrender.com</span>
              </div>
              <span className={`backend-status-tag ${backendStatus}`}>
                {backendStatus === 'online' ? '● LIVE / 0 RATE LIMITS' : '● CONNECTING...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;