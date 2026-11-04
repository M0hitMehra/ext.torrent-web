/**
 * mediaType.js
 * Utility to detect whether a torrent contains streamable video media
 * or non-playable archive/installer/game/software formats (.zip, .rar, .iso, .exe, etc.).
 */

const UNPLAYABLE_EXTENSIONS = /\.(zip|rar|7z|tar|gz|bz2|iso|bin|cue|exe|msi|dmg|pkg|apk|cbr|cbz|epub|pdf|azw3|mobi)\b/i;
const PLAYABLE_VIDEO_EXTENSIONS = /\.(mp4|mkv|avi|webm|m4v|mov|flv|ts|m2ts)\b/i;

const UNPLAYABLE_CATEGORIES = ['games', 'software', 'apps', 'applications', 'books', 'ebooks', 'comics'];

/**
 * Checks whether the torrent content is streamable video or unplayable data/archive.
 * Returns true if streamable, false if download-only.
 */
export function isPlayableTorrent(torrent) {
  if (!torrent) return false;

  const category = (torrent.category || '').toLowerCase().trim();
  const title = (torrent.title || '').toLowerCase().trim();

  // 1. Explicit unplayable categories (Games, Software, Books)
  if (UNPLAYABLE_CATEGORIES.some(cat => category.includes(cat))) {
    return false;
  }

  // 2. Check title extension for archives, disk images, installers
  if (UNPLAYABLE_EXTENSIONS.test(title)) {
    return false;
  }

  // 3. Check for game repacks / software crack keywords
  const gameCrackKeywords = /\b(repack|fitgirl|dodi|codex|plaza|skidrow|flt|rune|tenoke|crack|setup|installer|patch|keygen)\b/i;
  if (gameCrackKeywords.test(title) && !category.includes('movie') && !category.includes('tv')) {
    return false;
  }

  // 4. Check file list if detailed files are available
  if (Array.isArray(torrent.files) && torrent.files.length > 0) {
    const hasVideo = torrent.files.some(f => {
      const fileName = typeof f === 'string' ? f : (f.name || '');
      return PLAYABLE_VIDEO_EXTENSIONS.test(fileName);
    });

    const isAllArchives = torrent.files.every(f => {
      const fileName = typeof f === 'string' ? f : (f.name || '');
      return UNPLAYABLE_EXTENSIONS.test(fileName);
    });

    if (isAllArchives || (!hasVideo && torrent.files.length > 0)) {
      return false;
    }
  }

  // 5. Positive video categories
  if (category.includes('movie') || category.includes('tv') || category.includes('anime') || category.includes('video')) {
    return true;
  }

  // 6. Common video scene tags in title
  const videoTags = /\b(1080p|720p|2160p|4k|uhd|bluray|blu-ray|bdrip|webrip|web-dl|hdrip|dvdrip|x264|x265|hevc|h264|h265|avc|s\d{1,2}e\d{1,2}|s\d{1,2}|season\s*\d{1,2})\b/i;
  if (videoTags.test(title)) {
    return true;
  }

  // Default to playable for entertainment, non-playable if extension unknown
  return true;
}

/**
 * Returns human-readable format badge text.
 */
export function getContentFormatLabel(torrent) {
  if (!torrent) return 'Download';

  const category = (torrent.category || '').toLowerCase();
  const title = (torrent.title || '').toLowerCase();

  if (category.includes('game') || title.includes('repack') || title.includes('fitgirl')) return 'Game Repack / Setup';
  if (category.includes('software') || title.endsWith('.exe') || title.endsWith('.dmg')) return 'Software App';
  if (category.includes('book') || title.endsWith('.pdf') || title.endsWith('.epub')) return 'Document / eBook';
  if (title.endsWith('.zip') || title.endsWith('.rar') || title.endsWith('.7z')) return 'Compressed Archive (ZIP/RAR)';
  if (title.endsWith('.iso')) return 'ISO Disk Image';

  return '1080p Streamable Video';
}

export default {
  isPlayableTorrent,
  getContentFormatLabel,
};
