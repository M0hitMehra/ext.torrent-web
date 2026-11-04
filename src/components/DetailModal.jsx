/**
 * DetailModal.jsx
 * Netflix-style Expanded Detail Modal.
 * Shows high-res backdrops, release metadata, files list, and format-aware actions.
 * If content is unplayable (ZIP, RAR, ISO, EXE, Games, Software), disables streaming
 * and directly shows Download Torrent options.
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Copy,
  Check,
  Download,
  Film,
  FileText,
  Star,
  Calendar,
  ArrowUp,
  ArrowDown,
  HardDrive,
  Clock,
  Layers,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { fetchMediaMetadata } from '../api/metaApi';
import { getTorrentDetail } from '../api/torrentApi';
import { isPlayableTorrent, getContentFormatLabel } from '../utils/mediaType';

export function DetailModal({ visible, onClose, torrent, onStream, onCopyMagnet }) {
  const [detail, setDetail] = useState(torrent);
  const [metadata, setMetadata] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDetail(torrent);
    if (!torrent) return;

    // Fetch Cinemeta / TVMaze metadata
    fetchMediaMetadata(torrent.title).then(setMetadata);

    // Fetch full torrent detail (files, description) using infoHash or ID
    const identifier = torrent.infoHash || torrent.id;
    if (identifier && (!torrent.files || !torrent.description)) {
      setLoadingDetail(true);
      getTorrentDetail(identifier)
        .then((res) => {
          if (res?.torrent) {
            setDetail((prev) => ({ ...prev, ...res.torrent }));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingDetail(false));
    }
  }, [torrent]);

  if (!visible || !torrent) return null;

  const currentItem = detail || torrent;
  const playable = isPlayableTorrent(currentItem);
  const formatLabel = getContentFormatLabel(currentItem);
  const magnet = currentItem.magnet || torrent.magnet;
  const posterUrl = metadata?.poster || metadata?.background;
  const backdropUrl = metadata?.background || metadata?.poster;
  const displayTitle = metadata?.name || currentItem.title || torrent.title;
  const seeders = parseInt(currentItem.seeders || torrent.seeders) || 0;
  const leechers = parseInt(currentItem.leechers || torrent.leechers) || 0;

  const handleCopy = () => {
    if (magnet) {
      onCopyMagnet(magnet, 'Magnet link copied to clipboard!');
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDirectDownload = () => {
    if (magnet) {
      onCopyMagnet(magnet, 'Opening magnet link in torrent client...');
      window.location.href = magnet;
    }
  };

  return (
    <div className="detail-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="detail-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Backdrop Banner Header */}
        <div
          className="detail-header-banner"
          style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none' }}
        >
          <div className="banner-vignette" />
          <button className="detail-close-btn" onClick={onClose} title="Close">
            <X size={22} />
          </button>

          <div className="banner-overlay-content">
            <div className="banner-badges">
              {currentItem?.category && (
                <span className="badge-pill badge-category">
                  {currentItem.category.toUpperCase()}
                </span>
              )}
              {!playable && (
                <span className="badge-pill badge-archive">
                  <Package size={12} /> {formatLabel}
                </span>
              )}
              {metadata?.year && (
                <span className="badge-pill">
                  <Calendar size={12} /> {metadata.year}
                </span>
              )}
              {metadata?.rating && (
                <span className="badge-pill hero-rating-pill">
                  <Star size={12} fill="#f59e0b" color="#f59e0b" /> {metadata.rating}
                </span>
              )}
            </div>
            <h1 className="banner-title">{displayTitle}</h1>
          </div>
        </div>

        {/* Modal Body */}
        <div className="detail-body-container">
          {/* Non-Playable Notice Banner (Only shown if unplayable like ZIP/ISO/EXE/Games) */}
          {!playable && (
            <div className="unplayable-notice-banner glass-panel">
              <Package size={20} color="#f59e0b" className="notice-icon" />
              <div className="notice-text-wrap">
                <span className="notice-title">Direct Torrent Download Format ({formatLabel})</span>
                <p className="notice-desc">
                  This release contains non-video files (.zip, .iso, .exe, or game/software data).
                  Online video streaming is disabled — directly download the torrent or copy the magnet below.
                </p>
              </div>
            </div>
          )}

          {/* Main Action Bar */}
          <div className="detail-action-bar">
            {/* Stream Button - ONLY shown if content is playable video format */}
            {playable ? (
              <>
                <button
                  className="neu-button neu-button-primary detail-btn-play"
                  onClick={() => { onClose(); onStream(currentItem); }}
                >
                  <Play size={20} fill="#ffffff" />
                  <span>STREAM / CHOOSE PLAYER</span>
                </button>

                <button
                  className="neu-button detail-btn-download"
                  onClick={handleDirectDownload}
                >
                  <Download size={18} />
                  <span>DOWNLOAD TORRENT</span>
                </button>
              </>
            ) : (
              /* Non-playable format: Directly show Download Torrent option as primary */
              <button
                className="neu-button neu-button-primary detail-btn-download-primary"
                onClick={handleDirectDownload}
              >
                <Download size={20} />
                <span>DOWNLOAD TORRENT (MAGNET)</span>
              </button>
            )}

            {magnet && (
              <button
                className={`neu-button detail-btn-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? <Check size={18} className="copy-check-icon" /> : <Copy size={18} />}
                <span>{copied ? 'Magnet Link Copied!' : 'Copy Magnet Link'}</span>
              </button>
            )}

            {playable && metadata?.trailerUrl && (
              <a
                href={metadata.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-button detail-btn-trailer"
              >
                <Film size={18} color="#ef4444" />
                <span>Watch Trailer</span>
              </a>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="detail-metrics-grid">
            <div className="metric-tile neu-inset">
              <ArrowUp size={20} color="var(--seeder)" />
              <div className="metric-tile-info">
                <span className="metric-tile-val" style={{ color: 'var(--seeder)' }}>
                  {seeders.toLocaleString()}
                </span>
                <span className="metric-tile-lbl">Active Seeders</span>
              </div>
            </div>

            <div className="metric-tile neu-inset">
              <ArrowDown size={20} color="var(--leecher)" />
              <div className="metric-tile-info">
                <span className="metric-tile-val" style={{ color: 'var(--leecher)' }}>
                  {leechers.toLocaleString()}
                </span>
                <span className="metric-tile-lbl">Leechers</span>
              </div>
            </div>

            <div className="metric-tile neu-inset">
              <HardDrive size={20} color="var(--accent-primary)" />
              <div className="metric-tile-info">
                <span className="metric-tile-val">{currentItem?.size || torrent.size || 'N/A'}</span>
                <span className="metric-tile-lbl">File Size</span>
              </div>
            </div>

            <div className="metric-tile neu-inset">
              <Clock size={20} color="var(--text-muted)" />
              <div className="metric-tile-info">
                <span className="metric-tile-val">{currentItem?.age || torrent.age || 'Recent'}</span>
                <span className="metric-tile-lbl">Upload Age</span>
              </div>
            </div>
          </div>

          {/* Release Information */}
          <div className="detail-section">
            <h3 className="section-title">About this Release</h3>
            <p className="section-text">
              {metadata?.description || currentItem?.description || torrent.title}
            </p>
          </div>

          {/* Files List (if available) */}
          {currentItem?.files && currentItem.files.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title">
                <Layers size={18} /> Included Files ({currentItem.files.length})
              </h3>
              <div className="files-list neu-inset">
                {currentItem.files.map((file, i) => (
                  <div key={i} className="file-item-row">
                    <FileText size={15} className="file-icon" />
                    <span className="file-name-text">{typeof file === 'string' ? file : file?.name || String(file)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Magnet URI Box */}
          {magnet && (
            <div className="detail-section">
              <h3 className="section-title">Magnet URI</h3>
              <div className="magnet-uri-box neu-inset" onClick={handleCopy} title="Click to copy">
                <code className="magnet-code-text">{magnet}</code>
                <span className="magnet-hint">Click to copy</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
