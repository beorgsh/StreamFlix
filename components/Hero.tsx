
import React from 'react';
import { Play, Info, Star } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onInfo: (movie: Movie) => void;
}

const Hero: React.FC<HeroProps> = ({ movie, onPlay, onInfo }) => {
  return (
    <div className="relative h-[70vh] md:h-[90vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-4 md:px-12 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-2 text-red-600 font-bold tracking-widest uppercase text-xs sm:text-sm">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded mr-2">Top 10</span>
          #{Math.floor(Math.random() * 10) + 1} Trending Today
        </div>
        
        <h1 className="text-4xl md:text-7xl font-extrabold max-w-2xl drop-shadow-2xl leading-tight">
          {movie.title}
        </h1>

        <div className="flex items-center space-x-4 text-sm md:text-lg">
          <div className="flex items-center text-yellow-500">
            <Star className="w-5 h-5 fill-current mr-1" />
            <span className="font-bold text-white">{movie.rating || 'N/A'}</span>
          </div>
          <span className="text-white/60">|</span>
          <span className="font-semibold">{movie.type.toUpperCase()}</span>
          <span className="text-white/60">|</span>
          <span className="text-white/80">{movie.releaseDate?.split('-')[0]}</span>
        </div>

        <p className="text-white/70 max-w-xl text-base md:text-lg line-clamp-3 leading-relaxed">
          {movie.description || "Dive into an epic journey where worlds collide and legends are born. Experience the thrill of discovery in this top-rated cinematic masterpiece."}
        </p>

        <div className="flex items-center space-x-4 pt-4">
          <button 
            onClick={() => onPlay(movie)}
            className="flex items-center space-x-2 bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-white/80 transition-colors shadow-lg"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Play</span>
          </button>
          <button 
            onClick={() => onInfo(movie)}
            className="flex items-center space-x-2 bg-zinc-600/80 text-white px-8 py-3 rounded-md font-bold hover:bg-zinc-600/60 transition-colors backdrop-blur-md"
          >
            <Info className="w-6 h-6" />
            <span>More Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
