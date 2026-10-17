import { Disc3, Radio, Plus, Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  activeTab: 'room' | 'sync' | 'social' | 'library';
  setActiveTab: (tab: 'room' | 'sync' | 'social' | 'library') => void;
  roomCode: string;
  onOpenCreateRoom: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  roomCode,
  onOpenCreateRoom,
}: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F1A]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-8 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('room')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <Disc3 className="w-4 h-4 animate-spin [animation-duration:8s]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            OpenTune <span className="text-emerald-400 font-normal">Sync</span>
          </span>
        </button>

        {/* Room Code Badge */}
        <button
          onClick={handleCopyCode}
          title="Click to copy room code"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono text-slate-300 transition-colors"
        >
          <Radio className="w-3 h-3 text-emerald-400" />
          <span>{roomCode}</span>
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
        </button>
      </div>

      {/* Zone 2: 4 single-line concise navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('room')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
            activeTab === 'room'
              ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Collaborative Room
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
            activeTab === 'sync'
              ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Playlist Sync
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
            activeTab === 'social'
              ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Social Discovery
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
            activeTab === 'library'
              ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Library
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenCreateRoom}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-emerald-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Host Room</span>
        </button>

        <div
          title="Account Profile"
          className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 overflow-hidden shrink-0 cursor-pointer hover:border-slate-500 transition-colors"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="User profile"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
