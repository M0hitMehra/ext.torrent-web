/**
 * HeroBanner.jsx
 * Netflix Billboard Hero section featuring a trending blockbuster.
 * Features high-res cinematic backdrop, metadata badges, and streaming triggers.
 */
import React, { useState, useEffect } from 'react';
import {
  Play,
  Info,
  Film,
  Star,
  Copy,
  Check,
  ArrowUp,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { fetchMediaMetadata } from '../api/metaApi';

export function HeroBanner({ torrent, onStream, onDetails, onCopyMagnet }) {
  const [metadata, setMetadata] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (torrent?.title) {
      fetchMediaMetadata(torrent.title).then((meta) => {
        if (active && meta) setMetadata(meta);
      });
    }
    return () => { active = false; };
  }, [torrent]);

  if (!torrent) return null;

  const backdropUrl = metadata?.background || metadata?.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';
  const displayTitle = metadata?.name || torrent.title;
  const seeders = parseInt(torrent.seeders) || 0;

  const handleCopy = () => {
    if (torrent.magnet) {
      onCopyMagnet(torrent.magnet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="hero-banner-container">
      {/* Cinematic Backdrop Image with Overlay Gradients */}
      <div
        className="hero-backdrop"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="hero-vignette-overlay" />
        <div className="hero-bottom-fade" />
      </div>

      {/* Hero Content Block */}
      <div className="hero-content">
        {/* Release Badges Row */}
        <div className="hero-badges-row">
          <span className="hero-featured-tag">🔥 #1 FEATURED RELEASE</span>
          {metadata?.year && (
            <span className="badge-pill hero-pill">
              <Calendar size={12} /> {metadata.year}
            </span>
          )}
          {metadata?.rating && (
            <span className="badge-pill hero-rating-pill">
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {metadata.rating}
            </span>
          )}
          <span className="badge-pill badge-seeder">
            <ArrowUp size={12} /> {seeders.toLocaleString()} Seeders
          </span>
          {torrent.size && (
            <span className="badge-pill hero-pill">
              <HardDrive size={12} /> {torrent.size}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="hero-title">{displayTitle}</h1>

        {/* Genres List */}
        {metadata?.genres && metadata.genres.length > 0 && (
          <div className="hero-genres">
            {metadata.genres.map((g, i) => (
              <span key={i} className="hero-genre-item">{g}</span>
            ))}
          </div>
        )}

        {/* Overview / Description */}
        <p className="hero-description">
          {metadata?.description || torrent.title}
        </p>

        {/* Action Buttons */}
        <div className="hero-actions-row">
          {/* Primary Stream Now Button */}
          <button
            className="neu-button neu-button-primary hero-btn-play"
            onClick={() => onStream(torrent)}
          >
            <Play size={20} fill="#ffffff" />
            <span>STREAM NOW</span>
          </button>

          {/* More Info Button */}
          <button
            className="neu-button hero-btn-info"
            onClick={() => onDetails(torrent)}
          >
            <Info size={19} />
            <span>More Details</span>
          </button>

          {/* Copy Magnet Link */}
          {torrent.magnet && (
            <button
              className={`neu-button hero-btn-copy ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy Magnet Link"
            >
              {copied ? <Check size={18} className="copy-check-icon" /> : <Copy size={18} />}
              <span>{copied ? 'Copied Magnet!' : 'Copy Magnet'}</span>
            </button>
          )}

          {/* Watch Official Trailer (if available) */}
          {metadata?.trailerUrl && (
            <a
              href={metadata.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-button hero-btn-trailer"
            >
              <Film size={18} color="#ef4444" />
              <span>Watch Trailer</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeroBanner;
