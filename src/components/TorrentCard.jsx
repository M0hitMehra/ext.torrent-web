/**
 * TorrentCard.jsx
 * Netflix-style Glassmorphic Neumorphic Card.
 * Displays high-res posters, seeder metrics, and format-aware action controls.
 * Non-playable content (ZIP, RAR, ISO, EXE, Games, Software) directly shows Download options.
 */
import React, { useState, useEffect } from 'react';
import {
  Play,
  Info,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  HardDrive,
  Star,
  Film,
  Download,
  Package,
} from 'lucide-react';
import { fetchMediaMetadata } from '../api/metaApi';
import { isPlayableTorrent, getContentFormatLabel } from '../utils/mediaType';

export function TorrentCard({ torrent, onStream, onDetails, onCopyMagnet }) {
  const [metadata, setMetadata] = useState(null);
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (torrent?.title) {
      fetchMediaMetadata(torrent.title).then((meta) => {
        if (active && meta) setMetadata(meta);
      });
    }
    return () => { active = false; };
  }, [torrent?.title]);

  if (!torrent) return null;

  const playable = isPlayableTorrent(torrent);
  const posterUrl = metadata?.poster || metadata?.background || null;
  const displayTitle = metadata?.name || torrent.title;
  const seeders = parseInt(torrent.seeders) || 0;
  const leechers = parseInt(torrent.leechers) || 0;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (torrent.magnet) {
      onCopyMagnet(torrent.magnet, 'Magnet link copied to clipboard!');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirectDownload = (e) => {
    e.stopPropagation();
    if (torrent.magnet) {
      onCopyMagnet(torrent.magnet, 'Opening magnet in torrent client...');
      window.location.href = torrent.magnet;
    }
  };

  return (
    <div className="torrent-card glass-panel" onClick={() => onDetails(torrent)}>
      {/* Media Image / Poster Container */}
      <div className="card-media-wrap">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={displayTitle}
            className={`card-poster-img ${imageLoaded ? 'loaded' : ''}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="card-placeholder-art">
            {playable ? (
              <Film size={36} className="placeholder-film-icon" />
            ) : (
              <Package size={36} className="placeholder-film-icon" color="#f59e0b" />
            )}
            <span className="placeholder-cat">{torrent.category || 'Release'}</span>
          </div>
        )}

        {/* Quality / Rating Badges Top Right */}
        <div className="card-top-badges">
          {!playable && (
            <span className="badge-pill card-archive-badge">
              <Package size={10} /> {getContentFormatLabel(torrent)}
            </span>
          )}
          {metadata?.rating && (
            <span className="badge-pill card-rating-badge">
              <Star size={11} fill="#f59e0b" color="#f59e0b" /> {metadata.rating}
            </span>
          )}
          {torrent.source && (
            <span className="badge-pill card-source-badge">
              {torrent.source.toUpperCase()}
            </span>
          )}
        </div>

        {/* Card Overlay on Hover */}
        <div className="card-hover-overlay">
          <div className="hover-actions-bar">
            {/* Play Button - ONLY shown if content is a playable video format */}
            {playable ? (
              <button
                className="hover-action-btn btn-play"
                onClick={(e) => { e.stopPropagation(); onStream(torrent); }}
                title="Stream In-App"
              >
                <Play size={18} fill="#ffffff" />
              </button>
            ) : (
              /* For non-playable content (ZIP/ISO/EXE/Games), directly show Download button */
              <button
                className="hover-action-btn btn-download-primary"
                onClick={handleDirectDownload}
                title="Download Torrent File / Magnet"
              >
                <Download size={18} />
              </button>
            )}

            {/* Copy Magnet Button */}
            {torrent.magnet && (
              <button
                className={`hover-action-btn btn-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy Magnet Link"
              >
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              </button>
            )}

            {/* Info Button */}
            <button
              className="hover-action-btn btn-info"
              onClick={(e) => { e.stopPropagation(); onDetails(torrent); }}
              title="Release Details"
            >
              <Info size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="card-body">
        <h3 className="card-title" title={torrent.title}>
          {displayTitle}
        </h3>

        {/* Metrics Row: Seeders, Leechers, Size */}
        <div className="card-metrics-row">
          <span className="metric-tag seeders-tag" title="Active Seeders">
            <ArrowUp size={12} /> {seeders.toLocaleString()}
          </span>
          <span className="metric-tag leechers-tag" title="Active Leechers">
            <ArrowDown size={12} /> {leechers.toLocaleString()}
          </span>
          {torrent.size && (
            <span className="metric-tag size-tag" title="File Size">
              <HardDrive size={12} /> {torrent.size}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TorrentCard;
