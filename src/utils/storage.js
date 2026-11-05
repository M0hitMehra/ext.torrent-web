/**
 * storage.js
 * Comprehensive LocalStorage manager for ExtTorrent Web.
 * Persistently stores and synchronizes:
 *  1. Search History (recent queries with timestamps)
 *  2. Watch History (streamed movies & episodes with poster & timestamp)
 *  3. Watchlist ("My List" bookmarked torrents and movies)
 *  4. User Preferences & Settings (default player, auto-copy magnet, etc.)
 * Provides single-click "Clear All Data" and granular clearing with real-time UI events.
 */

const KEYS = {
  SEARCH_HISTORY: 'ext_torrent_search_history',
  WATCH_HISTORY: 'ext_torrent_watch_history',
  WATCHLIST: 'ext_torrent_watchlist',
  USER_PREFS: 'ext_torrent_user_prefs',
};

const MAX_SEARCH_HISTORY = 20;
const MAX_WATCH_HISTORY = 50;

function dispatchStorageEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ext_storage_update'));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Search History
// ─────────────────────────────────────────────────────────────────────────────
export function getSearchHistory() {
  try {
    const raw = localStorage.getItem(KEYS.SEARCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function addSearchQuery(query) {
  if (!query || !query.trim()) return getSearchHistory();
  const trimmed = query.trim();
  const current = getSearchHistory().filter(q => q.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...current].slice(0, MAX_SEARCH_HISTORY);
  try {
    localStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(updated));
    dispatchStorageEvent();
  } catch (_) {}
  return updated;
}

export function removeSearchQuery(query) {
  const current = getSearchHistory().filter(q => q.toLowerCase() !== query.toLowerCase());
  try {
    localStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(current));
    dispatchStorageEvent();
  } catch (_) {}
  return current;
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(KEYS.SEARCH_HISTORY);
    dispatchStorageEvent();
  } catch (_) {}
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Watch History
// ─────────────────────────────────────────────────────────────────────────────
export function getWatchHistory() {
  try {
    const raw = localStorage.getItem(KEYS.WATCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function addToWatchHistory(torrent, meta = {}) {
  if (!torrent || (!torrent.title && !meta?.title)) return getWatchHistory();

  const id = torrent.id || torrent.infoHash || torrent.title;
  const current = getWatchHistory().filter(item => (item.id || item.title) !== id);

  const entry = {
    id,
    title: meta?.title || meta?.name || torrent.title,
    rawTitle: torrent.title,
    category: torrent.category || meta?.type || 'movie',
    size: torrent.size || null,
    seeders: torrent.seeders || 0,
    magnet: torrent.magnet || null,
    poster: meta?.poster || meta?.background || null,
    background: meta?.background || null,
    year: meta?.year || null,
    rating: meta?.rating || null,
    director: meta?.director || null,
    engineUsed: torrent.engineUsed || 'instant',
    watchedAt: Date.now(),
  };

  const updated = [entry, ...current].slice(0, MAX_WATCH_HISTORY);
  try {
    localStorage.setItem(KEYS.WATCH_HISTORY, JSON.stringify(updated));
    dispatchStorageEvent();
  } catch (_) {}
  return updated;
}

export function removeFromWatchHistory(id) {
  const current = getWatchHistory().filter(item => (item.id || item.title) !== id);
  try {
    localStorage.setItem(KEYS.WATCH_HISTORY, JSON.stringify(current));
    dispatchStorageEvent();
  } catch (_) {}
  return current;
}

export function clearWatchHistory() {
  try {
    localStorage.removeItem(KEYS.WATCH_HISTORY);
    dispatchStorageEvent();
  } catch (_) {}
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Watchlist ("My List" / Bookmarks)
// ─────────────────────────────────────────────────────────────────────────────
export function getWatchlist() {
  try {
    const raw = localStorage.getItem(KEYS.WATCHLIST);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function isInWatchlist(idOrTitle) {
  if (!idOrTitle) return false;
  const list = getWatchlist();
  return list.some(item => (item.id === idOrTitle || item.title === idOrTitle || item.rawTitle === idOrTitle));
}

export function addToWatchlist(torrent, meta = {}) {
  if (!torrent) return getWatchlist();
  const id = torrent.id || torrent.infoHash || torrent.title;
  if (isInWatchlist(id)) return getWatchlist();

  const entry = {
    id,
    title: meta?.title || meta?.name || torrent.title,
    rawTitle: torrent.title,
    category: torrent.category || meta?.type || 'movies',
    size: torrent.size || null,
    seeders: torrent.seeders || 0,
    leechers: torrent.leechers || 0,
    magnet: torrent.magnet || null,
    poster: meta?.poster || meta?.background || null,
    background: meta?.background || null,
    year: meta?.year || null,
    rating: meta?.rating || null,
    director: meta?.director || null,
    addedAt: Date.now(),
  };

  const updated = [entry, ...getWatchlist()];
  try {
    localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(updated));
    dispatchStorageEvent();
  } catch (_) {}
  return updated;
}

export function removeFromWatchlist(idOrTitle) {
  const current = getWatchlist().filter(
    item => item.id !== idOrTitle && item.title !== idOrTitle && item.rawTitle !== idOrTitle
  );
  try {
    localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(current));
    dispatchStorageEvent();
  } catch (_) {}
  return current;
}

export function toggleWatchlist(torrent, meta = {}) {
  const id = torrent.id || torrent.infoHash || torrent.title;
  if (isInWatchlist(id)) {
    removeFromWatchlist(id);
    return false; // Removed
  } else {
    addToWatchlist(torrent, meta);
    return true; // Added
  }
}

export function clearWatchlist() {
  try {
    localStorage.removeItem(KEYS.WATCHLIST);
    dispatchStorageEvent();
  } catch (_) {}
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. User Preferences & Settings
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PREFS = {
  defaultPlayer: 'instant', // 'instant' | 'webtorrent' | 'torrserver' | 'vlc'
  autoCopyMagnet: true,
  streamQuality: '1080p',
};

export function getUserPreferences() {
  try {
    const raw = localStorage.getItem(KEYS.USER_PREFS);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch (_) {
    return DEFAULT_PREFS;
  }
}

export function saveUserPreferences(prefs) {
  try {
    const next = { ...getUserPreferences(), ...prefs };
    localStorage.setItem(KEYS.USER_PREFS, JSON.stringify(next));
    dispatchStorageEvent();
    return next;
  } catch (_) {
    return DEFAULT_PREFS;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Storage Summary & Master Clear All Data
// ─────────────────────────────────────────────────────────────────────────────
export function getStorageSummary() {
  const searches = getSearchHistory();
  const watches = getWatchHistory();
  const watchlist = getWatchlist();

  let bytes = 0;
  try {
    Object.values(KEYS).forEach(k => {
      const val = localStorage.getItem(k);
      if (val) bytes += val.length * 2; // rough UTF-16 byte estimate
    });
  } catch (_) {}

  const kb = (bytes / 1024).toFixed(1);

  return {
    searchCount: searches.length,
    watchCount: watches.length,
    watchlistCount: watchlist.length,
    totalItems: searches.length + watches.length + watchlist.length,
    storageSizeFormatted: `${kb} KB`,
  };
}

/**
 * Master Clear All Data:
 * Removes search history, watch history, watchlist, and user preferences in one click.
 */
export function clearAllUserData() {
  try {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    dispatchStorageEvent();
  } catch (_) {}
}

export default {
  getSearchHistory,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
  getWatchHistory,
  addToWatchHistory,
  removeFromWatchHistory,
  clearWatchHistory,
  getWatchlist,
  isInWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
  clearWatchlist,
  getUserPreferences,
  saveUserPreferences,
  getStorageSummary,
  clearAllUserData,
};