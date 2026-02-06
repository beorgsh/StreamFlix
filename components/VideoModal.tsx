
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Plus, ThumbsUp, ArrowLeft, AlertCircle, Loader2, ChevronDown, ImageOff, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie, MediaInfo, StreamData } from '../types';
import { fetchInfo, fetchStreamingLinks } from '../services/consumet';
import ArtPlayer from './ArtPlayer';

interface VideoModalProps {
  movie: Movie;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ movie, onClose }) => {
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [heroImageError, setHeroImageError] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset states when movie changes
  useEffect(() => {
    let mounted = true;
    const loadInfo = async () => {
      setLoadingInfo(true);
      setError(null);
      setPlaying(false);
      setStreamData(null);
      setCurrentSourceIndex(0);
      setActiveEpisodeId(null);
      setHeroImageError(false);
      setSeasonDropdownOpen(false);
      
      try {
        const data = await fetchInfo(movie.id, movie.type);
        if (mounted) {
          setInfo(data);
          
          if (data.episodes && data.episodes.length > 0) {
            const seasons = [...new Set(data.episodes.map(e => e.season || 1))].sort((a,b) => a - b);
            const firstSeason = seasons[0];
            setSelectedSeason(firstSeason);
          }
        }
      } catch (error) {
        console.error("Failed to load info", error);
        if (mounted) setError("Failed to load media details.");
      } finally {
        if (mounted) setLoadingInfo(false);
      }
    };
    loadInfo();
    return () => { mounted = false; };
  }, [movie]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSeasonDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlay = async (episodeId?: string) => {
    let idToPlay = episodeId;
    
    if (!info) return;

    if (!idToPlay && info.episodes && info.episodes.length > 0) {
        idToPlay = info.episodes[0].id;
    }

    if (!idToPlay) {
      setError("No episodes available to play.");
      return;
    }

    setActiveEpisodeId(idToPlay);

    try {
      setLoadingStream(true);
      setError(null);
      
      const mediaId = info.id; 
      const links = await fetchStreamingLinks(idToPlay, mediaId);
      
      if (links.sources && links.sources.length > 0) {
        setStreamData(links);
        setCurrentSourceIndex(0);
        setPlaying(true);
      } else {
        setError("No stream sources found. Server might be busy.");
        setPlaying(false);
      }
    } catch (error) {
      console.error("Stream load error", error);
      setError("Failed to load stream. Please try again.");
      setPlaying(false);
    } finally {
      setLoadingStream(false);
    }
  };

  const handlePlayerError = () => {
    if (streamData && currentSourceIndex < streamData.sources.length - 1) {
        console.warn(`Source ${currentSourceIndex} failed, switching to next source...`);
        setCurrentSourceIndex(prev => prev + 1);
    } else {
        console.error("All sources failed.");
        setPlaying(false);
        setError("Unable to play video. Please try again later or select a different episode.");
    }
  };

  const closePlayer = () => {
    setPlaying(false);
    setStreamData(null);
    setCurrentSourceIndex(0);
  };

  const uniqueSeasons = info?.episodes 
    ? Array.from(new Set(info.episodes.map(e => e.season || 1))).sort((a, b) => a - b)
    : [];
    
  const filteredEpisodes = info?.episodes
    ?.filter(ep => (ep.season || 1) === selectedSeason)
    ?.sort((a, b) => a.number - b.number);
    
  const showEpisodes = info?.type === 'tv' || (info?.episodes && info.episodes.length > 1);
  const mainImage = info?.image || movie.image;

  if (!movie) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
          onClick={onClose}
        ></motion.div>
        
        <AnimatePresence>
            {playing && streamData && streamData.sources[currentSourceIndex] && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] bg-black flex flex-col"
                >
                     <div className="flex-1 relative bg-black">
                        <ArtPlayer 
                            key={streamData.sources[currentSourceIndex].url} 
                            url={streamData.sources[currentSourceIndex].url} 
                            poster={mainImage}
                            headers={streamData.headers}
                            subtitles={streamData.subtitles?.map(s => ({ url: s.url, label: s.lang }))}
                            onError={handlePlayerError}
                            className="w-full h-full"
                        />
                         <button 
                            onClick={closePlayer}
                            className="absolute top-8 left-8 z-[210] flex items-center space-x-2 bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-md transition-all border border-white/10 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Episodes</span>
                        </button>
                     </div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-[#181818] w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            
            <button 
                onClick={onClose}
                className="fixed z-[120] top-6 right-8 bg-[#181818] p-2 rounded-full hover:bg-white hover:text-black transition-colors"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="relative aspect-video">
                {mainImage && !heroImageError ? (
                    <img 
                        src={mainImage} 
                        alt={movie.title} 
                        className="w-full h-full object-cover"
                        onError={() => setHeroImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center border-b border-zinc-800">
                        <ImageOff className="w-20 h-20 text-white/20 mb-4" />
                        <span className="text-zinc-500 font-medium">Image unavailable</span>
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/20 to-transparent"></div>

                <div className="absolute bottom-10 left-8 md:left-12 right-8 space-y-6">
                    <h2 className="text-4xl md:text-5xl font-black drop-shadow-lg leading-tight">{info?.title || movie.title}</h2>
                    
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => handlePlay()}
                            disabled={loadingStream || loadingInfo}
                            className="flex items-center space-x-2 bg-white text-black px-8 py-2 rounded font-bold hover:bg-white/80 transition-all disabled:opacity-50"
                        >
                            {loadingStream ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                            <span className="text-lg">{loadingStream ? 'Loading...' : 'Play'}</span>
                        </button>
                        <button className="p-2 border-2 border-zinc-500 rounded-full hover:border-white text-zinc-300 hover:text-white transition-colors bg-black/30">
                            <Plus className="w-5 h-5" />
                        </button>
                        <button className="p-2 border-2 border-zinc-500 rounded-full hover:border-white text-zinc-300 hover:text-white transition-colors bg-black/30">
                            <ThumbsUp className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="text-red-500 flex items-center space-x-2 bg-black/50 p-2 rounded w-fit">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-8 md:px-12 py-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-6">
                    {loadingInfo ? (
                        /* DYNAMIC SKELETON LOADING */
                        <div className="space-y-6">
                            {/* Metadata Skeleton (Common) */}
                            <div className="flex items-center space-x-3">
                                <div className="h-5 w-24 bg-zinc-700 rounded animate-pulse"></div>
                                <div className="h-5 w-12 bg-zinc-700 rounded animate-pulse"></div>
                                <div className="h-5 w-16 bg-zinc-700 rounded animate-pulse"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-zinc-700 rounded animate-pulse"></div>
                                <div className="h-4 w-11/12 bg-zinc-700 rounded animate-pulse"></div>
                                <div className="h-4 w-4/5 bg-zinc-700 rounded animate-pulse"></div>
                            </div>

                            {/* TV Show Specific Skeleton */}
                            {movie.type === 'tv' && (
                                <div className="pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="h-8 w-32 bg-zinc-700 rounded animate-pulse"></div>
                                        <div className="h-8 w-24 bg-zinc-700 rounded animate-pulse"></div>
                                    </div>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center p-4 border-b border-zinc-800/50">
                                                <div className="w-6 h-6 bg-zinc-700 rounded-full mr-4 shrink-0 animate-pulse"></div>
                                                <div className="w-32 h-20 bg-zinc-700 rounded mr-4 shrink-0 animate-pulse"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-1/3 bg-zinc-700 rounded animate-pulse"></div>
                                                    <div className="h-3 w-3/4 bg-zinc-700 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center space-x-3 text-sm font-bold">
                                <span className="text-[#46d369]">98% Match</span>
                                <span className="text-zinc-400">{info?.releaseDate?.split('-')[0]}</span>
                                <span className="border border-zinc-500 px-1.5 py-0.5 text-xs rounded text-zinc-200 uppercase">{info?.type}</span>
                                <span className="border border-zinc-500 px-1.5 py-0.5 text-xs rounded text-zinc-200">HD</span>
                            </div>

                            <p className="text-white text-sm md:text-base leading-relaxed mt-4">
                                {info?.description || "Description unavailable."}
                            </p>

                            {showEpisodes && (
                                <div className="pt-6">
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <h3 className="text-xl font-bold">Episodes</h3>
                                        
                                        {/* Custom Season Dropdown */}
                                        {uniqueSeasons.length > 1 ? (
                                            <div className="relative" ref={dropdownRef}>
                                                <button 
                                                    onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                                                    className="flex items-center space-x-2 bg-[#242424] border border-[#404040] hover:border-white text-white py-1.5 px-3 rounded text-sm font-bold transition-all"
                                                >
                                                    <span>Season {selectedSeason}</span>
                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${seasonDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                
                                                <AnimatePresence>
                                                    {seasonDropdownOpen && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute right-0 mt-2 w-40 bg-[#242424] border border-[#404040] rounded shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto custom-scrollbar"
                                                        >
                                                            {uniqueSeasons.map(s => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => { setSelectedSeason(s); setSeasonDropdownOpen(false); }}
                                                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-white/10 transition-colors ${selectedSeason === s ? 'font-bold text-white bg-white/5' : 'text-zinc-400'}`}
                                                                >
                                                                    <span>Season {s}</span>
                                                                    {selectedSeason === s && <Check className="w-3 h-3 text-white" />}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-400 text-sm font-bold bg-[#242424] px-3 py-1.5 rounded border border-[#404040]">
                                                Season {selectedSeason}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-4">
                                        {filteredEpisodes?.map((ep) => {
                                            const thumbnail = ep.image || mainImage;
                                            const isActive = activeEpisodeId === ep.id;
                                            
                                            return (
                                                <div 
                                                    key={ep.id}
                                                    onClick={() => handlePlay(ep.id)}
                                                    className={`group flex items-center p-4 rounded-lg cursor-pointer transition-colors border-b border-zinc-800 hover:bg-[#333] ${isActive ? 'bg-[#333]' : ''}`}
                                                >
                                                    <div className="text-2xl text-zinc-500 font-bold w-6 mr-4 flex-shrink-0 text-center">
                                                        {ep.number}
                                                    </div>
                                                    
                                                    <div className="relative w-32 aspect-video rounded overflow-hidden flex-shrink-0 bg-zinc-800 mr-4">
                                                        {thumbnail ? (
                                                            <img src={thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-6 h-6 text-zinc-600" /></div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="bg-white/20 border border-white p-2 rounded-full backdrop-blur-sm">
                                                                <Play className="w-4 h-4 fill-white text-white" />
                                                            </div>
                                                        </div>
                                                        {isActive && loadingStream && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                                <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <h4 className="font-bold text-sm md:text-base text-zinc-100">{ep.title}</h4>
                                                            <span className="text-xs text-zinc-400 ml-2">45m</span>
                                                        </div>
                                                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                                            {ep.description || `Episode ${ep.number} of Season ${ep.season}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {(!filteredEpisodes || filteredEpisodes.length === 0) && (
                                            <div className="text-center py-10 text-zinc-500 text-sm">No episodes found.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Extra Details */}
                <div className="text-sm space-y-6">
                    {loadingInfo ? (
                        <div className="animate-pulse space-y-6">
                             <div className="space-y-2">
                                <div className="h-3 w-16 bg-zinc-700 rounded"></div>
                                <div className="h-3 w-full bg-zinc-700 rounded"></div>
                             </div>
                             <div className="space-y-2">
                                <div className="h-3 w-16 bg-zinc-700 rounded"></div>
                                <div className="h-3 w-3/4 bg-zinc-700 rounded"></div>
                             </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="mb-4">
                                <span className="text-zinc-500 block mb-1">Cast:</span>
                                <span className="text-zinc-200">Unavailable</span>
                            </div>
                            <div className="mb-4">
                                <span className="text-zinc-500 block mb-1">Genres:</span>
                                <span className="text-zinc-200 leading-relaxed">{info?.genres?.map(g => g).join(', ') || 'Various'}</span>
                            </div>
                            <div className="mb-4">
                                <span className="text-zinc-500 block mb-1">This show is:</span>
                                <span className="text-zinc-200">Exciting, Suspenseful</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VideoModal;
