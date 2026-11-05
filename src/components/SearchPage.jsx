/**
 * SearchPage.jsx
 * Full-featured Search & Browse View with category filters, sort chips,
 * persistent search history, and multi-column results grid.
 */
import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  History,
  X,
  Trash2,
  Film,
  Sparkles,
} from 'lucide-react';
import { TorrentCard } from './TorrentCard';
import { CATEGORIES, SORT_OPTIONS, searchTorrents, browseTorrents } from '../api/torrentApi';
import { getSearchHistory, addSearchQuery, removeSearchQuery, clearSearchHistory } from '../utils/history';

export function SearchPage({ initialQuery = '', onStream, onDetails, onCopyMagnet }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[0]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getSearchHistory());
    const syncHistory = () => setHistory(getSearchHistory());
    window.addEventListener('ext_storage_update', syncHistory);
    return () => window.removeEventListener('ext_storage_update', syncHistory);
  }, []);

  const executeSearch = async (q = query, cat = selectedCategory, s = selectedSort, p = 1) => {
    setLoading(true);
    setError(null);

    if (q && q.trim()) {
      addSearchQuery(q.trim());
      setHistory(getSearchHistory());
    }

    try {
      let res;
      if (q && q.trim()) {
        res = await searchTorrents({
          q: q.trim(),
          page: p,
          sort: s.value,
          order: s.order,
          category: cat,
        });
      } else {
        res = await browseTorrents({
          category: cat === 'all' ? 'movies' : cat,
          page: p,
          sort: s.value,
          order: s.order,
        });
      }

      setResults(res.torrents || []);
      setTotalPages(res.totalPages || 1);
      setPage(p);
    } catch (err) {
      setError(err.message || 'Error fetching releases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(query, selectedCategory, selectedSort, 1);
  }, [selectedCategory, selectedSort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(query, selectedCategory, selectedSort, 1);
  };

  const handleSelectHistory = (h) => {
    setQuery(h);
    executeSearch(h, selectedCategory, selectedSort, 1);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  return (
    <div className="search-page-container">
      {/* Search Header Bar */}
      <div className="search-header-panel glass-panel">
        <form onSubmit={handleSearchSubmit} className="search-input-row neu-inset">
          <Search size={20} className="search-panel-icon" />
          <input
            type="text"
            placeholder="Search millions of torrents (movies, tv series, software, anime)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-main-input"
          />
          {query && (
            <button
              type="button"
              className="search-clear-input-btn"
              onClick={() => { setQuery(''); executeSearch('', selectedCategory, selectedSort, 1); }}
            >
              <X size={18} />
            </button>
          )}
          <button type="submit" className="neu-button neu-button-primary search-submit-btn">
            Search
          </button>
        </form>

        {/* Search History Chips */}
        {history.length > 0 && (
          <div className="search-history-chips-row">
            <div className="history-label-wrap">
              <History size={14} /> <span>Recent:</span>
            </div>
            <div className="history-chips-scroll">
              {history.map((h, i) => (
                <span
                  key={i}
                  className="history-chip neu-button"
                  onClick={() => handleSelectHistory(h)}
                >
                  {h}
                  <button
                    className="chip-del"
                    onClick={(e) => { e.stopPropagation(); setHistory(removeSearchQuery(h)); }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                className="clear-history-chip"
                onClick={handleClearHistory}
                title="Clear all recent searches"
              >
                <Trash2 size={13} /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Category Pills & Sort Dropdown */}
        <div className="filter-controls-row">
          <div className="category-pills-list">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                className={`category-filter-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="sort-dropdown-wrap">
            <SlidersHorizontal size={16} />
            <select
              value={`${selectedSort.value}_${selectedSort.order}`}
              onChange={(e) => {
                const [val, ord] = e.target.value.split('_');
                const matched = SORT_OPTIONS.find(s => s.value === val && s.order === ord);
                if (matched) setSelectedSort(matched);
              }}
              className="sort-select-input neu-inset"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={`${opt.value}_${opt.order}`} value={`${opt.value}_${opt.order}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="results-header-info">
        <h2 className="results-title">
          {query ? `Search results for "${query}"` : `Exploring ${selectedCategory.toUpperCase()} Torrents`}
        </h2>
        <span className="results-count">
          {loading ? 'Searching...' : `${results.length} releases found`}
        </span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="results-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="torrent-card-skeleton glass-panel skeleton" style={{ height: 340 }} />
          ))}
        </div>
      ) : error ? (
        <div className="results-empty-state glass-panel">
          <Film size={48} className="empty-state-icon" />
          <h3>Error loading releases</h3>
          <p>{error}</p>
          <button
            className="neu-button neu-button-primary"
            onClick={() => executeSearch(query, selectedCategory, selectedSort, 1)}
          >
            Retry Search
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="results-empty-state glass-panel">
          <Film size={48} className="empty-state-icon" />
          <h3>No torrents found</h3>
          <p>Try searching for a different title or keyword.</p>
        </div>
      ) : (
        <div className="results-grid">
          {results.map((t, idx) => (
            <TorrentCard
              key={t.id || idx}
              torrent={t}
              onStream={onStream}
              onDetails={onDetails}
              onCopyMagnet={onCopyMagnet}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="neu-button"
            disabled={page <= 1 || loading}
            onClick={() => executeSearch(query, selectedCategory, selectedSort, page - 1)}
          >
            Previous
          </button>
          <span className="page-indicator">Page {page} of {totalPages}</span>
          <button
            className="neu-button"
            disabled={page >= totalPages || loading}
            onClick={() => executeSearch(query, selectedCategory, selectedSort, page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
