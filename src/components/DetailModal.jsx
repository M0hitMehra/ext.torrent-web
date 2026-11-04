/**
 * DetailModal.jsx
 * Netflix-style Expanded Detail Modal.
 * Rich media metadata: Director, Cast portraits with character roles,
 * Ratings, Storyline synopsis, and "More Like This" Recommendations.
 * If content is genuinely unplayable (ZIP, RAR, ISO, EXE, Game repacks), disables streaming
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
  Users,
  Sparkles,
  Clapperboard,
  Search,
} from 'lucide-react';
import { fetchRichMediaDetails } from '../api/metaApi';
import { getTorrentDetail } from '../api/torrentApi';
import { isPlayableTorrent, getContentFormatLabel } from '../utils/mediaType';

export function DetailModal({
  visible,
  onClose,
  torrent,
  onStream,
  onCopyMagnet,
  onSelectRecommendation,
}) {
  const [detail, setDetail] = useState(torrent);
  const [metadata, setMetadata] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDetail(torrent);
    if (!torrent) return;

    // Fetch Rich Metadata (Director, Cast, Synopsis, Ratings, Recs)
    fetchRichMediaDetails(torrent.title).then(setMetadata);

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
  const backdropUrl = metadata?.background || metadata?.poster;
  const displayTitle = metadata?.title || metadata?.name || currentItem.title || torrent.title;
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

  const handleRecClick = (recTitle) => {
    if (onSelectRecommendation && recTitle) {
      onClose();
      onSelectRecommendation(recTitle);
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
              {metadata?.runtime && (
                <span className="badge-pill">
                  <Clock size={12} /> {metadata.runtime}
                </span>
              )}
              {metadata?.rating && (
                <span className="badge-pill hero-rating-pill">
                  <Star size={12} fill="#f59e0b" color="#f59e0b" /> {metadata.rating} / 10
                </span>
              )}
            </div>

            <h1 className="banner-title">{displayTitle}</h1>

            {/* Director / Creator Line */}
            {metadata?.director && (
              <div className="banner-director-tag">
                <Clapperboard size={15} color="#ec4899" />
                <span>
                  Directed by <strong>{metadata.director}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="detail-body-container">
          {/* Non-Playable Notice Banner (Only shown if unplayable like genuine ZIP/ISO/EXE/Games) */}
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
            {/* Stream Button - Prominently shown whenever content is playable */}
            {playable ? (
              <>
                <button
                  className="neu-button neu-button-primary detail-btn-play"
                  onClick={() => { onClose(); onStream(currentItem); }}
                >
                  <Play size={20} fill="#ffffff" />
                  <span>STREAM NOW (1080P)</span>
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

          {/* Synopsis / Storyline Section */}
          <div className="detail-section">
            <h3 className="section-title">
              {metadata?.overview ? 'Storyline & Overview' : 'About this Release'}
            </h3>
            <p className="section-text">
              {metadata?.overview || metadata?.description || currentItem?.description || torrent.title}
            </p>
          </div>

          {/* Top Cast & Actors Carousel Section */}
          {metadata?.cast && metadata.cast.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title">
                <Users size={18} color="var(--accent-primary)" /> Top Cast & Characters
              </h3>
              <div className="cast-carousel-row">
                {metadata.cast.map((actor, idx) => (
                  <div key={idx} className="cast-card glass-panel">
                    <div className="cast-photo-wrap">
                      {actor.photo ? (
                        <img
                          src={actor.photo}
                          alt={actor.name}
                          className="cast-photo-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="cast-photo-placeholder">
                          <Users size={22} color="var(--text-muted)" />
                        </div>
                      )}
                    </div>
                    <div className="cast-info">
                      <span className="cast-name" title={actor.name}>{actor.name}</span>
                      <span className="cast-character" title={actor.character}>{actor.character}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* More Like This / Recommendations Shelf */}
          {metadata?.recommendations && metadata.recommendations.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title">
                <Sparkles size={18} color="#f59e0b" /> More Like This
              </h3>
              <div className="recs-carousel-row">
                {metadata.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="rec-card glass-panel"
                    onClick={() => handleRecClick(rec.title)}
                    title={`Search torrents for ${rec.title}`}
                  >
                    <div className="rec-poster-wrap">
                      {rec.poster ? (
                        <img
                          src={rec.poster}
                          alt={rec.title}
                          className="rec-poster-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="rec-poster-placeholder">
                          <Film size={26} color="var(--text-muted)" />
                        </div>
                      )}
                      {rec.rating && (
                        <span className="rec-rating-badge">
                          <Star size={10} fill="#f59e0b" color="#f59e0b" /> {rec.rating}
                        </span>
                      )}
                    </div>
                    <div className="rec-info">
                      <span className="rec-title">{rec.title}</span>
                      <span className="rec-year">{rec.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    <span className="file-name-text">
                      {typeof file === 'string' ? file : file?.name || String(file)}
                    </span>
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