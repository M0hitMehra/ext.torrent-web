/**
 * App.jsx
 * Main Application Orchestrator for ExtTorrent Web.
 * Connects the Glassmorphic Neumorphic Netflix-style frontend to the Render API gateway.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Clapperboard,
  Tv,
  Clock,
  Sparkles,
  Gamepad2,
  Film,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { TorrentRow } from './components/TorrentRow';
import { PlayerModal } from './components/PlayerModal';
import { DetailModal } from './components/DetailModal';
import { SearchPage } from './components/SearchPage';
import { Toast } from './components/Toast';
import { getTrending, getLatest, browseTorrents } from './api/torrentApi';

export function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'movies' | 'tv' | 'trending' | 'latest' | 'search'
  const [searchQuery, setSearchQuery] = useState('');

  // Rows data
  const [trendingList, setTrendingList] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [tvList, setTvList] = useState([]);
  const [latestList, setLatestList] = useState([]);
  const [animeList, setAnimeList] = useState([]);
  const [gamesList, setGamesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedTorrentForStream, setSelectedTorrentForStream] = useState(null);
  const [selectedTorrentForDetail, setSelectedTorrentForDetail] = useState(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Load initial catalog shelves
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.allSettled([
      getTrending('all'),
      browseTorrents({ category: 'movies', page: 1, sort: 'seeders', order: 'desc' }),
      browseTorrents({ category: 'tv', page: 1, sort: 'seeders', order: 'desc' }),
      getLatest(1),
      browseTorrents({ category: 'anime', page: 1, sort: 'seeders', order: 'desc' }),
      browseTorrents({ category: 'games', page: 1, sort: 'seeders', order: 'desc' }),
    ]).then(([trendRes, movRes, tvRes, lateRes, aniRes, gameRes]) => {
      if (!mounted) return;
      if (trendRes.status === 'fulfilled') setTrendingList(trendRes.value?.torrents || []);
      if (movRes.status === 'fulfilled') setMoviesList(movRes.value?.torrents || []);
      if (tvRes.status === 'fulfilled') setTvList(tvRes.value?.torrents || []);
      if (lateRes.status === 'fulfilled') setLatestList(lateRes.value?.torrents || []);
      if (aniRes.status === 'fulfilled') setAnimeList(aniRes.value?.torrents || []);
      if (gameRes.status === 'fulfilled') setGamesList(gameRes.value?.torrents || []);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  // Trigger clipboard copy with toast
  const handleCopyMagnet = useCallback((magnet) => {
    if (!magnet) return;
    navigator.clipboard.writeText(magnet).then(() => {
      setToastMessage('Magnet link copied to clipboard!');
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2400);
    }).catch(() => {
      setToastMessage('Copied magnet to clipboard');
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2400);
    });
  }, []);

  // Stream Trigger
  const handleOpenStream = useCallback((torrent) => {
    setSelectedTorrentForStream(torrent);
    setPlayerModalOpen(true);
  }, []);

  // Detail Modal Trigger
  const handleOpenDetail = useCallback((torrent) => {
    setSelectedTorrentForDetail(torrent);
    setDetailModalOpen(true);
  }, []);

  // Search Submit Trigger
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Select Nav Tab
  const handleSelectTab = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'search') return;
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const heroItem = trendingList[0] || moviesList[0] || null;

  return (
    <div className="app-layout">
      {/* Top Glass Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onSearch={handleSearch}
        currentQuery={searchQuery}
      />

      {/* Main Content Area */}
      <main className="main-viewport">
        {activeTab === 'search' ? (
          <SearchPage
            initialQuery={searchQuery}
            onStream={handleOpenStream}
            onDetails={handleOpenDetail}
            onCopyMagnet={handleCopyMagnet}
          />
        ) : activeTab === 'movies' ? (
          <SearchPage
            initialQuery=""
            categoryDefault="movies"
            onStream={handleOpenStream}
            onDetails={handleOpenDetail}
            onCopyMagnet={handleCopyMagnet}
          />
        ) : activeTab === 'tv' ? (
          <SearchPage
            initialQuery=""
            categoryDefault="tv"
            onStream={handleOpenStream}
            onDetails={handleOpenDetail}
            onCopyMagnet={handleCopyMagnet}
          />
        ) : activeTab === 'trending' ? (
          <div className="shelves-view-container">
            <TorrentRow
              title="🔥 Top Trending This Week"
              icon={Flame}
              torrents={trendingList}
              onStream={handleOpenStream}
              onDetails={handleOpenDetail}
              onCopyMagnet={handleCopyMagnet}
            />
          </div>
        ) : activeTab === 'latest' ? (
          <div className="shelves-view-container">
            <TorrentRow
              title="⚡ Latest Verified Uploads"
              icon={Clock}
              torrents={latestList}
              onStream={handleOpenStream}
              onDetails={handleOpenDetail}
              onCopyMagnet={handleCopyMagnet}
            />
          </div>
        ) : (
          /* Home Netflix View */
          <>
            {/* Netflix Hero Billboard */}
            {heroItem && (
              <HeroBanner
                torrent={heroItem}
                onStream={handleOpenStream}
                onDetails={handleOpenDetail}
                onCopyMagnet={handleCopyMagnet}
              />
            )}

            {/* Netflix Shelves */}
            <div className="home-shelves-container">
              {/* Trending Shelf */}
              <TorrentRow
                title="🔥 Trending Now"
                icon={Flame}
                torrents={trendingList}
                onStream={handleOpenStream}
                onDetails={handleOpenDetail}
                onCopyMagnet={handleCopyMagnet}
                onSeeMore={() => handleSelectTab('trending')}
              />

              {/* Top Movies */}
              <TorrentRow
                title="🎬 Blockbuster Movies"
                icon={Clapperboard}
                torrents={moviesList}
                onStream={handleOpenStream}
                onDetails={handleOpenDetail}
                onCopyMagnet={handleCopyMagnet}
                onSeeMore={() => handleSelectTab('movies')}
              />

              {/* Popular TV Shows */}
              <TorrentRow
                title="📺 Binge-Worthy TV Series"
                icon={Tv}
                torrents={tvList}
                onStream={handleOpenStream}
                onDetails={handleOpenDetail}
                onCopyMagnet={handleCopyMagnet}
                onSeeMore={() => handleSelectTab('tv')}
              />

              {/* Anime & Animation */}
              <TorrentRow
                title="🎌 Anime & Animation"
                icon={Sparkles}
                torrents={animeList}
                onStream={handleOpenStream}
                onDetails={handleOpenDetail}
                onCopyMagnet={handleCopyMagnet}
              />

              {/* PC Games */}
              <TorrentRow
                title="🎮 PC Games & Repacks"
                icon={Gamepad2}
                torrents={gamesList}
                onStream={handleOpenStream}
                onDetails={handleOpenDetail}
                onCopyMagnet={handleCopyMagnet}
              />

              {/* Latest Uploads */}
              <TorrentRow
                title="⚡ Recently Added"
                icon={Clock}
                torrents={latestList}
                onStream={handleOpenStream}
                onDetails={handleOpenDetail}
                onCopyMagnet={handleCopyMagnet}
                onSeeMore={() => handleSelectTab('latest')}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer-bar glass-panel">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-brand">ExtTorrent</span>
            <span className="footer-tagline">
              Glassmorphic Neumorphism • Powered by Ext.to Hybrid Gateway on Render
            </span>
          </div>
          <div className="footer-links">
            <span className="footer-status-tag">⚡ Live Torrent Indexer</span>
            <span className="footer-status-tag">🎬 WebTor Stream Ready</span>
          </div>
        </div>
      </footer>

      {/* In-App WebTor Player Modal */}
      <PlayerModal
        visible={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        torrent={selectedTorrentForStream}
        magnet={selectedTorrentForStream?.magnet}
        onCopyMagnet={handleCopyMagnet}
      />

      {/* Expanded Details Modal */}
      <DetailModal
        visible={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        torrent={selectedTorrentForDetail}
        onStream={handleOpenStream}
        onCopyMagnet={handleCopyMagnet}
      />

      {/* Floating Glass Toast */}
      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}

export default App;
