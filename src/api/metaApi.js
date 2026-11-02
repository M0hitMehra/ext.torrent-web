/**
 * metaApi.js
 * Enriches torrent items with high-definition posters, backdrops,
 * IMDb ratings, synopsis, and YouTube trailer links.
 * Uses public Cinemeta & TVMaze free APIs with local caching.
 */
import axios from 'axios';

const metaCache = new Map();

/**
 * Strips scene release tags (resolutions, audio codecs, repack tags)
 * to isolate the clean movie or series title and year.
 */
export function cleanTitle(rawTitle) {
  if (!rawTitle) return { title: '', year: null };

  let title = rawTitle;

  // Extract 4-digit year (1950 - 2030)
  const yearMatch = title.match(/\b(19\d\d|20[0-3]\d)\b/);
  const year = yearMatch ? yearMatch[1] : null;

  // Remove common scene tags and garbage
  title = title
    .replace(/\[.*?\]|\(.*?\)/g, ' ')
    .replace(/\b(1080p|720p|2160p|4k|uhd|bluray|blu-ray|bdrip|webrip|web-dl|hdrip|dvdrip|cam|ts)\b/gi, '')
    .replace(/\b(x264|x265|hevc|h264|h265|avc|10bit|remux|repack|yify|yts|fitgirl|rartv|eztv|galaxy)\b/gi, '')
    .replace(/\b(dts|dts-hd|truehd|atmos|ddp5\.1|dd5\.1|ac3|aac|mp3|flac|multi|dual|subs?)\b/gi, '')
    .replace(/\b(s\d{1,2}e\d{1,2}|s\d{1,2}|season\s*\d{1,2}|complete)\b/gi, '')
    .replace(/[\._\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If year was found, cut off after the year
  if (year && title.includes(year)) {
    title = title.split(year)[0].trim();
  }

  return { title: title || rawTitle, year };
}

/**
 * Fetch poster, backdrop, synopsis, and trailer from Cinemeta or TVMaze.
 */
export async function fetchMediaMetadata(rawTitle) {
  if (!rawTitle) return null;

  const { title, year } = cleanTitle(rawTitle);
  if (!title || title.length < 2) return null;

  const cacheKey = `${title.toLowerCase()}_${year || ''}`;
  if (metaCache.has(cacheKey)) {
    return metaCache.get(cacheKey);
  }

  // 1. Try Cinemeta Movie search
  try {
    const movieQuery = encodeURIComponent(title);
    const cinemetaUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${movieQuery}.json`;
    const res = await axios.get(cinemetaUrl, { timeout: 6000 });
    const meta = res.data?.metas?.[0];

    if (meta && meta.poster) {
      const enriched = {
        name: meta.name || title,
        poster: meta.poster,
        background: meta.background || meta.poster,
        rating: meta.imdbRating || null,
        year: meta.year || year,
        genres: meta.genres || [],
        description: meta.description || null,
        trailerUrl: meta.trailer ? `https://www.youtube.com/watch?v=${meta.trailer}` : null,
        trailerKey: meta.trailer || null,
        imdbId: meta.imdb_id || null,
        type: 'movie',
      };
      metaCache.set(cacheKey, enriched);
      return enriched;
    }
  } catch (_) {}

  // 2. Try Cinemeta Series search
  try {
    const seriesQuery = encodeURIComponent(title);
    const seriesUrl = `https://v3-cinemeta.strem.io/catalog/series/top/search=${seriesQuery}.json`;
    const res = await axios.get(seriesUrl, { timeout: 6000 });
    const meta = res.data?.metas?.[0];

    if (meta && meta.poster) {
      const enriched = {
        name: meta.name || title,
        poster: meta.poster,
        background: meta.background || meta.poster,
        rating: meta.imdbRating || null,
        year: meta.year || year,
        genres: meta.genres || [],
        description: meta.description || null,
        trailerUrl: meta.trailer ? `https://www.youtube.com/watch?v=${meta.trailer}` : null,
        trailerKey: meta.trailer || null,
        imdbId: meta.imdb_id || null,
        type: 'series',
      };
      metaCache.set(cacheKey, enriched);
      return enriched;
    }
  } catch (_) {}

  // 3. Fallback: TVMaze API
  try {
    const tvmazeUrl = `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(title)}`;
    const res = await axios.get(tvmazeUrl, { timeout: 5000 });
    if (res.data && res.data.image) {
      const show = res.data;
      const enriched = {
        name: show.name || title,
        poster: show.image?.original || show.image?.medium,
        background: show.image?.original || show.image?.medium,
        rating: show.rating?.average ? String(show.rating.average) : null,
        year: show.premiered ? show.premiered.slice(0, 4) : year,
        genres: show.genres || [],
        description: show.summary ? show.summary.replace(/<[^>]+>/g, '') : null,
        trailerUrl: null,
        trailerKey: null,
        type: 'series',
      };
      metaCache.set(cacheKey, enriched);
      return enriched;
    }
  } catch (_) {}

  metaCache.set(cacheKey, null);
  return null;
}

export default {
  cleanTitle,
  fetchMediaMetadata,
};
