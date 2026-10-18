import { useState } from 'react';
import { X, Check, Plus, FolderPlus } from 'lucide-react';
import { Playlist, Track } from '../../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  onAddTrackToPlaylist: (playlistId: string, track: Track) => void;
  onOpenCreatePlaylist: () => void;
}

export default function AddToPlaylistModal({
  isOpen,
  onClose,
  track,
  playlists,
  onAddTrackToPlaylist,
  onOpenCreatePlaylist,
}: AddToPlaylistModalProps) {
  const [addedPlaylistIds, setAddedPlaylistIds] = useState<Set<string>>(new Set());

  if (!isOpen || !track) return null;

  const handleToggle = (playlist: Playlist) => {
    onAddTrackToPlaylist(playlist.id, track);
    setAddedPlaylistIds((prev) => new Set([...prev, playlist.id]));
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-neutral-100">
      <div className="w-full max-w-sm bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">Add to playlist</h3>
            <p className="text-[11px] text-neutral-400 truncate max-w-[240px]">
              {track.title} · {track.artist}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Playlists list */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {playlists.map((pl) => {
            const isAlreadyAdded = addedPlaylistIds.has(pl.id) || pl.tracks.some((t) => t.id === track.id);

            return (
              <div
                key={pl.id}
                onClick={() => handleToggle(pl)}
                className="p-2.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={pl.coverImage}
                    alt={pl.name}
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{pl.name}</p>
                    <p className="text-[11px] text-neutral-400 font-mono tabular-nums">
                      {pl.tracks.length} songs
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isAlreadyAdded ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Shortcut to create new playlist */}
        <button
          onClick={() => {
            onClose();
            onOpenCreatePlaylist();
          }}
          className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
        >
          <FolderPlus className="w-4 h-4 text-red-500" />
          <span>New playlist</span>
        </button>
      </div>
    </div>
  );
}
