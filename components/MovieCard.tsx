
import React, { useState } from 'react';
import { Play, Plus, ChevronDown, Star, ImageOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div 
      className="relative flex-none w-40 sm:w-48 md:w-56 lg:w-64"
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(movie)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md cursor-pointer bg-zinc-800 shadow-md">
        {movie.image && !imgError ? (
          <img 
            src={movie.image} 
            alt={movie.title} 
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white/30 bg-zinc-800 border border-white/5">
            <ImageOff className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-xs font-bold line-clamp-3 px-2">{movie.title}</span>
          </div>
        )}
        
        {/* Hover Overlay */}
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 flex flex-col justify-end p-4"
          >
            <h3 className="text-sm font-bold truncate mb-2 text-white">{movie.title}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-white p-1.5 rounded-full hover:bg-zinc-200 transition-colors cursor-pointer">
                  <Play className="w-3 h-3 fill-black text-black" />
                </div>
                <div className="border border-zinc-400 p-1.5 rounded-full hover:border-white text-zinc-300 hover:text-white transition-all cursor-pointer">
                  <Plus className="w-3 h-3" />
                </div>
              </div>
              <div className="border border-zinc-400 p-1.5 rounded-full hover:border-white text-zinc-300 hover:text-white transition-all cursor-pointer">
                 <ChevronDown className="w-3 h-3" />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-3 text-[10px] font-bold">
              <span className="text-[#46d369]">98% Match</span>
              <span className="border border-zinc-500 px-1 rounded text-[8px] text-zinc-300">{movie.type.toUpperCase()}</span>
              <div className="flex items-center text-yellow-500">
                <Star className="w-3 h-3 fill-current mr-0.5" />
                <span className="text-white">{movie.rating || 'N/A'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MovieCard;
