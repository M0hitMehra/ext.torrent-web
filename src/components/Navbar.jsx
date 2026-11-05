/**
 * Navbar.jsx
 * Netflix-style Glassmorphic Top Navigation Header.
 * Features:
 *  - Logo with gradient brand glow
 *  - Category & view links
 *  - Expandable search with history dropdown
 *  - Live backend connection health indicator
 *  - Day / Dark mode switcher
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Search,
  Sun,
  Moon,
  Sparkles,
  Clapperboard,
  Tv,
  Flame,
  Clock,
  X,
  History,
  Activity,
  Menu,
  Bookmark,
  Settings,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getSearchHistory, removeSearchQuery } from '../utils/history';
import { checkBackendHealth } from '../api/torrentApi';

export function Navbar({ activeTab, onSelectTab, onSearch, currentQuery, onOpenSettings }) {
  const { isDark, toggleTheme } = useTheme();
  const [searchInput, setSearchInput] = useState(currentQuery || '');
  const [searchFocused, setSearchFocused] = useState(false);
  const [history, setHistory] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    setSearchInput(currentQuery || '');
  }, [currentQuery]);

  // Load search history
  useEffect(() => {
    setHistory(getSearchHistory());
  }, [searchFocused]);

  // Ping backend on mount
  useEffect(() => {
    checkBackendHealth().then((res) => {
      setBackendStatus(res.ok ? 'online' : 'offline');
    });
  }, []);

  // Handle clicking outside of search dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      setSearchFocused(false);
      setMobileMenuOpen(false);
    }
  };

  const handleSelectHistory = (query) => {
    setSearchInput(query);
    onSearch(query);
    setSearchFocused(false);
    setMobileMenuOpen(false);
  };

  const handleRemoveHistory = (e, query) => {
    e.stopPropagation();
    const updated = removeSearchQuery(query);
    setHistory(updated);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => onSelectTab('home')}>
          <div className="brand-icon-wrap">
            <Film className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-name">EXT<span className="gradient-text">TORRENT</span></span>
            <span className="brand-sub">GLASS CINEMA</span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="nav-links">
          <button
            className={`nav-link-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => onSelectTab('home')}
          >
            <Sparkles size={16} /> Home
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => onSelectTab('movies')}
          >
            <Clapperboard size={16} /> Movies
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'tv' ? 'active' : ''}`}
            onClick={() => onSelectTab('tv')}
          >
            <Tv size={16} /> TV Shows
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => onSelectTab('trending')}
          >
            <Flame size={16} /> Trending
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'latest' ? 'active' : ''}`}
            onClick={() => onSelectTab('latest')}
          >
            <Clock size={16} /> Latest
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => onSelectTab('watchlist')}
          >
            <Bookmark size={16} /> Watchlist
          </button>
          <button
            className={`nav-link-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => onSelectTab('history')}
          >
            <History size={16} /> History
          </button>
        </nav>

        {/* Right Actions: Search + Day/Dark Toggle + Status */}
        <div className="navbar-actions">
          {/* Search Box with History Dropdown */}
          <div className="search-wrap" ref={searchBoxRef}>
            <form onSubmit={handleSearchSubmit} className="search-form neu-inset">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search movies, series, 4K..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="search-input"
              />
              {searchInput && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchInput('')}
                >
                  <X size={15} />
                </button>
              )}
            </form>

            {/* Search History Dropdown */}
            {searchFocused && history.length > 0 && (
              <div className="search-dropdown glass-panel animate-fade-in">
                <div className="dropdown-header">
                  <span className="dropdown-title">
                    <History size={14} /> Recent Searches
                  </span>
                </div>
                <div className="history-items-list">
                  {history.map((q, idx) => (
                    <div
                      key={idx}
                      className="history-item"
                      onClick={() => handleSelectHistory(q)}
                    >
                      <span className="history-query">{q}</span>
                      <button
                        className="history-del-btn"
                        onClick={(e) => handleRemoveHistory(e, q)}
                        title="Remove"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Backend Health Pill */}
          <div
            className={`status-pill ${backendStatus}`}
            title={`Backend Gateway: ${backendStatus.toUpperCase()}`}
          >
            <span className="status-dot"></span>
            <span className="status-label">
              {backendStatus === 'online' ? 'API LIVE' : backendStatus === 'checking' ? 'CONNECTING' : 'OFFLINE'}
            </span>
          </div>

          {/* Day / Dark Mode Switcher */}
          <button
            className="theme-toggle-btn neu-button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Day Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} className="sun-icon" /> : <Moon size={18} className="moon-icon" />}
          </button>

          {/* Settings & Storage Trigger */}
          <button
            className="settings-trigger-btn neu-button"
            onClick={onOpenSettings}
            title="Settings & Storage Data"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            className="mobile-menu-btn neu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer glass-panel animate-fade-in">
          <nav className="mobile-nav-links">
            <button
              className={`mobile-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => { onSelectTab('home'); setMobileMenuOpen(false); }}
            >
              <Sparkles size={18} /> Home
            </button>
            <button
              className={`mobile-nav-btn ${activeTab === 'movies' ? 'active' : ''}`}
              onClick={() => { onSelectTab('movies'); setMobileMenuOpen(false); }}
            >
              <Clapperboard size={18} /> Movies
            </button>
            <button
              className={`mobile-nav-btn ${activeTab === 'tv' ? 'active' : ''}`}
              onClick={() => { onSelectTab('tv'); setMobileMenuOpen(false); }}
            >
              <Tv size={18} /> TV Series
            </button>
            <button
              className={`mobile-nav-btn ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => { onSelectTab('trending'); setMobileMenuOpen(false); }}
            >
              <Flame size={18} /> Trending
            </button>
            <button
              className={`mobile-nav-btn ${activeTab === 'latest' ? 'active' : ''}`}
              onClick={() => { onSelectTab('latest'); setMobileMenuOpen(false); }}
            >
              <Clock size={18} /> Latest
            </button>
            <button
              className={`mobile-nav-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => { onSelectTab('watchlist'); setMobileMenuOpen(false); }}
            >
              <Bookmark size={18} /> Watchlist
            </button>
            <button
              className={`mobile-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { onSelectTab('history'); setMobileMenuOpen(false); }}
            >
              <History size={18} /> Watch History
            </button>
            <button
              className="mobile-nav-btn"
              onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }}
            >
              <Settings size={18} /> Settings & Storage
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
