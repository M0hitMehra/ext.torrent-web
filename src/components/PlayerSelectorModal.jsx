/**
 * PlayerSelectorModal.jsx
 * Glassmorphic Neumorphic Player Selector Modal.
 * Prompts user to choose their preferred streaming player.
 * Video opens directly inside the web application — no broken external tabs.
 * Automatically copies the magnet link to clipboard on selection.
 */
import React, { useState } from 'react';
import {
  X,
  Play,
  Film,
  Tv,
  Smartphone,
  Copy,
  Check,
  Zap,
  Sparkles,
  Share2,
} from 'lucide-react';

export function PlayerSelectorModal({
  visible,
  onClose,
  torrent,
  magnet,
  onSelectInAppStream,
  onCopyMagnet,
}) {
  const [copiedOption, setCopiedOption] = useState(false);

  if (!visible || !torrent || !magnet) return null;

  // 1. Instant Cinema In-App Stream (Default & Recommended)
  const handleInstantInApp = async () => {
    await onCopyMagnet(magnet, 'Magnet copied! Starting In-App Cinema Player...');
    onClose();
    onSelectInAppStream('instant');
  };

  // 2. Webtor In-Browser Player (Official Webtor Embed)
  const handleWebtorEmbed = async () => {
    await onCopyMagnet(magnet, 'Magnet copied! Starting Webtor Player...');
    onClose();
    onSelectInAppStream('webtor');
  };

  // 3. WebTorrent In-Browser P2P Player
  const handleWebTorrentP2P = async () => {
    await onCopyMagnet(magnet, 'Magnet copied! Starting WebTorrent P2P Stream...');
    onClose();
    onSelectInAppStream('webtorrent');
  };

  // 3. TorrServer Direct Stream
  const handleTorrServer = async () => {
    await onCopyMagnet(magnet, 'Starting TorrServer stream...');
    onClose();
    onSelectInAppStream('torrserver');
  };

  // 4. VLC Media Player
  const handleVLC = async () => {
    await onCopyMagnet(magnet, 'Magnet copied! Launching VLC Media Player...');
    onClose();
    window.location.href = `vlc://${magnet}`;
  };

  // 5. System Default App (qBittorrent, Stremio, etc.)
  const handleSystemApp = async () => {
    await onCopyMagnet(magnet, 'Magnet copied! Opening in system media app...');
    onClose();
    window.location.href = magnet;
  };

  // 6. Copy Magnet only
  const handleCopyOnly = async () => {
    await onCopyMagnet(magnet, 'Magnet URI copied to clipboard!');
    setCopiedOption(true);
    setTimeout(() => {
      setCopiedOption(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="player-selector-backdrop animate-fade-in" onClick={onClose}>
      <div className="player-selector-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="selector-header">
          <div className="selector-header-left">
            <div className="selector-icon-circle">
              <Play size={22} fill="var(--accent-primary)" color="var(--accent-primary)" />
            </div>
            <div className="selector-title-wrap">
              <h2 className="selector-title">Choose Streaming Player</h2>
              <span className="selector-subtitle" title={torrent.title}>
                {torrent.title}
              </span>
            </div>
          </div>
          <button className="selector-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Player Options List */}
        <div className="selector-options-list">
          {/* Option 1: Instant In-App Cinema Stream (Default & Recommended) */}
          <div
            className="player-option-tile default-tile neu-button"
            onClick={handleInstantInApp}
          >
            <div className="option-tile-icon icon-cinema">
              <Zap size={24} color="#ec4899" />
            </div>
            <div className="option-tile-body">
              <div className="option-title-row">
                <span className="option-title">Instant Cinema Player (In-App)</span>
                <span className="badge-pill badge-recommended">
                  <Sparkles size={11} /> RECOMMENDED • 1080P ZERO WAIT
                </span>
              </div>
              <p className="option-desc">
                Plays immediately inside your web app with multi-server switching (VidLink, AutoEmbed, VidSrc, Popcorn Hub).
              </p>
            </div>
            <Play size={20} className="option-arrow-icon" fill="currentColor" />
          </div>

          {/* Option 2: Webtor Official In-Browser Streamer */}
          <div
            className="player-option-tile neu-button"
            onClick={handleWebtorEmbed}
          >
            <div className="option-tile-icon icon-webtor">
              <Film size={22} color="#ec4899" />
            </div>
            <div className="option-tile-body">
              <div className="option-title-row">
                <span className="option-title">Webtor In-Browser Streaming</span>
                <span className="badge-pill badge-browser">OFFICIAL WEBTOR PLAYER</span>
              </div>
              <p className="option-desc">
                Streams video torrent directly in your web page with real-time audio/video transcoding and subtitle support.
              </p>
            </div>
            <Play size={18} className="option-arrow-icon" fill="currentColor" />
          </div>

          {/* Option 3: WebTorrent In-Browser P2P Streamer */}
          <div
            className="player-option-tile neu-button"
            onClick={handleWebTorrentP2P}
          >
            <div className="option-tile-icon icon-webtor">
              <Film size={22} />
            </div>
            <div className="option-tile-body">
              <div className="option-title-row">
                <span className="option-title">WebTorrent P2P Client</span>
                <span className="badge-pill badge-browser">PEER-TO-PEER</span>
              </div>
              <p className="option-desc">
                Client-side browser engine connects directly to torrent swarm and streams video right into your web app.
              </p>
            </div>
            <Play size={18} className="option-arrow-icon" />
          </div>

          {/* Option 3: TorrServer Direct Stream */}
          <div
            className="player-option-tile neu-button"
            onClick={handleTorrServer}
          >
            <div className="option-tile-icon icon-torrserver">
              <Zap size={22} />
            </div>
            <div className="option-tile-body">
              <div className="option-title-row">
                <span className="option-title">TorrServer HTTP Stream</span>
                <span className="badge-pill badge-torrserver">DIRECT FEED</span>
              </div>
              <p className="option-desc">
                Sequential HTTP video stream via public TorrServer cluster.
              </p>
            </div>
            <Play size={18} className="option-arrow-icon" />
          </div>

          {/* Option 4: VLC Media Player */}
          <div
            className="player-option-tile neu-button"
            onClick={handleVLC}
          >
            <div className="option-tile-icon icon-vlc">
              <Tv size={22} />
            </div>
            <div className="option-tile-body">
              <div className="option-title-row">
                <span className="option-title">VLC Media Player</span>
                <span className="badge-pill badge-vlc">EXTERNAL APP</span>
              </div>
              <p className="option-desc">
                Passes magnet to official VLC with hardware acceleration and subtitle switching.
              </p>
            </div>
            <Tv size={18} className="option-arrow-icon" />
          </div>

          {/* Option 5: Other Torrent App / Magnet Handler */}
          <div
            className="player-option-tile neu-button"
            onClick={handleSystemApp}
          >
            <div className="option-tile-icon icon-system">
              <Smartphone size={22} />
            </div>
            <div className="option-tile-body">
              <div className="option-title-row">
                <span className="option-title">Other Installed Torrent Player</span>
                <span className="badge-pill">SYSTEM DEFAULT</span>
              </div>
              <p className="option-desc">
                Pass magnet to qBittorrent, Stremio, MX Player, or system default player.
              </p>
            </div>
            <Smartphone size={18} className="option-arrow-icon" />
          </div>

          {/* Option 6: Copy Magnet Only */}
          <div
            className="player-option-tile neu-button"
            onClick={handleCopyOnly}
          >
            <div className="option-tile-icon icon-copy">
              {copiedOption ? <Check size={22} color="var(--seeder)" /> : <Copy size={22} />}
            </div>
            <div className="option-tile-body">
              <div className="option-title-row">
                <span className="option-title">
                  {copiedOption ? 'Copied to Clipboard!' : 'Copy Magnet Link Only'}
                </span>
                <span className="badge-pill">CLIPBOARD</span>
              </div>
              <p className="option-desc">
                Copy raw magnet URI with tracker announce list to paste anywhere.
              </p>
            </div>
            {copiedOption ? <Check size={18} color="var(--seeder)" /> : <Copy size={18} className="option-arrow-icon" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerSelectorModal;
