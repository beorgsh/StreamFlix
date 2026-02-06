
export interface Movie {
  id: string;
  title: string;
  image: string;
  type: 'movie' | 'tv';
  releaseDate?: string;
  rating?: number;
  description?: string;
}

export interface MediaInfo extends Movie {
  genres?: string[];
  duration?: string;
  status?: string;
  episodes?: Episode[];
  totalEpisodes?: number;
  recommendations?: Movie[];
}

export interface Episode {
  id: string;
  title: string;
  number: number;
  season?: number;
  image?: string;
  description?: string;
}

export interface StreamSource {
  url: string;
  isM3U8: boolean;
  quality?: string;
  type?: string;
}

export interface StreamData {
  sources: StreamSource[];
  subtitles?: { url: string; lang: string }[];
  headers?: Record<string, string>;
}

export type MediaCategory = 'trending' | 'popular' | 'top_rated' | 'upcoming';
