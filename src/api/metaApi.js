/**
 * metaApi.js
 * Enriches torrent items with high-definition posters, backdrops,
 * Director, Cast (with photos & character roles), Synopsis, Ratings,
 * and "More Like This" Recommendations.
 * Integrates backend /api/meta with client-side PopcornTV TMDB and Cinemeta fallbacks.
 */
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://ext-torrent-backend.onrender.com';
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

  let title = String(rawTitle);

  // 1. Strip domain names and site branding prefixes
  title = title
    .replace(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:org|com|net|to|mx|lt|ws|is|cz|cc|re|tv|me|info|io|top|site|xyz|online|app|dev|biz|mobi|ru|in|gg|bz)\b/gi, ' ')
    .replace(/\bwww\s+[a-zA-Z0-9-]+\s+(?:org|com|net|to|mx|lt|ws|is|cz|cc|re|tv|me|info|io|top|site|xyz|online)\b/gi, ' ')
    .replace(/\b(?:uindex|1337x|galaxyrg|eztv|rarbg|ettv|rartv|yts|yify|fitgirl|dodi|psa|tgx|vostfr|multi|glodls)\b/gi, ' ');

  // 2. Extract 4-digit release year (1920 - 2035)
  const yearMatch = title.match(/\b(19[2-9]\d|20[0-3]\d)\b/);
  const year = yearMatch ? yearMatch[1] : null;

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
 * Primary Rich Metadata resolver:
 * Fetches Director, Cast with portraits, Overview, Ratings, Recommendations, and Trailers.
 */
export async function fetchRichMediaDetails(rawTitle, preferredYear = null) {
  if (!rawTitle) return null;

  const { title, year: parsedYear } = cleanTitle(rawTitle);
  const year = preferredYear || parsedYear;
  if (!title || title.length < 2) return null;

  const cacheKey = `rich_${title.toLowerCase()}_${year || ''}`;
  if (metaCache.has(cacheKey)) {
    return metaCache.get(cacheKey);
  }

  // 1. Try backend /api/meta gateway
  try {
    const backendRes = await axios.get(`${BACKEND_URL}/api/meta`, {
      params: { q: title, year },
      timeout: 5000,
    });
    if (backendRes.data?.success && backendRes.data?.data) {
      const data = backendRes.data.data;
      metaCache.set(cacheKey, data);
      return data;
    }
  } catch (_) {
    // Proceed to direct client fallback if backend is slow/starting
  }

  // 2. Direct client fallback to PopcornTV TMDB proxy
  try {
    const tmdbSearch = await axios.get(
      `https://popcorntv.site/api/tmdb/search/multi?query=${encodeURIComponent(title)}`,
      { timeout: 5000 }
    );
    const results = tmdbSearch.data?.results || [];
    if (results.length > 0) {
      const item = results.find(r => {
        if (year) {
          const itemYear = (r.release_date || r.first_air_date || '').slice(0, 4);
          return itemYear === String(year);
        }
        return true;
      }) || results[0];

      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
      const tmdbDetail = await axios.get(
        `https://popcorntv.site/api/tmdb/${mediaType}/${item.id}?append_to_response=credits,similar,videos`,
        { timeout: 5000 }
      );
      const d = tmdbDetail.data;

      // Extract Director/Creator
      const directors = (d.credits?.crew || [])
        .filter(c => c.job === 'Director')
        .map(c => c.name);
      const creators = (d.created_by || []).map(c => c.name);
      const director = directors.length > 0 ? directors.join(', ') : (creators.length > 0 ? creators.join(', ') : null);

      // Extract Cast
      const cast = (d.credits?.cast || []).slice(0, 10).map(c => ({
        name: c.name,
        character: c.character || 'Cast',
        photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));

      // Recommendations
      const recommendations = (d.similar?.results || []).slice(0, 8).map(r => ({
        id: r.id,
        title: r.title || r.name,
        year: (r.release_date || r.first_air_date || '').slice(0, 4),
        poster: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : null,
        rating: r.vote_average ? Number(r.vote_average.toFixed(1)) : null,
        type: mediaType,
      }));

      // Trailer
      let trailerUrl = null;
      const yt = (d.videos?.results || []).find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      if (yt?.key) {
        trailerUrl = `https://www.youtube.com/watch?v=${yt.key}`;
      }

      // Runtime
      let runtime = null;
      if (d.runtime) {
        const hrs = Math.floor(d.runtime / 60);
        const mins = d.runtime % 60;
        runtime = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      } else if (d.episode_run_time?.length) {
        runtime = `${d.episode_run_time[0]}m / ep`;
      }

      const richData = {
        id: d.id,
        title: d.title || d.name || title,
        name: d.title || d.name || title,
        tagline: d.tagline || null,
        overview: d.overview || '',
        description: d.overview || '',
        releaseDate: d.release_date || d.first_air_date || null,
        year: (d.release_date || d.first_air_date || '').slice(0, 4) || year,
        rating: d.vote_average ? Number(d.vote_average.toFixed(1)) : null,
        director,
        cast,
        genres: (d.genres || []).map(g => g.name),
        runtime,
        poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
        background: d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : null,
        recommendations,
        trailerUrl,
        type: mediaType,
        source: 'tmdb',
      };

      metaCache.set(cacheKey, richData);
      return richData;
    }
  } catch (_) {}

  // 3. Fallback to Cinemeta
  try {
    const cinemetaUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(title)}.json`;
    const res = await axios.get(cinemetaUrl, { timeout: 4000 });
    const meta = res.data?.metas?.[0];
    if (meta && meta.poster) {
      const richData = {
        id: meta.id,
        title: meta.name || title,
        name: meta.name || title,
        overview: meta.description || '',
        description: meta.description || '',
        year: meta.year || year,
        rating: meta.imdbRating ? Number(meta.imdbRating) : null,
        director: Array.isArray(meta.director) ? meta.director.join(', ') : meta.director || null,
        cast: (meta.cast || []).slice(0, 8).map(name => ({ name, character: 'Cast', photo: null })),
        genres: meta.genres || [],
        runtime: meta.runtime,
        poster: meta.poster,
        background: meta.background || meta.poster,
        recommendations: [],
        trailerUrl: meta.trailer ? `https://www.youtube.com/watch?v=${meta.trailer}` : null,
        type: 'movie',
        source: 'cinemeta',
      };
      metaCache.set(cacheKey, richData);
      return richData;
    }
  } catch (_) {}

  metaCache.set(cacheKey, null);
  return null;
}

/**
 * Legacy fetchMediaMetadata (kept for backward compatibility across cards)
 */
export async function fetchMediaMetadata(rawTitle) {
  const rich = await fetchRichMediaDetails(rawTitle);
  if (!rich) return null;
  return {
    ...rich,
    imdbId: rich.id,
  };
}

export default {
  cleanTitle,
  fetchRichMediaDetails,
  fetchMediaMetadata,
};