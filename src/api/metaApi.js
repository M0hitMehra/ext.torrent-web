/**
 * metaApi.js
 * Enriches torrent items with high-definition posters, backdrops,
 * IMDb ratings, synopsis, and YouTube trailer links.
 * Uses public Cinemeta & TVMaze free APIs with local caching.
 * Performs intelligent title cleaning to strip website URLs, release groups, and scene tags.
 */
import axios from 'axios';

const metaCache = new Map();

/**
 * Intelligently cleans raw torrent titles:
 * - Strips site domain prefixes (e.g. www.UIndex.org, 1337x.to, YTS.mx)
 * - Strips bracketed release groups and scene markers
 * - Extracts 4-digit release year
 * - Cuts off at resolution / audio codec / season markers
 */
export function cleanTitle(rawTitle) {
  if (!rawTitle) return { title: '', year: null };

  let title = rawTitle;

  // 1. Strip domain names and site branding prefixes (e.g. www.UIndex.org, 1337x.to)
  title = title
    .replace(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:org|com|net|to|mx|lt|ws|is|cz|cc|re|tv|me|info|io|top|site|xyz|online|app|dev|biz|mobi|ru|in)\b/gi, ' ')
    .replace(/\bwww\s+[a-zA-Z0-9-]+\s+(?:org|com|net|to|mx|lt|ws|is|cz|cc|re|tv|me|info|io|top|site|xyz|online)\b/gi, ' ')
    .replace(/\b(?:uindex|1337x|galaxyrg|eztv|rarbg|ettv|rartv|yts|yify|fitgirl|dodi|psa|tgx|vostfr|multi|glodls)\b/gi, ' ');

  // 2. Extract 4-digit release year (1920 - 2035)
  const yearMatch = title.match(/\b(19[2-9]\d|20[0-3]\d)\b/);
  const year = yearMatch ? yearMatch[1] : null;

  // If year is present and title contains year, cut before year if sufficient title length exists
  if (year && title.includes(year)) {
    const beforeYear = title.split(year)[0];
    if (beforeYear.replace(/[^a-zA-Z0-9]/g, '').trim().length >= 2) {
      title = beforeYear;
    }
  }

  // 3. Remove bracketed / parenthetical release tags
  title = title.replace(/\[.*?\]|\(.*?\)/g, ' ');

  // 4. Cut off at standard media tags
  const cutOffPatterns = [
    /\b(s\d{1,2}\s*-\s*s\d{1,2}|s\d{1,2}e\d{1,2}|s\d{1,2}|season\s*\d{1,2})\b/i,
    /\b(1080p|720p|2160p|4k|8k|uhd|fhd|bluray|blu-ray|bdrip|webrip|web-dl|webdl|hdrip|dvdrip|hdtv|cam)\b/i,
  ];
  for (const p of cutOffPatterns) {
    const m = title.match(p);
    if (m && m.index > 2) {
      title = title.slice(0, m.index);
    }
  }

  // 5. Remove video/audio codecs and scene tokens
  title = title
    .replace(/\b(x264|x265|h264|h265|hevc|avc|10bit|remux|repack|proper|unrated|extended|dts|truehd|atmos|ac3|aac|mp3|flac|dual|multi|subs?)\b/gi, ' ')
    .replace(/[\._\-\+:]/g, ' ')
    .replace(/[\(\)\[\]\{\}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If resulting title is empty, fallback to clean alphanumeric
  if (!title || title.length < 2) {
    title = rawTitle.replace(/\[.*?\]|\(.*?\)/g, '').replace(/[\._\-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return { title, year };
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
    const res = await axios.get(cinemetaUrl, { timeout: 5000 });
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
    const res = await axios.get(seriesUrl, { timeout: 5000 });
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

  // 3. Fallback: TVMaze safe array search (avoids 404 console errors)
  try {
    const tvmazeUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`;
    const res = await axios.get(tvmazeUrl, {
      timeout: 5000,
      validateStatus: (status) => status < 500,
    });
    if (Array.isArray(res.data) && res.data.length > 0 && res.data[0]?.show) {
      const show = res.data[0].show;
      if (show.image) {
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
          imdbId: show.externals?.imdb || null,
          type: 'series',
        };
        metaCache.set(cacheKey, enriched);
        return enriched;
      }
    }
  } catch (_) {}

  metaCache.set(cacheKey, null);
  return null;
}

export default {
  cleanTitle,
  fetchMediaMetadata,
};
