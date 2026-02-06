
import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onSearch: (query: string) => void;
  onHome: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, onHome }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#141414] shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            onClick={onHome}
            className="text-[#e50914] text-3xl md:text-5xl cursor-pointer hover:scale-105 transition-transform font-['Bebas_Neue'] tracking-wide drop-shadow-md"
          >
            STREAMFLIX
          </motion.h1>
          
          <div className="hidden md:flex space-x-6 text-sm font-medium text-white/90">
            <button onClick={onHome} className="hover:text-white transition-colors font-bold">Home</button>
            <button className="hover:text-zinc-300 transition-colors">TV Shows</button>
            <button className="hover:text-zinc-300 transition-colors">Movies</button>
            <button className="hover:text-zinc-300 transition-colors">New & Popular</button>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-white">
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block group">
            <motion.div 
               initial={false}
               className={`flex items-center border ${searchQuery ? 'border-white bg-black/80' : 'border-transparent bg-transparent'} px-2 py-1 transition-all duration-300`}
            >
                <Search className="w-5 h-5 cursor-pointer" />
                <input
                  type="text"
                  placeholder="Titles, people, genres"
                  className={`bg-transparent border-none text-sm text-white focus:outline-none transition-all duration-300 ${searchQuery ? 'w-48 md:w-60 pl-3' : 'w-0 focus:w-48 md:focus:w-60 focus:pl-3'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </motion.div>
          </form>

          <div className="flex items-center space-x-5">
            <Bell className="w-5 h-5 cursor-pointer hover:text-zinc-300" />
            <div className="flex items-center space-x-2 cursor-pointer group">
                <div className="w-8 h-8 rounded bg-[#e50914] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                </div>
            </div>
            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-[#141414] p-4 flex flex-col space-y-4 border-t border-white/10"
        >
          <button onClick={() => { onHome(); setIsMobileMenuOpen(false); }} className="text-left py-2 border-b border-white/5 font-bold text-white">Home</button>
          <button className="text-left py-2 border-b border-white/5 text-zinc-400">TV Shows</button>
          <button className="text-left py-2 border-b border-white/5 text-zinc-400">Movies</button>
          <button className="text-left py-2 border-b border-white/5 text-zinc-400">New & Popular</button>
          <form onSubmit={handleSearchSubmit} className="relative mt-2">
            <input
              type="text"
              placeholder="Search..."
              className="bg-zinc-800 border-none rounded w-full py-2 pl-10 pr-4 text-sm text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          </form>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
