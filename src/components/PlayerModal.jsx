/**
 * PlayerModal.jsx
 * In-App Cinema Streaming Theater & WebTorrent P2P In-Browser Player.
 * All streams run directly inside your website — zero external broken tabs.
 * 1. Instant Cinema Player: PopcornTV & Multi-Provider 1080p Streams (VidLink, AutoEmbed, VidSrc)
 * 2. WebTorrent In-Browser Player: Real client-side P2P WebRTC streaming into HTML5 <video>
 * 3. TorrServer Direct Stream: Sequential HTTP stream
 * 4. External Player Controls: VLC launch & Auto-copied magnet link
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Copy,
  Check,
  Tv,
  Film,
  Zap,
  RefreshCw,
  Server,
  Sparkles,
  AlertCircle,
  Wifi,
  Download,
  Users,
} from 'lucide-react';
import { fetchMediaMetadata, cleanTitle } from '../api/metaApi';
import { getMovieStreams, getTvStreams } from '../api/torrentApi';
import { addToWatchHistory } from '../utils/storage';

// Public WebRTC Trackers for in-browser WebTorrent P2P
const WEBRTC_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.fastcast.nz',
];

export function PlayerModal({
  visible,
  onClose,
  torrent,
  magnet,
  initialEngine = 'instant',
  onCopyMagnet,
}) {
  const [engine, setEngine] = useState(initialEngine); // 'instant' | 'webtorrent' | 'torrserver'
  const [copied, setCopied] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [mediaMeta, setMediaMeta] = useState(null);
  const [streamSources, setStreamSources] = useState([]);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [streamError, setStreamError] = useState(null);

  // WebTorrent In-Browser State
  const [p2pStatus, setP2pStatus] = useState('Connecting to WebRTC swarm...');
  const [p2pProgress, setP2pProgress] = useState(0);
  const [p2pSpeed, setP2pSpeed] = useState('0 KB/s');
  const [p2pPeers, setP2pPeers] = useState(0);
  const [p2pReady, setP2pReady] = useState(false);
  const [p2pError, setP2pError] = useState(null);
  const videoRef = useRef(null);
  const clientRef = useRef(null);

  // Sync initial engine when modal opens
  useEffect(() => {
    if (initialEngine) setEngine(initialEngine);
  }, [initialEngine, visible]);

  // Automatically copy magnet on modal open
  useEffect(() => {
    if (visible && magnet) {
      onCopyMagnet(magnet, 'Magnet link copied to clipboard!');
    }
  }, [visible, magnet, onCopyMagnet]);

  // Load Metadata & Instant Cinema Streams
  useEffect(() => {
    if (!visible || !torrent) return;

    let mounted = true;
    setLoadingStreams(true);
    setStreamError(null);

    const resolveMedia = async () => {
      try {
        const meta = await fetchMediaMetadata(torrent.title);
        if (!mounted) return;
        setMediaMeta(meta);
        addToWatchHistory(torrent, meta);

        const id = meta?.imdbId || cleanTitle(torrent.title).title;
        const isTv = meta?.type === 'series' || /s\d{1,2}e\d{1,2}/i.test(torrent.title);

        let streamData;
        if (isTv) {
          const sMatch = torrent.title.match(/s(\d{1,2})/i);
          const eMatch = torrent.title.match(/e(\d{1,2})/i);
          const season = sMatch ? parseInt(sMatch[1], 10) : 1;
          const episode = eMatch ? parseInt(eMatch[1], 10) : 1;
          streamData = await getTvStreams(id, season, episode);
        } else {
          streamData = await getMovieStreams(id);
        }

        if (!mounted) return;
        if (streamData?.sources && streamData.sources.length > 0) {
          setStreamSources(streamData.sources);
          setSelectedSourceIndex(0);
        } else {
          setStreamError('No direct streaming server found for this title.');
        }
      } catch (err) {
        if (!mounted) return;
        setStreamError('Failed to load stream servers. Switch to WebTorrent or TorrServer.');
      } finally {
        if (mounted) setLoadingStreams(false);
      }
    };

    resolveMedia();
    return () => { mounted = false; };
  }, [visible, torrent]);

  // In-Browser WebTorrent P2P Client Handler
  useEffect(() => {
    if (!visible || !magnet || engine !== 'webtorrent') {
      if (clientRef.current) {
        try { clientRef.current.destroy(); } catch (_) {}
        clientRef.current = null;
      }
      return;
    }

    let client = null;
    let activeTorrent = null;

    try {
      if (typeof window.WebTorrent !== 'function') {
        setP2pError('WebTorrent library not loaded. Switch to Instant Cinema Player.');
        return;
      }

      setP2pStatus('Initializing WebTorrent client...');
      setP2pProgress(0);
      setP2pSpeed('0 KB/s');
      setP2pPeers(0);
      setP2pReady(false);
      setP2pError(null);

      client = new window.WebTorrent();
      clientRef.current = client;

      // Ensure magnet has WebRTC trackers appended
      let enrichedMagnet = magnet;
      WEBRTC_TRACKERS.forEach(tracker => {
        const trackerParam = `&tr=${encodeURIComponent(tracker)}`;
        if (!enrichedMagnet.includes(trackerParam)) {
          enrichedMagnet += trackerParam;
        }
      });

      client.add(enrichedMagnet, (torr) => {
        activeTorrent = torr;
        setP2pStatus('Searching compatible video in swarm...');

        // Find primary video file (.mp4, .mkv, .webm, .m4v, .avi)
        const videoFile = torr.files.find(f => {
          const name = f.name.toLowerCase();
          return name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mkv') || name.endsWith('.m4v');
        }) || torr.files[0];

        if (!videoFile) {
          setP2pStatus('No video file found in this torrent swarm.');
          return;
        }

        setP2pStatus(`Streaming ${videoFile.name}...`);

        if (videoRef.current) {
          videoFile.renderTo(videoRef.current, { autoplay: true }, (err) => {
            if (err) {
              console.warn('WebTorrent render error:', err);
              setP2pError(`Video codec notice: ${err.message}. Switch to Instant Cinema for direct playback.`);
            } else {
              setP2pReady(true);
            }
          });
        }

        // Live download stats
        torr.on('download', () => {
          const percent = Math.round(torr.progress * 100);
          const speed = (torr.downloadSpeed / 1024 / 1024).toFixed(2);
          setP2pProgress(percent);
          setP2pSpeed(`${speed} MB/s`);
          setP2pPeers(torr.numPeers || 0);
        });

        torr.on('done', () => {
          setP2pProgress(100);
          setP2pStatus('Torrent 100% downloaded! Direct playback active.');
        });
      });

      client.on('error', (err) => {
        console.warn('WebTorrent error:', err);
        setP2pError('Swarm connection notice. Switching to Instant Cinema recommended.');
      });
    } catch (e) {
      console.warn('WebTorrent init exception:', e);
      setP2pError('Browser WebRTC unavailable. Switch to Instant Cinema Player.');
    }

    return () => {
      if (client) {
        try { client.destroy(); } catch (_) {}
      }
      clientRef.current = null;
    };
  }, [visible, magnet, engine]);

  // Webtor Official In-App Embed Engine Handler
  useEffect(() => {
    if (!visible || !magnet || engine !== 'webtor') return;

    let timer = null;
    const container = document.getElementById('webtor-player-box');
    if (!container) return;

    container.innerHTML = '';

    const initWebtor = () => {
      try {
        window.webtor = window.webtor || [];
        window.webtor.push({
          id: 'webtor-player-box',
          magnet: magnet,
          poster: mediaMeta?.poster || mediaMeta?.background || '',
          title: torrent?.title || 'Streaming Video',
          imdbId: mediaMeta?.imdbId || '',
          width: '100%',
          height: '100%',
          header: true,
          controls: true,
          theme: 'dark',
        });
      } catch (err) {
        console.warn('Webtor embed error:', err);
      }
    };

    // Initialize with slight timeout to ensure container is mounted in DOM
    timer = setTimeout(initWebtor, 150);

    return () => {
      if (timer) clearTimeout(timer);
      if (container) container.innerHTML = '';
    };
  }, [visible, magnet, engine, mediaMeta, torrent]);

  if (!visible || !magnet) return null;

  const currentSource = streamSources[selectedSourceIndex] || null;
  const torrServerUrl = `https://torrserver.me/stream?link=${encodeURIComponent(magnet)}&index=0&play`;

  const handleCopy = () => {
    onCopyMagnet(magnet, 'Magnet link copied to clipboard!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpenVLC = () => {
    onCopyMagnet(magnet, 'Opening in VLC Player...');
    window.location.href = `vlc://${magnet}`;
  };

  return (
    <div className="player-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className={`player-modal-content glass-panel ${isTheater ? 'theater-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="player-top-bar">
          <div className="player-title-wrap">
            <div className="player-active-dot"></div>
            <span className="player-title" title={torrent?.title}>
              {mediaMeta?.name || torrent?.title || 'Streaming Video'}
            </span>
            <span className="engine-badge">
              {engine === 'instant' ? (
                <>
                  <Zap size={12} color="#ec4899" />
                  <span>Instant Cinema • {currentSource?.provider || '1080p'}</span>
                </>
              ) : engine === 'webtor' ? (
                <>
                  <Film size={12} color="#ec4899" />
                  <span>Webtor In-Browser Player</span>
                </>
              ) : engine === 'webtorrent' ? (
                <>
                  <Film size={12} />
                  <span>WebTorrent In-Browser P2P</span>
                </>
              ) : (
                <>
                  <Tv size={12} />
                  <span>TorrServer Direct</span>
                </>
              )}
            </span>
          </div>

          <div className="player-actions-right">
            {/* Toggle Theater Mode */}
            <button
              className="player-control-icon-btn"
              onClick={() => setIsTheater(!isTheater)}
              title={isTheater ? 'Normal View' : 'Theater Wide View'}
            >
              <Maximize2 size={18} />
            </button>

            {/* Close Button */}
            <button
              className="player-control-icon-btn close-btn"
              onClick={onClose}
              title="Close Player"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Player Main Viewport */}
        <div className="player-frame-wrapper">
          {engine === 'instant' ? (
            loadingStreams ? (
              <div className="player-loading-view">
                <div className="stream-loading-spinner"></div>
                <h4>Connecting to Cinema Streaming Servers...</h4>
                <p>Locating fastest 1080p stream for {mediaMeta?.name || torrent?.title}</p>
              </div>
            ) : currentSource ? (
              <iframe
                key={currentSource.embedUrl}
                src={currentSource.embedUrl}
                className="cinema-stream-iframe"
                title="Cinema Player"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="stream-fallback-box">
                <AlertCircle size={44} color="#f59e0b" />
                <h3>Direct Stream Server Not Ready</h3>
                <p>{streamError || 'Switch to Webtor, WebTorrent P2P or TorrServer below.'}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="neu-button neu-button-primary"
                    onClick={() => setEngine('webtor')}
                  >
                    <Film size={16} /> Switch to Webtor Player
                  </button>
                  <button
                    className="neu-button"
                    onClick={() => setEngine('webtorrent')}
                  >
                    <Film size={16} /> WebTorrent P2P
                  </button>
                </div>
              </div>
            )
          ) : engine === 'webtor' ? (
            <div className="webtor-embedded-viewport">
              <div id="webtor-player-box" className="webtor-inapp-player-container"></div>
            </div>
          ) : engine === 'webtorrent' ? (
            <div className="webtorrent-viewport">
              <video
                ref={videoRef}
                className="webtorrent-native-video"
                controls
                autoPlay
                playsInline
              />
              {/* P2P Swarm Status Overlay */}
              <div className="p2p-status-bar glass-panel">
                <div className="p2p-status-left">
                  <Wifi size={14} className="p2p-pulse-icon" />
                  <span className="p2p-status-text">{p2pStatus}</span>
                </div>
                <div className="p2p-status-metrics">
                  <span className="p2p-metric-item" title="Active Peers">
                    <Users size={12} /> {p2pPeers} peers
                  </span>
                  <span className="p2p-metric-item" title="Download Speed">
                    <Download size={12} /> {p2pSpeed}
                  </span>
                  <span className="p2p-metric-badge">
                    {p2pProgress}% Buffered
                  </span>
                </div>
              </div>
              {p2pError && (
                <div className="p2p-error-banner">
                  <AlertCircle size={14} />
                  <span>{p2pError}</span>
                  <button
                    className="p2p-error-switch-btn"
                    onClick={() => setEngine('instant')}
                  >
                    Switch to Instant Cinema
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="torrserver-fallback-view">
              <Tv size={48} className="torrserver-icon" />
              <h3>TorrServer Sequential HTTP Stream</h3>
              <p>Streams directly from peer swarm via public TorrServer node.</p>
              <a
                href={torrServerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-button neu-button-primary"
              >
                Open Direct Video Feed
              </a>
            </div>
          )}
        </div>

        {/* Server Switcher Pill Bar (When in Instant Cinema Mode) */}
        {engine === 'instant' && streamSources.length > 1 && (
          <div className="stream-server-bar">
            <span className="server-bar-label">
              <Server size={14} /> Switch Server:
            </span>
            <div className="server-pills-row">
              {streamSources.map((source, idx) => (
                <button
                  key={source.provider}
                  className={`server-pill-btn ${idx === selectedSourceIndex ? 'active' : ''}`}
                  onClick={() => setSelectedSourceIndex(idx)}
                >
                  {source.provider}
                  {source.adLevel === 'none' && (
                    <span className="ad-free-tag">Ad-Free</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player Bottom Switcher Toolbar */}
        <div className="player-bottom-toolbar">
          <div className="engine-switch-tabs">
            <button
              className={`engine-tab-btn ${engine === 'instant' ? 'active' : ''}`}
              onClick={() => setEngine('instant')}
            >
              <Zap size={15} color="#ec4899" /> Instant Cinema (1080p)
            </button>
            <button
              className={`engine-tab-btn ${engine === 'webtor' ? 'active' : ''}`}
              onClick={() => setEngine('webtor')}
            >
              <Film size={15} color="#ec4899" /> Webtor (In-App)
            </button>
            <button
              className={`engine-tab-btn ${engine === 'webtorrent' ? 'active' : ''}`}
              onClick={() => setEngine('webtorrent')}
            >
              <Film size={15} /> WebTorrent (P2P)
            </button>
            <button
              className={`engine-tab-btn ${engine === 'torrserver' ? 'active' : ''}`}
              onClick={() => setEngine('torrserver')}
            >
              <Tv size={15} /> TorrServer
            </button>
          </div>

          <div className="external-player-buttons">
            <button
              className="neu-button player-sub-btn"
              onClick={handleOpenVLC}
              title="Launch official VLC Media Player"
            >
              <Tv size={15} color="#f97316" /> VLC Stream
            </button>
            <button
              className={`neu-button player-sub-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy Magnet Link"
            >
              {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
              {copied ? 'Copied Magnet!' : 'Copy Magnet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerModal;
