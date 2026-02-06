
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import VideoModal from './components/VideoModal';
import { Movie } from './types';
import { fetchTrending, fetchPopular, searchMedia } from './services/consumet';
import { AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [trendingData, popularData] = await Promise.all([
        fetchTrending(),
        fetchPopular()
      ]);
      
      setTrending(trendingData);
      setPopular(popularData);
      
      if (trendingData.length === 0 && popularData.length === 0) {
        // If both are empty, it's effectively an error for the user
        console.warn("API returned empty results");
        setError(true);
      } else if (trendingData && trendingData.length > 0) {
        setFeaturedMovie(trendingData[Math.floor(Math.random() * Math.min(trendingData.length, 5))]);
      }
    } catch (error) {
      console.error("Failed to load initial data", error);
      setError(true);
    } finally {
      // Small delay to show the nice loader
      setTimeout(() => setLoading(false), 800);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async (query: string) => {
    if (!query) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setLoading(true);
    try {
      const results = await searchMedia(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHome = () => {
    setIsSearching(false);
    setSearchResults([]);
  };

  // Custom Loader Component
  if (loading && !trending.length && !isSearching) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#141414] overflow-hidden">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin"></div>
        </motion.div>
      </div>
    );
  }

  // Error State Component
  if (error && !loading && trending.length === 0) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-4">
        <Navbar onSearch={handleSearch} onHome={handleHome} />
        <div className="text-center max-w-md space-y-6 mt-10">
           <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
             <AlertCircle className="w-10 h-10 text-red-500" />
           </div>
           <h1 className="text-2xl md:text-3xl font-bold">Unable to Load Content</h1>
           <p className="text-zinc-400">
             We're having trouble connecting to the streaming server. This might be due to high traffic or regional restrictions.
           </p>
           <button 
             onClick={loadData}
             className="flex items-center justify-center space-x-2 bg-white text-black px-8 py-3 rounded font-bold hover:bg-zinc-200 transition-colors mx-auto"
           >
             <RefreshCw className="w-5 h-5" />
             <span>Retry Connection</span>
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white selection:bg-[#e50914]/30">
      <Navbar onSearch={handleSearch} onHome={handleHome} />

      <AnimatePresence mode="wait">
        {loading ? (
           <motion.div 
             key="loader"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="min-h-screen flex items-center justify-center pt-20"
           >
              <div className="w-12 h-12 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin"></div>
           </motion.div>
        ) : (
          <motion.main 
            key={isSearching ? "search" : "home"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pb-20"
          >
            {isSearching ? (
              <div className="pt-24 px-4 md:px-12 min-h-screen">
                <h2 className="text-2xl font-bold mb-8 text-[#e5e5e5]">Search Results</h2>
                {searchResults.length > 0 ? (
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.05
                        }
                      }
                    }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10"
                  >
                    {searchResults.map((movie) => (
                      <motion.div 
                        key={movie.id} 
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 }
                        }}
                        onClick={() => setSelectedMovie(movie)} 
                        className="cursor-pointer group"
                      >
                        <div className="aspect-[2/3] rounded overflow-hidden mb-2 shadow-lg group-hover:scale-105 group-hover:z-10 transition-all duration-300 relative bg-zinc-800">
                           {movie.image ? (
                             <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                           )}
                           <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <p className="text-sm font-semibold truncate text-[#e5e5e5] group-hover:text-white transition-colors">{movie.title}</p>
                        <p className="text-xs text-[#808080]">{movie.type.toUpperCase()} • {movie.releaseDate?.split('-')[0]}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-[#808080]">
                    <p className="text-xl">No results found matching your search.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {featuredMovie && (
                  <Hero 
                    movie={featuredMovie} 
                    onPlay={(m) => setSelectedMovie(m)} 
                    onInfo={(m) => setSelectedMovie(m)} 
                  />
                )}

                <div className="-mt-16 md:-mt-32 relative z-10 space-y-4 md:space-y-8 pb-10">
                  <MovieRow title="Trending Now" movies={trending} onMovieClick={setSelectedMovie} />
                  <MovieRow title="Popular on StreamFlix" movies={popular} onMovieClick={setSelectedMovie} />
                  <MovieRow title="Top TV Shows" movies={trending.filter(m => m.type === 'tv')} onMovieClick={setSelectedMovie} />
                  <MovieRow title="New Releases" movies={popular.slice().reverse()} onMovieClick={setSelectedMovie} />
                  <MovieRow title="Action & Adventure" movies={trending.slice(10)} onMovieClick={setSelectedMovie} />
                </div>
              </>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {selectedMovie && (
        <VideoModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}

      {/* Footer */}
      {!error && (
        <footer className="max-w-7xl mx-auto px-4 md:px-12 py-12 text-[#808080] mt-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-[13px]">
            <ul className="space-y-3">
                <li className="hover:underline cursor-pointer">Audio Description</li>
                <li className="hover:underline cursor-pointer">Help Center</li>
                <li className="hover:underline cursor-pointer">Gift Cards</li>
                <li className="hover:underline cursor-pointer">Media Center</li>
            </ul>
            <ul className="space-y-3">
                <li className="hover:underline cursor-pointer">Investor Relations</li>
                <li className="hover:underline cursor-pointer">Jobs</li>
                <li className="hover:underline cursor-pointer">Terms of Use</li>
                <li className="hover:underline cursor-pointer">Privacy</li>
            </ul>
            <ul className="space-y-3">
                <li className="hover:underline cursor-pointer">Legal Notices</li>
                <li className="hover:underline cursor-pointer">Cookie Preferences</li>
                <li className="hover:underline cursor-pointer">Corporate Information</li>
                <li className="hover:underline cursor-pointer">Contact Us</li>
            </ul>
            <div className="flex flex-col items-start space-y-4">
                <button className="border border-[#808080] px-4 py-2 hover:text-white hover:border-white transition-colors text-sm">Service Code</button>
            </div>
            </div>
            <div className="text-[11px] mt-8">© 2024 StreamFlix, Inc.</div>
        </footer>
      )}
    </div>
  );
};

export default App;
