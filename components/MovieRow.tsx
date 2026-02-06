
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { Movie } from '../types';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onMovieClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="py-6 space-y-4 group">
      <h2 className="text-xl md:text-2xl font-bold px-4 md:px-12 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-xs text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">Explore All &gt;</span>
      </h2>
      
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div 
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4 pt-2 snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className="snap-start">
              <MovieCard movie={movie} onClick={onMovieClick} />
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default MovieRow;
