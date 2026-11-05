/**
 * history.js
 * Backward-compatible wrapper forwarding to storage.js
 */
export {
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
  clearAllUserData,
  getStorageSummary,
} from './storage';

import storage from './storage';
export default storage;