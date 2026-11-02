/**
 * DetailModal.jsx
 * Netflix-style Expanded Detail Modal.
 * Displays high-res posters, metadata, file list, seeder metrics, and player options.
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Copy,
  Check,
  Star,
  Calendar,
  HardDrive,
  ArrowUp,
  ArrowDown,
  Film,
  FileText,
  User,
  Clock,
  Layers,
} from 'lucide-react';
import { fetchMediaMetadata } from '../api/metaApi';
import { getTorrentDetail } from '../api/torrentApi';

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

    // Fetch full torrent detail (files, description) if id exists
    if (torrent.id && (!torrent.files || !torrent.description)) {
      setLoadingDetail(true);
      getTorrentDetail(torrent.id)
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

  const magnet = detail?.magnet || torrent.magnet;
  const posterUrl = metadata?.poster || metadata?.background;
  const backdropUrl = metadata?.background || metadata?.poster;
  const displayTitle = metadata?.name || torrent.title;
  const seeders = parseInt(detail?.seeders || torrent.seeders) || 0;
  const leechers = parseInt(detail?.leechers || torrent.leechers) || 0;

  const handleCopy = () => {
    if (magnet) {
      onCopyMagnet(magnet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
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
              {detail?.category && (
                <span className="badge-pill badge-category">
                  {detail.category.toUpperCase()}
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
          {/* Main Action Bar */}
          <div className="detail-action-bar">
            <button
              className="neu-button neu-button-primary detail-btn-play"
              onClick={() => { onClose(); onStream(detail || torrent); }}
            >
              <Play size={20} fill="#ffffff" />
              <span>STREAM IN WEBTOR</span>
            </button>

            {magnet && (
              <button
                className={`neu-button detail-btn-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? <Check size={18} className="copy-check-icon" /> : <Copy size={18} />}
                <span>{copied ? 'Magnet Link Copied!' : 'Copy Magnet Link'}</span>
              </button>
            )}

            {metadata?.trailerUrl && (
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
                <span className="metric-tile-val">{detail?.size || torrent.size || 'N/A'}</span>
                <span className="metric-tile-lbl">File Size</span>
              </div>
            </div>

            <div className="metric-tile neu-inset">
              <Clock size={20} color="var(--text-muted)" />
              <div className="metric-tile-info">
                <span className="metric-tile-val">{detail?.age || torrent.age || 'Recent'}</span>
                <span className="metric-tile-lbl">Upload Age</span>
              </div>
            </div>
          </div>

          {/* Release Information */}
          <div className="detail-section">
            <h3 className="section-title">About this Release</h3>
            <p className="section-text">
              {metadata?.description || detail?.description || torrent.title}
            </p>
          </div>

          {/* Files List (if available) */}
          {detail?.files && detail.files.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title">
                <Layers size={18} /> Included Files ({detail.files.length})
              </h3>
              <div className="files-list neu-inset">
                {detail.files.map((file, i) => (
                  <div key={i} className="file-item-row">
                    <FileText size={15} className="file-icon" />
                    <span className="file-name-text">{file}</span>
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
