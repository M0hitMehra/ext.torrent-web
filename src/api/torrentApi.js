/**
 * torrentApi.js
 * Client interface for the deployed Ext.to API Gateway on Render.
 */
import axios from 'axios';

export const API_BASE_URL = 'https://ext-torrent-backend.onrender.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Accept': 'application/json',
  },
});

export const CATEGORIES = [
  { slug: 'all',      label: 'All Releases',  icon: 'Film' },
  { slug: 'movies',   label: 'Movies',        icon: 'Clapperboard' },
  { slug: 'tv',       label: 'TV Series',     icon: 'Tv' },
  { slug: 'music',    label: 'Music',         icon: 'Music' },
  { slug: 'games',    label: 'Games',         icon: 'Gamepad2' },
  { slug: 'software', label: 'Software',      icon: 'Cpu' },
  { slug: 'anime',    label: 'Anime',         icon: 'Sparkles' },
  { slug: 'books',    label: 'Books',         icon: 'BookOpen' },
];

export const SORT_OPTIONS = [
  { value: 'seeders', order: 'desc', label: 'Most Seeders' },
  { value: 'time',    order: 'desc', label: 'Newest First' },
  { value: 'size',    order: 'desc', label: 'Largest Size' },
  { value: 'size',    order: 'asc',  label: 'Smallest Size' },
];

/**
 * Test connectivity to Render backend.
 */
export async function checkBackendHealth() {
  try {
    const res = await client.get('/');
    return { ok: true, version: res.data?.version, engine: res.data?.engine };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Search torrents by keyword.
 */
export async function searchTorrents({ q, page = 1, sort = 'seeders', order = 'desc', category = 'all' }) {
  const res = await client.get('/api/search', {
    params: { q, page, sort, order, category },
  });
  return res.data;
}

/**
 * Fetch trending torrents.
 */
export async function getTrending(category = 'all') {
  const res = await client.get('/api/trending', {
    params: { category },
  });
  return res.data;
}

/**
 * Fetch latest uploaded torrents.
 */
export async function getLatest(page = 1) {
  const res = await client.get('/api/latest', {
    params: { page },
  });
  return res.data;
}

/**
 * Browse torrents by category.
 */
export async function browseTorrents({ category = 'movies', page = 1, sort = 'seeders', order = 'desc' }) {
  const res = await client.get('/api/browse', {
    params: { category, page, sort, order },
  });
  return res.data;
}

/**
 * Get full torrent details by id.
 */
export async function getTorrentDetail(id) {
  const res = await client.get(`/api/torrent/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Fetch magnet link by id.
 */
export async function getMagnet(id) {
  const res = await client.get(`/api/magnet/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Fetch high-definition stream sources (PopcornTV & multi-embed network).
 */
export async function getMovieStreams(id) {
  try {
    const res = await client.get(`/api/stream/movie/${encodeURIComponent(id)}`);
    return res.data;
  } catch (err) {
    // If backend proxy fails or is updating, return direct fallback sources
    return {
      success: true,
      sources: [
        { provider: 'VidLink (Ad-Free)', embedUrl: `https://vidlink.pro/movie/${id}?primaryColor=6366f1&autoplay=true`, quality: '1080p', status: 'active', adLevel: 'none' },
        { provider: 'VidCore HD', embedUrl: `https://vidcore.org/embed/movie/${id}`, quality: '1080p', status: 'active', adLevel: 'none' },
        { provider: 'AutoEmbed Player', embedUrl: `https://player.autoembed.cc/embed/movie/${id}?autoplay=1`, quality: '1080p', status: 'active', adLevel: 'light' },
        { provider: 'VixHD Stream', embedUrl: `https://vidsrc.hair/embed/movie/${id}?autoPlay=1`, quality: '1080p', status: 'active', adLevel: 'light' },
        { provider: 'EmbedSU Ultra', embedUrl: `https://embed.su/embed/movie/${id}`, quality: '1080p', status: 'active', adLevel: 'light' },
      ],
    };
  }
}

export async function getTvStreams(id, season = 1, episode = 1) {
  try {
    const res = await client.get(`/api/stream/tv/${encodeURIComponent(id)}`, {
      params: { s: season, e: episode },
    });
    return res.data;
  } catch (err) {
    return {
      success: true,
      sources: [
        { provider: 'VidLink (Ad-Free)', embedUrl: `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=6366f1&autoplay=true`, quality: '1080p', status: 'active', adLevel: 'none' },
        { provider: 'VidCore HD', embedUrl: `https://vidcore.org/embed/tv/${id}/${season}/${episode}`, quality: '1080p', status: 'active', adLevel: 'none' },
        { provider: 'AutoEmbed Player', embedUrl: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}?autoplay=1`, quality: '1080p', status: 'active', adLevel: 'light' },
        { provider: 'VixHD Stream', embedUrl: `https://vidsrc.hair/embed/tv/${id}/${season}/${episode}?autoPlay=1`, quality: '1080p', status: 'active', adLevel: 'light' },
      ],
    };
  }
}

export default {
  checkBackendHealth,
  searchTorrents,
  getTrending,
  getLatest,
  browseTorrents,
  getTorrentDetail,
  getMagnet,
  getMovieStreams,
  getTvStreams,
};
