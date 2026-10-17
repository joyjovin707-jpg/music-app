import { useState } from 'react';
import { Library, FolderSync, Heart, History, Play, Plus, ExternalLink, Download } from 'lucide-react';
import { Playlist, Track } from '../../types';
import { PLAYLISTS, TRACKS } from '../../data/mockData';
import { SyncEngine } from '../../services/syncEngine';

interface LibraryViewProps {
  onPlayTrack: (track: Track) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenCreateRoom: () => void;
}

export default function LibraryView({
  onPlayTrack,
  onSelectPlaylist,
  onOpenCreateRoom,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'history'>('playlists');
  const [playlists] = useState<Playlist[]>(PLAYLISTS);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Library Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0D121F] border border-slate-800/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Your Cross-Platform Library</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            All your synced Spotify &amp; YouTube playlists, favorite tracks, and collaborative room history in one place.
          </p>
        </div>

        <button
          onClick={onOpenCreateRoom}
          className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Listening Room</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'playlists'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderSync className="w-3.5 h-3.5" />
          <span>Synced Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'liked'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Favorite Tracks ({TRACKS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Room Sessions</span>
        </button>
      </div>

      {/* Tab 1: Playlists */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="group p-4 rounded-2xl bg-[#0D121F] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
            >
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800">
                  <img
                    src={pl.coverImage}
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[11px] font-mono text-emerald-300">
                      {pl.syncedToYouTube && pl.syncedToSpotify
                        ? 'Spotify + YouTube Synced'
                        : `${pl.platform.toUpperCase()} Ready`}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {pl.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {pl.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400 tabular-nums">
                  {pl.trackCount} tracks
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => SyncEngine.exportToM3U(pl)}
                    title="Export M3U"
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectPlaylist(pl)}
                    className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium transition-colors"
                  >
                    Open &amp; Sync
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Liked Tracks */}
      {activeTab === 'liked' && (
        <div className="bg-[#0D121F] border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
          <div className="divide-y divide-slate-800/60">
            {TRACKS.map((track, i) => (
              <div
                key={track.id}
                className="p-3.5 hover:bg-slate-900/40 transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-center font-mono text-slate-500 tabular-nums">{i + 1}</span>
                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{track.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {track.artist} · {track.album}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-slate-400 tabular-nums">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </span>

                  <button
                    onClick={() => onPlayTrack(track)}
                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <div className="p-8 text-center bg-[#0D121F] border border-slate-800/80 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-slate-200">Session History</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You hosted 3 listening rooms with 12 friends this week. All chat logs and sync records are archived locally.
          </p>
        </div>
      )}
    </div>
  );
}
