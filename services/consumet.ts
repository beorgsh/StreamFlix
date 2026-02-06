
import { Movie, MediaInfo, StreamData, MediaCategory } from '../types';

const BASE_URL = 'https://consumet-alpha-steel.vercel.app';

// Helper to reliably normalize media types
const normalizeType = (type?: string): 'movie' | 'tv' => {
  if (!type) return 'movie';
  const lower = type.toLowerCase();
  // Check for common variations of TV show types
  if (lower === 'tv' || lower === 'tv series' || lower === 'tvs' || lower === 'series') return 'tv';
  return 'movie';
};

// Helper for TMDB images
const getTmdbImage = (path?: string | null) => {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : undefined;
};

export const fetchTrending = async (type: 'movie' | 'tv' | 'all' = 'all'): Promise<Movie[]> => {
  try {
    const response = await fetch(`${BASE_URL}/meta/tmdb/trending?type=${type}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    const results = data.results || [];
    return results.map((m: any) => ({
      id: String(m.id),
      title: m.title || m.name,
      image: m.image || getTmdbImage(m.poster_path) || getTmdbImage(m.backdrop_path),
      type: normalizeType(m.media_type || m.type),
      releaseDate: m.releaseDate || m.first_air_date,
      rating: m.rating,
    }));
  } catch (err) {
    console.error("Error fetching trending:", err);
    return [];
  }
};

export const fetchPopular = async (): Promise<Movie[]> => {
  try {
    const response = await fetch(`${BASE_URL}/meta/tmdb/popular`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    const results = data.results || [];
    return results.map((m: any) => ({
      id: String(m.id),
      title: m.title || m.name,
      image: m.image || getTmdbImage(m.poster_path) || getTmdbImage(m.backdrop_path),
      type: 'movie', // Popular endpoint usually defaults to movies unless specified
      releaseDate: m.releaseDate,
      rating: m.rating,
    }));
  } catch (err) {
    console.error("Error fetching popular:", err);
    return [];
  }
};

export const searchMedia = async (query: string): Promise<Movie[]> => {
  try {
    const response = await fetch(`${BASE_URL}/meta/tmdb/${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    const results = data.results || [];
    return results.map((m: any) => ({
      id: String(m.id),
      title: m.title || m.name,
      image: m.image || getTmdbImage(m.poster_path) || getTmdbImage(m.backdrop_path),
      type: normalizeType(m.type || m.media_type),
      releaseDate: m.releaseDate || m.first_air_date,
      rating: m.rating,
    }));
  } catch (err) {
    console.error("Error searching media:", err);
    return [];
  }
};

export const fetchInfo = async (id: string, type: string): Promise<MediaInfo> => {
  const fetchWithType = async (targetType: string) => {
    const url = `${BASE_URL}/meta/tmdb/info/${id}?type=${targetType}`;
    const res = await fetch(url);
    if (!res.ok) {
       throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  };

  let data;
  let usedType = normalizeType(type); // Normalize input type immediately

  try {
    data = await fetchWithType(usedType);
  } catch (error) {
    console.warn(`[Consumet] Fetch info failed for ID ${id} as ${usedType}. Retrying with alternate type...`);
    const fallbackType = usedType === 'movie' ? 'tv' : 'movie';
    try {
      data = await fetchWithType(fallbackType);
      usedType = fallbackType; 
    } catch (retryError) {
      console.error(`[Consumet] Retry failed for ID ${id} as ${fallbackType}.`);
      throw error; 
    }
  }
  
  let episodes: any[] = [];
  
  // Robust Episode Extraction Logic
  if (data.seasons && Array.isArray(data.seasons) && data.seasons.length > 0) {
    data.seasons.forEach((season: any) => {
      if (season.episodes && Array.isArray(season.episodes)) {
        const seasonNum = season.season_number || season.season;
        season.episodes.forEach((ep: any) => {
          episodes.push({
            ...ep,
            season: seasonNum || ep.season || ep.season_number
          });
        });
      }
    });
  }
  
  // If no episodes found from seasons, check the root 'episodes' array
  if (episodes.length === 0 && data.episodes && Array.isArray(data.episodes)) {
    episodes = data.episodes;
  }
  
  // Normalize type from response
  let typeNormalized = normalizeType(data.type || usedType);
  
  const isMovie = typeNormalized === 'movie';

  if (isMovie && episodes.length === 0) {
    const episodeId = data.episodeId || id;
    episodes = [{
      id: episodeId, 
      title: data.title || data.name || 'Full Movie',
      number: 1,
      season: 1
    }];
  }

  // Ensure main image is valid
  const mainImage = data.image || getTmdbImage(data.poster_path) || getTmdbImage(data.backdrop_path);

  return {
    ...data,
    id: String(data.id),
    title: data.title || data.name,
    image: mainImage,
    type: typeNormalized,
    episodes: episodes.map((e: any) => {
      // Resolve episode image with priority: TMDB Still -> Object(HD/Mobile) -> String
      let episodeImage = getTmdbImage(e.still_path);
      
      if (!episodeImage) {
        if (e.img) {
          if (typeof e.img === 'object') {
            episodeImage = e.img.hd || e.img.mobile;
          } else if (typeof e.img === 'string') {
            episodeImage = e.img;
          }
        }
      }
      
      if (!episodeImage) {
         episodeImage = e.image;
      }

      return {
        ...e,
        id: String(e.episodeId || e.id), 
        title: e.title || `Episode ${e.episode_number || e.number}`,
        number: e.episode_number || e.number,
        season: e.season_number || e.season || 1,
        description: e.overview || e.description,
        image: episodeImage
      };
    })
  };
};

export const fetchStreamingLinks = async (episodeId: string, mediaId: string): Promise<StreamData> => {
  try {
    const url = `${BASE_URL}/meta/tmdb/watch/${episodeId}?id=${encodeURIComponent(mediaId)}`;

    console.log(`[Consumet] Fetching stream: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Consumet] Stream fetch failed: ${response.status}`);
      throw new Error(`Failed to fetch streaming links: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.sources || data.sources.length === 0) {
       console.warn('[Consumet] No stream sources returned.');
       return { sources: [], subtitles: [], headers: {} };
    }

    return {
      sources: data.sources || [],
      subtitles: data.subtitles || [],
      headers: data.headers || {}
    };
  } catch (error) {
    console.error("[Consumet] Error fetching streams:", error);
    return { sources: [], subtitles: [], headers: {} };
  }
};
