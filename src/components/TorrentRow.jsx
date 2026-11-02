/**
 * TorrentRow.jsx
 * Netflix-style horizontal carousel row with smooth scrolling and navigation buttons.
 */
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TorrentCard } from './TorrentCard';

export function TorrentRow({ title, icon: Icon, torrents, onStream, onDetails, onCopyMagnet, onSeeMore }) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!torrents || torrents.length === 0) return null;

  return (
    <div className="torrent-row-section">
      {/* Row Header */}
      <div className="row-header">
        <div className="row-title-wrap">
          {Icon && <Icon size={22} className="row-title-icon" />}
          <h2 className="row-title">{title}</h2>
          <span className="row-count-badge">{torrents.length} releases</span>
        </div>

        {onSeeMore && (
          <button className="row-see-more-btn" onClick={onSeeMore}>
            Explore All <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Carousel Container */}
      <div className="carousel-wrapper">
        {/* Left Arrow */}
        <button
          className="carousel-nav-btn nav-left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Horizontal Scroll Track */}
        <div className="carousel-track" ref={rowRef}>
          {torrents.map((t, idx) => (
            <div key={t.id || idx} className="carousel-card-item">
              <TorrentCard
                torrent={t}
                onStream={onStream}
                onDetails={onDetails}
                onCopyMagnet={onCopyMagnet}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          className="carousel-nav-btn nav-right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

export default TorrentRow;
