/**
 * PlayerModal.jsx
 * In-App WebTor Streaming Theater Modal.
 * Eliminates CSRF errors by utilizing Webtor's Embed SDK (`window.webtor.push`),
 * while keeping the magnet link automatically copied and providing alternative player controls.
 */
import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

export function PlayerModal({ visible, onClose, torrent, magnet, initialEngine = 'webtor', onCopyMagnet }) {
  const [engine, setEngine] = useState(initialEngine); // 'webtor' | 'torrserver'

  useEffect(() => {
    if (initialEngine) setEngine(initialEngine);
  }, [initialEngine]);
  const [copied, setCopied] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [webtorLoaded, setWebtorLoaded] = useState(false);
  const playerContainerRef = useRef(null);

  // Initialize Webtor Embed SDK when modal opens with 'webtor' engine
  useEffect(() => {
    if (!visible || !magnet || engine !== 'webtor') return;

    let timer;
    const mountPlayer = () => {
      const container = playerContainerRef.current;
      if (!container) return;

      container.innerHTML = '';
      const targetDiv = document.createElement('div');
      targetDiv.id = 'webtor-player-target';
      targetDiv.style.width = '100%';
      targetDiv.style.height = '100%';
      container.appendChild(targetDiv);

      if (window.webtor) {
        try {
          window.webtor.push({
            id: 'webtor-player-target',
            magnet: magnet,
            width: '100%',
            height: '100%',
            features: {
              p2pProgress: true,
            },
            onInit: () => setWebtorLoaded(true),
            onError: (err) => console.warn('WebTor embed status:', err),
          });
          setWebtorLoaded(true);
        } catch (e) {
          console.warn('WebTor push error:', e);
        }
      } else {
        // Retry after SDK loads
        timer = setTimeout(mountPlayer, 300);
      }
    };

    mountPlayer();
    return () => clearTimeout(timer);
  }, [visible, magnet, engine]);

  if (!visible || !magnet) return null;

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

  const handleOpenExternal = () => {
    onCopyMagnet(magnet, 'Opening WebTor in browser...');
    window.open(webTorUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="player-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className={`player-modal-content glass-panel ${isTheater ? 'theater-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar */}
        <div className="player-top-bar">
          <div className="player-title-wrap">
            <div className="player-active-dot"></div>
            <span className="player-title" title={torrent?.title}>
              {torrent?.title || 'Streaming Video'}
            </span>
            <span className="engine-badge">
              <Zap size={12} /> {engine === 'webtor' ? 'WebTor Embed Stream' : 'TorrServer Direct'}
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

        {/* Video Player Frame Container */}
        <div className="player-frame-wrapper">
          {engine === 'webtor' ? (
            <div className="webtor-container" ref={playerContainerRef}>
              {/* SDK will render iframe into #webtor-player-target */}
            </div>
          ) : (
            <div className="torrserver-fallback-view">
              <Film size={48} className="torrserver-icon" />
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

        {/* Player Bottom Switcher Toolbar */}
        <div className="player-bottom-toolbar">
          <div className="engine-switch-tabs">
            <button
              className={`engine-tab-btn ${engine === 'webtor' ? 'active' : ''}`}
              onClick={() => setEngine('webtor')}
            >
              <Film size={15} /> WebTor In-App
            </button>
            <button
              className={`engine-tab-btn ${engine === 'torrserver' ? 'active' : ''}`}
              onClick={() => setEngine('torrserver')}
            >
              <Tv size={15} /> TorrServer Feed
            </button>
          </div>

          <div className="external-player-buttons">
            <button
              className="neu-button player-sub-btn"
              onClick={handleOpenExternal}
              title="Open WebTor in a new browser tab with magnet pre-loaded"
            >
              <ExternalLink size={15} /> Open in WebTor Tab
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
