import {
  Home,
  Compass,
  Library,
  Download,
  Radio,
  ArrowRightLeft,
  Plus,
  Heart,
  Music2,
  FolderSync,
} from 'lucide-react';
import { Playlist } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  playlists: Playlist[];
  onSelectPlaylist: (pl: Playlist) => void;
  downloadedCount: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  playlists,
  onSelectPlaylist,
  downloadedCount,
}: SidebarProps) {
  return (
    <aside className="w-60 bg-[#030303] border-r border-neutral-800/80 flex flex-col h-[calc(100vh-60px)] shrink-0 select-none hidden md:flex">
      {/* Primary Navigation Links */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => setActiveTab('home')}
          className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'home'
              ? 'bg-[#212121] text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#121212]'
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'social'
              ? 'bg-[#212121] text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#121212]'
          }`}
        >
          <Compass className="w-5 h-5 shrink-0" />
          <span>Explore &amp; Friends</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'library'
              ? 'bg-[#212121] text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#121212]'
          }`}
        >
          <Library className="w-5 h-5 shrink-0" />
          <span>Library</span>
        </button>

        <button
          onClick={() => setActiveTab('downloads')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'downloads'
              ? 'bg-[#212121] text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#121212]'
          }`}
        >
          <div className="flex items-center gap-4">
            <Download className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Downloads</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tabular-nums">
            {downloadedCount}
          </span>
        </button>
      </div>

      <div className="mx-3 my-2 border-t border-neutral-800" />

      {/* Special Features: Collaborative Room & Playlist Sync */}
      <div className="p-3 space-y-1">
        <span className="px-3.5 text-[11px] font-semibold tracking-wider uppercase text-neutral-500 block mb-1">
          Connected Hub
        </span>

        <button
          onClick={() => setActiveTab('room')}
          className={`w-full flex items-center gap-4 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'room'
              ? 'bg-red-600/20 text-red-400 border border-red-500/30'
              : 'text-neutral-300 hover:text-white hover:bg-[#121212]'
          }`}
        >
          <Radio className="w-4 h-4 text-red-500 shrink-0" />
          <span>Collaborative Room</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`w-full flex items-center gap-4 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'sync'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-neutral-300 hover:text-white hover:bg-[#121212]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Spotify ⇄ YouTube</span>
        </button>
      </div>

      <div className="mx-3 my-2 border-t border-neutral-800" />

      {/* Playlists List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="flex items-center justify-between px-3.5 mb-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
            Playlists
          </span>
          <button
            onClick={() => setActiveTab('sync')}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
            title="Import or Create Playlist"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => onSelectPlaylist(pl)}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a1a] transition-colors truncate text-left group"
          >
            <img
              src={pl.coverImage}
              alt={pl.name}
              className="w-6 h-6 rounded object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="truncate group-hover:text-red-400 transition-colors">
              {pl.name}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
