/**
 * UserDataView.jsx
 * Dedicated view for Watchlist ("My List") and Watch History.
 * Glassmorphic Neumorphic grid with instant stream, remove, and clear actions.
 */
import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  History,
  Trash2,
  Play,
  Film,
  HardDrive,
  Star,
  Copy,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  getWatchlist,
  removeFromWatchlist,
  clearWatchlist,
  getWatchHistory,
  removeFromWatchHistory,
  clearWatchHistory,
} from '../utils/storage';

export function UserDataView({
  type, // 'watchlist' | 'history'
  onStream,
  onDetails,
  onCopyMagnet,
  onExplore,
}) {
  const [items, setItems] = useState([]);

  const loadData = () => {
    if (type === 'watchlist') {
      setItems(getWatchlist());
    } else {
      setItems(getWatchHistory());
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('ext_storage_update', loadData);
    return () => window.removeEventListener('ext_storage_update', loadData);
  }, [type]);

  const handleClearAll = () => {
    if (type === 'watchlist') {
      clearWatchlist();
    } else {
      clearWatchHistory();
    }
    setItems([]);
  };

  const handleRemoveOne = (id) => {
    if (type === 'watchlist') {
      removeFromWatchlist(id);
    } else {
      removeFromWatchHistory(id);
    }
    loadData();
  };

  const isWatchlist = type === 'watchlist';

  return (
    <div className="user-data-view-container animate-fade-in">
      {/* Header Bar */}
      <div className="user-data-header glass-panel">
        <div className="user-data-title-group">
          <div className="user-data-icon-wrap">
            {isWatchlist ? (
              <Bookmark size={24} color="#f59e0b" fill="#f59e0b" />
            ) : (
              <History size={24} color="#ec4899" />
            )}
          </div>
          <div>
            <h1 className="user-data-title">
              {isWatchlist ? 'My Watchlist' : 'Watch History'}
            </h1>
            <span className="user-data-subtitle">
              {isWatchlist
                ? `${items.length} titles saved to your personal library`
                : `${items.length} titles streamed in your browser`}
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            className="neu-button user-data-clear-btn"
            onClick={handleClearAll}
            title={isWatchlist ? 'Clear entire Watchlist' : 'Clear Watch History'}
          >
            <Trash2 size={16} />
            <span>{isWatchlist ? 'Clear Watchlist' : 'Clear History'}</span>
          </button>
        )}
      </div>

      {/* Content Grid or Empty State */}
      {items.length === 0 ? (
        <div className="user-data-empty-view glass-panel">
          <div className="empty-icon-circle">
            {isWatchlist ? (
              <Bookmark size={44} color="#f59e0b" />
            ) : (
              <History size={44} color="#ec4899" />
            )}
          </div>
          <h2>{isWatchlist ? 'Your Watchlist is Empty' : 'No Watch History Yet'}</h2>
          <p>
            {isWatchlist
              ? 'Bookmark movies, anime, and series to easily stream or download them later.'
              : 'Start watching movies and TV shows to keep track of what you have streamed.'}
          </p>
          <button
            className="neu-button neu-button-primary empty-cta-btn"
            onClick={onExplore}
          >
            <Sparkles size={18} />
            <span>Explore Trending Titles</span>
          </button>
        </div>
      ) : (
        <div className="user-data-grid">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="user-data-card glass-panel">
              {/* Media Poster / Thumbnail */}
              <div
                className="user-data-poster-wrap"
                onClick={() => onDetails && onDetails(item)}
              >
                {item.poster || item.background ? (
                  <img
                    src={item.poster || item.background}
                    alt={item.title}
                    className="user-data-poster-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="user-data-poster-placeholder">
                    <Film size={34} color="var(--text-muted)" />
                  </div>
                )}

                {item.rating && (
                  <span className="user-data-rating-badge">
                    <Star size={11} fill="#f59e0b" color="#f59e0b" /> {item.rating}
                  </span>
                )}

                <div className="user-data-hover-overlay">
                  <button
                    className="user-data-play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStream(item);
                    }}
                    title="Stream Now"
                  >
                    <Play size={22} fill="#ffffff" />
                  </button>
                </div>
              </div>

              {/* Body Info */}
              <div className="user-data-card-body">
                <h3
                  className="user-data-card-title"
                  title={item.title}
                  onClick={() => onDetails && onDetails(item)}
                >
                  {item.title}
                </h3>

                <div className="user-data-card-meta">
                  {item.year && <span className="meta-pill">{item.year}</span>}
                  {item.size && (
                    <span className="meta-pill">
                      <HardDrive size={11} /> {item.size}
                    </span>
                  )}
                  {!isWatchlist && item.watchedAt && (
                    <span className="meta-pill meta-time">
                      <Clock size={11} />{' '}
                      {new Date(item.watchedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="user-data-actions-row">
                  <button
                    className="neu-button user-data-action-play"
                    onClick={() => onStream(item)}
                  >
                    <Play size={15} fill="#ffffff" />
                    <span>Stream</span>
                  </button>

                  {item.magnet && (
                    <button
                      className="neu-button user-data-action-copy"
                      onClick={() => onCopyMagnet(item.magnet, 'Magnet link copied!')}
                      title="Copy Magnet Link"
                    >
                      <Copy size={14} />
                    </button>
                  )}

                  <button
                    className="neu-button user-data-action-del"
                    onClick={() => handleRemoveOne(item.id || item.title)}
                    title={isWatchlist ? 'Remove from Watchlist' : 'Remove from History'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDataView;