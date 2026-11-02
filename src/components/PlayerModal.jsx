/**
 * PlayerModal.jsx
 * In-App WebTor Streaming Theater Modal.
 * Automatically injects the magnet link and provides alternative player switches.
 */
import React, { useState } from 'react';
import {
  X,
  Maximize2,
  ExternalLink,
  Copy,
  Check,
  Tv,
  Film,
  Zap,
} from 'lucide-react';

export function PlayerModal({ visible, onClose, torrent, magnet, onCopyMagnet }) {
  const [engine, setEngine] = useState('webtor'); // 'webtor' | 'torrserver'
  const [copied, setCopied] = useState(false);
  const [isTheater, setIsTheater] = useState(false);

  if (!visible || !magnet) return null;

  const webTorUrl = `https://webtor.io/#action=load&magnet=${encodeURIComponent(magnet)}`;
  const torrServerUrl = `https://torrserver.me/stream?link=${encodeURIComponent(magnet)}&index=0&play`;

  const handleCopy = () => {
    onCopyMagnet(magnet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpenVLC = () => {
    window.location.href = `vlc://${magnet}`;
  };

  const handleOpenExternal = () => {
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
              <Zap size={12} /> {engine === 'webtor' ? 'WebTor Stream Engine' : 'TorrServer Engine'}
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
            <iframe
              src={webTorUrl}
              title="WebTor Video Stream"
              className="player-iframe"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className="torrserver-fallback-view">
              <Film size={48} className="torrserver-icon" />
              <h3>TorrServer Stream Mode</h3>
              <p>Streaming sequential HTTP video stream through public TorrServer cluster.</p>
              <a
                href={torrServerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-button neu-button-primary"
              >
                Open Direct HTTP Video Feed
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
              <Film size={15} /> WebTor Player (Auto-Play)
            </button>
            <button
              className={`engine-tab-btn ${engine === 'torrserver' ? 'active' : ''}`}
              onClick={() => setEngine('torrserver')}
            >
              <Tv size={15} /> TorrServer Direct
            </button>
          </div>

          <div className="external-player-buttons">
            <button
              className="neu-button player-sub-btn"
              onClick={handleOpenVLC}
              title="Open stream directly in VLC Player"
            >
              <Tv size={15} color="#f97316" /> VLC Stream
            </button>
            <button
              className="neu-button player-sub-btn"
              onClick={handleOpenExternal}
              title="Open WebTor in separate tab"
            >
              <ExternalLink size={15} /> New Tab
            </button>
            <button
              className={`neu-button player-sub-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy Magnet Link to clipboard"
            >
              {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy Magnet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerModal;
