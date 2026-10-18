import { useState } from 'react';
import {
  Play,
  Shuffle,
  Download,
  Share2,
  Plus,
  RefreshCw,
  Radio,
  FileAudio,
  Trash2,
  Heart,
  Check,
  Disc,
  ArrowRightLeft,
  ArrowUp,
  ArrowDown,
  Search,
  FolderPlus,
  Music2,
} from 'lucide-react';
import { Playlist, Track } from '../../types';
import { SyncEngine } from '../../services/syncEngine';

interface PlaylistDetailPageProps {
  playlist: Playlist;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onDownloadTrack: (track: Track) => void;
  onDownloadAll: (tracks: Track[]) => void;
  downloadedTrackIds: Set<string>;
  onQueueTrack: (track: Track) => void;
  onQueueAllToRoom: (tracks: Track[]) => void;
  onNavigateToSync: () => void;
  onRemoveTrackFromPlaylist?: (playlistId: string, trackId: string) => void;
  onReorderTrack?: (playlistId: string, fromIndex: number, toIndex: number) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onNavigateToSearch?: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlaylistDetailPage({
  playlist,
  onPlayTrack,
  onPlayAll,
  onDownloadTrack,
  onDownloadAll,
  downloadedTrackIds,
  onQueueTrack,
  onQueueAllToRoom,
  onNavigateToSync,
  onRemoveTrackFromPlaylist,
  onReorderTrack,
  onOpenAddToPlaylist,
  onNavigateToSearch,
}: PlaylistDetailPageProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState('');

  const totalSec = playlist.tracks.reduce((acc, t) => acc + (t.duration || 200), 0);
  const totalMinutes = Math.floor(totalSec / 60);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/playlist/${playlist.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredTracks = playlist.tracks.filter((t) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Playlist Hero Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 rounded-3xl bg-gradient-to-b from-[#242424] to-[#121212] border border-neutral-800 shadow-2xl">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-neutral-700/80 group">
          <img
            src={playlist.coverImage}
            alt={playlist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
              Playlist
            </span>
            <span className="text-xs text-neutral-500">·</span>
            <span className="text-xs font-mono text-emerald-400">
              {playlist.syncedToYouTube && playlist.syncedToSpotify
                ? 'Spotify + YouTube Synced'
                : 'YouTube Music Ready'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight line-clamp-2">
            {playlist.name}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 max-w-2xl">
            {playlist.description}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-neutral-300 font-medium">
            <span className="text-white font-semibold">{playlist.creator}</span>
            <span>·</span>
            <span className="font-mono tabular-nums">{playlist.tracks.length} songs</span>
            <span>·</span>
            <span className="font-mono tabular-nums">about {totalMinutes} min</span>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-center md:justify-start gap-2.5 pt-2 flex-wrap">
            <button
              onClick={() => onPlayAll(playlist.tracks, false)}
              disabled={playlist.tracks.length === 0}
              className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-white/10 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play All</span>
            </button>

            <button
              onClick={() => onPlayAll(playlist.tracks, true)}
              disabled={playlist.tracks.length === 0}
              className="px-4 py-2.5 rounded-full bg-[#2a2a2a] hover:bg-[#333333] text-white font-semibold text-xs flex items-center gap-2 transition-colors border border-neutral-700 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>

            <button
              onClick={() => onDownloadAll(playlist.tracks)}
              disabled={playlist.tracks.length === 0}
              className="p-2.5 rounded-full bg-[#2a2a2a] hover:bg-[#333333] text-neutral-300 hover:text-white transition-colors border border-neutral-700 disabled:opacity-50"
              title="Download entire playlist offline"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => onQueueAllToRoom(playlist.tracks)}
              disabled={playlist.tracks.length === 0}
              className="px-3.5 py-2 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Send to Collaborative Room"
            >
              <Radio className="w-3.5 h-3.5 text-red-500" />
              <span>Stream in Room</span>
            </button>

            <button
              onClick={onNavigateToSync}
              className="px-3.5 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Two-Way Sync Engine"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Sync Spotify ⇄ YouTube</span>
            </button>

            <button
              onClick={() => SyncEngine.exportToM3U(playlist)}
              className="p-2.5 rounded-full bg-[#2a2a2a] hover:bg-[#333333] text-neutral-300 hover:text-white transition-colors border border-neutral-700"
              title="Export standard .M3U file"
            >
              <FileAudio className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={handleCopyShare}
              className="p-2.5 rounded-full bg-[#2a2a2a] hover:bg-[#333333] text-neutral-300 hover:text-white transition-colors border border-neutral-700"
              title="Share playlist link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Search Filter Bar & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search within playlist..."
            className="w-full bg-[#181818] border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="font-mono">
            Showing {filteredTracks.length} of {playlist.tracks.length} tracks
          </span>

          {onNavigateToSearch && (
            <button
              onClick={onNavigateToSearch}
              className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Songs</span>
            </button>
          )}
        </div>
      </div>

      {/* Tracklist Table */}
      <div className="bg-[#121212] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        {playlist.tracks.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
              <Music2 className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-white">This playlist is empty</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Search for your favorite songs across YouTube Music &amp; Spotify to add them to this playlist.
            </p>
            {onNavigateToSearch && (
              <button
                onClick={onNavigateToSearch}
                className="mt-2 px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:scale-105 transition-transform"
              >
                Search Music Database
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 text-neutral-400 font-medium border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">#</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Album</th>
                  <th className="py-3.5 px-4 text-center">Sync Match</th>
                  <th className="py-3.5 px-4 text-right">Time</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredTracks.map((track, i) => {
                  const isDownloaded = downloadedTrackIds.has(track.id) || track.isDownloaded;
                  const isLiked = likedTrackIds.has(track.id);
                  const originalIndex = playlist.tracks.findIndex((t) => t.id === track.id);

                  return (
                    <tr
                      key={`${track.id}-${i}`}
                      onClick={() => onPlayTrack(track)}
                      className="hover:bg-neutral-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-neutral-500 tabular-nums">
                        <div className="flex items-center justify-center gap-1">
                          <span className="group-hover:hidden w-5 text-center">{originalIndex + 1}</span>
                          <Play className="w-3.5 h-3.5 fill-white text-white hidden group-hover:block" />

                          {/* Reorder buttons */}
                          {onReorderTrack && !filterQuery && (
                            <div
                              className="hidden group-hover:flex flex-col ml-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {originalIndex > 0 && (
                                <button
                                  onClick={() => onReorderTrack(playlist.id, originalIndex, originalIndex - 1)}
                                  title="Move Up"
                                  className="text-neutral-400 hover:text-white p-0.5"
                                >
                                  <ArrowUp className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {originalIndex < playlist.tracks.length - 1 && (
                                <button
                                  onClick={() => onReorderTrack(playlist.id, originalIndex, originalIndex + 1)}
                                  title="Move Down"
                                  className="text-neutral-400 hover:text-white p-0.5"
                                >
                                  <ArrowDown className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={track.albumArt}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-neutral-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                              {track.title}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">
                              {track.artist}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-400 truncate hidden md:table-cell">
                        {track.album}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono tabular-nums bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {track.matchScore || 99}% Exact
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-neutral-400 tabular-nums">
                        {formatDuration(track.duration)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => toggleLike(track.id, e)}
                            title="Like song"
                            className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>

                          {onOpenAddToPlaylist && (
                            <button
                              onClick={() => onOpenAddToPlaylist(track)}
                              title="Add to another playlist"
                              className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onDownloadTrack(track)}
                            title={isDownloaded ? 'Downloaded Offline' : 'Download track audio'}
                            className={`p-1.5 hover:bg-neutral-800 rounded-full transition-colors ${
                              isDownloaded ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => onQueueTrack(track)}
                            title="Queue song to room"
                            className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {onRemoveTrackFromPlaylist && (
                            <button
                              onClick={() => onRemoveTrackFromPlaylist(playlist.id, track.id)}
                              title="Remove from this playlist"
                              className="p-1.5 hover:bg-rose-500/20 rounded-full text-neutral-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
