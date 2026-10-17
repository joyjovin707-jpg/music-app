import { useState, useRef, useEffect } from 'react';
import { Search, X, Play, Radio, ArrowRightLeft, User, Download } from 'lucide-react';
import { TRACKS } from '../../data/mockData';
import { Track } from '../../types';

import { MusicDatabaseService } from '../../services/musicDatabaseService';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onSelectTrack: (track: Track) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  roomCode: string;
  downloadedCount: number;
}

export default function Navbar({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onSelectTrack,
  activeTab,
  setActiveTab,
  roomCode,
  downloadedCount,
}: NavbarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const live = await MusicDatabaseService.searchGlobalCatalog(searchQuery);
        if (active) {
          setSuggestions(live.slice(0, 6));
        }
      } catch {
        if (active) {
          setSuggestions(
            TRACKS.filter(
              (t) =>
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.artist.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 5)
          );
        }
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsFocused(false);
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#030303]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      {/* Brand logo: YouTube Music + OpenTune */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 focus:outline-none group text-left"
        >
          {/* YouTube Music Red Round Icon */}
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tracking-tight text-white font-display">
              Music
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-800/80 px-1.5 py-0.5 rounded">
              OpenTune
            </span>
          </div>
        </button>
      </div>

      {/* Universal Search Bar */}
      <div ref={containerRef} className="relative flex-1 max-w-xl">
        <div
          className={`flex items-center bg-[#212121] rounded-full px-4 py-2 border transition-all ${
            isFocused ? 'border-neutral-500 bg-[#121212] ring-1 ring-neutral-500' : 'border-transparent hover:bg-[#282828]'
          }`}
        >
          <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'search' && e.target.value.trim().length > 0) {
                setActiveTab('search');
              }
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search songs, albums, artists, YouTube podcasts..."
            className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Suggestions Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#212121] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-neutral-800">
            {suggestions.map((track) => (
              <div
                key={track.id}
                onMouseDown={() => {
                  onSelectTrack(track);
                  setIsFocused(false);
                }}
                className="p-2.5 hover:bg-[#2e2e2e] cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-8 h-8 rounded object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 truncate">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-neutral-400 truncate">Song · {track.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-neutral-400">
                  <Play className="w-3.5 h-3.5 hover:text-white" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Room Sync, Downloads & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Room Sync Button */}
        <button
          onClick={() => setActiveTab('room')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activeTab === 'room'
              ? 'bg-red-600/20 text-red-400 border-red-500/40'
              : 'bg-[#212121] hover:bg-[#2a2a2a] text-neutral-300 border-neutral-700'
          }`}
          title="Collaborative Listening Room"
        >
          <Radio className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden md:inline">Room #{roomCode}</span>
        </button>

        {/* Quick Downloads Pill */}
        <button
          onClick={() => setActiveTab('downloads')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activeTab === 'downloads'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-[#212121] hover:bg-[#2a2a2a] text-neutral-300 border-neutral-700'
          }`}
          title="Downloaded Tracks for Offline"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono tabular-nums">{downloadedCount}</span>
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 cursor-pointer shrink-0">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="Profile"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
