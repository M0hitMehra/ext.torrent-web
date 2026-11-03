/**
 * PlayerModal.jsx
 * In-App Cinema Streaming Theater & WebTor Auto-Launcher.
 * Fixes the WebTor blank screen by offering:
 * 1. Instant In-App Cinema Stream (Powered by PopcornTV & multi-embed networks: VidLink, VidCore, AutoEmbed, VidSrc)
 * 2. Dedicated WebTor Auto-Launcher (Auto-copies magnet & launches top-level tab to bypass Cloudflare Turnstile blocks)
 * 3. TorrServer Sequential HTTP Stream
 * 4. External Player integration (VLC, etc.)
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Maximize2,
  ExternalLink,
  Copy,
  Check,
  Tv,
  Film,
  Zap,
  RefreshCw,
  Server,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { fetchMediaMetadata, cleanTitle } from '../api/metaApi';
import { getMovieStreams, getTvStreams } from '../api/torrentApi';

export function PlayerModal({
  visible,
  onClose,
  torrent,
  magnet,
  initialEngine = 'instant',
  onCopyMagnet,
}) {
  const [engine, setEngine] = useState(initialEngine); // 'instant' | 'webtor' | 'torrserver'
  const [copied, setCopied] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [mediaMeta, setMediaMeta] = useState(null);
  const [streamSources, setStreamSources] = useState([]);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [streamError, setStreamError] = useState(null);

  // Sync engine when opened
  useEffect(() => {
    if (initialEngine) setEngine(initialEngine);
  }, [initialEngine]);

  // Load Metadata & Stream Sources for Instant Cinema
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

        const id = meta?.imdbId || cleanTitle(torrent.title).title;
        const isTv = meta?.type === 'series' || /s\d{1,2}e\d{1,2}/i.test(torrent.title);

        let streamData;
        if (isTv) {
          // Extract season & episode if present in title
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
          setStreamError('No direct streaming server found for this release.');
        }
      } catch (err) {
        if (!mounted) return;
        setStreamError('Failed to load stream servers. Switch to WebTor or TorrServer.');
      } finally {
        if (mounted) setLoadingStreams(false);
      }
    };

    resolveMedia();
    return () => { mounted = false; };
  }, [visible, torrent]);

  if (!visible || !magnet) return null;

  const currentSource = streamSources[selectedSourceIndex] || null;
  const webTorUrl = `https://webtor.io/#action=load&magnet=${encodeURIComponent(magnet)}`;
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

  const handleLaunchWebTor = () => {
    onCopyMagnet(magnet, 'Magnet copied! Launching WebTor stream in new tab...');
    window.open(webTorUrl, '_blank', 'noopener,noreferrer');
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
                  <span>Instant Stream • {currentSource?.provider || '1080p'}</span>
                </>
              ) : engine === 'webtor' ? (
                <>
                  <Film size={12} />
                  <span>WebTor Cinema</span>
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
                <h4>Connecting to PopcornTV Streaming Servers...</h4>
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
                <p>{streamError || 'Try launching WebTor or TorrServer below.'}</p>
                <button
                  className="neu-button neu-button-primary"
                  onClick={handleLaunchWebTor}
                >
                  <Film size={16} /> Launch in WebTor Player
                </button>
              </div>
            )
          ) : engine === 'webtor' ? (
            <div className="webtor-deck-view">
              <div className="webtor-deck-card glass-panel">
                <div className="webtor-deck-badge">
                  <Sparkles size={14} /> CLOUDFLARE SAFE LAUNCHER
                </div>
                <Film size={54} className="webtor-deck-icon" />
                <h2>WebTor High-Speed Streaming Player</h2>
                <p className="webtor-deck-desc">
                  WebTor enforces top-level browser clearance to prevent blank-screen iframe blocking.
                  Your magnet link is <strong>already copied to your clipboard</strong> and loaded in the launcher!
                </p>

                <div className="webtor-deck-actions">
                  <button
                    className="neu-button neu-button-primary webtor-play-btn"
                    onClick={handleLaunchWebTor}
                  >
                    <ExternalLink size={18} /> Launch WebTor (Auto-Play Video)
                  </button>
                  <button
                    className="neu-button"
                    onClick={() => setEngine('instant')}
                  >
                    <Zap size={16} color="#ec4899" /> Switch to In-App Cinema
                  </button>
                </div>
              </div>
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

        {/* Server Switcher Pill Bar (When in Instant Stream Mode) */}
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
              <Zap size={15} color="#ec4899" /> Instant In-App
            </button>
            <button
              className={`engine-tab-btn ${engine === 'webtor' ? 'active' : ''}`}
              onClick={() => setEngine('webtor')}
            >
              <Film size={15} /> WebTor Player
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
              onClick={handleLaunchWebTor}
              title="Open WebTor in a new browser tab with magnet pre-loaded"
            >
              <ExternalLink size={15} /> Open WebTor Tab
            </button>
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
