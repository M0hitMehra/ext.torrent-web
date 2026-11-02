/**
 * history.js
 * Persistent search history manager using localStorage.
 */
const STORAGE_KEY = 'ext_torrent_search_history';
const MAX_HISTORY = 12;

export function getSearchHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function addSearchQuery(query) {
  if (!query || !query.trim()) return getSearchHistory();
  const trimmed = query.trim();
  const current = getSearchHistory().filter(q => q.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...current].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}

export function removeSearchQuery(query) {
  const current = getSearchHistory().filter(q => q.toLowerCase() !== query.toLowerCase());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (_) {}
  return current;
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
  return [];
}

export default {
  getSearchHistory,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
};
