import { useState } from 'react';
import {
  RefreshCw,
  ArrowRightLeft,
  Download,
  Share2,
  Check,
  Play,
  Pause,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Playlist, Track } from '../../types';
import { PLAYLISTS } from '../../data/mockData';
import { SyncEngine, SyncStep } from '../../services/syncEngine';
import { audioEngine } from '../../services/audioEngine';

interface PlaylistSyncProps {
  onQueueTrack: (track: Track) => void;
  onPlayTrack: (track: Track) => void;
}

export default function PlaylistSync({ onQueueTrack, onPlayTrack }: PlaylistSyncProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>(PLAYLISTS);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>(PLAYLISTS[0]);
  const [direction, setDirection] = useState<'spotify_to_youtube' | 'youtube_to_spotify'>('spotify_to_youtube');
  const [inputUrl, setInputUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncStep | null>(null);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const targetPlatform = direction === 'spotify_to_youtube' ? 'youtube' : 'spotify';
  const sourcePlatform = direction === 'spotify_to_youtube' ? 'spotify' : 'youtube';

  const handleToggleDirection = () => {
    setDirection((prev) =>
      prev === 'spotify_to_youtube' ? 'youtube_to_spotify' : 'spotify_to_youtube'
    );
  };

  const handleStartSync = async () => {
    setIsSyncing(true);
    try {
      const updated = await SyncEngine.runSyncSession(
        selectedPlaylist,
        targetPlatform,
        (step) => setSyncProgress(step)
      );
      setSelectedPlaylist(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncProgress(null), 4000);
    }
  };

  const handleExportM3U = () => {
    SyncEngine.exportToM3U(selectedPlaylist);
  };

  const handleExportJSON = () => {
    SyncEngine.exportToJSON(selectedPlaylist);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/sync?playlist=${selectedPlaylist.id}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleImportUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    // Build newly imported playlist representation
    const newPlaylist: Playlist = {
      id: 'pl-' + Date.now(),
      name: inputUrl.includes('playlist') ? 'Imported Web Playlist' : 'Synced Collection',
      description: `Imported from ${inputUrl}`,
      coverImage: '/src/assets/images/album_synthwave_night_1792258628594.jpg',
      creator: 'You',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      trackCount: 4,
      durationTotal: 880,
      platform: inputUrl.includes('youtube') ? 'youtube' : 'spotify',
      tracks: [...PLAYLISTS[0].tracks],
      syncedToYouTube: false,
      syncedToSpotify: false,
      likesCount: 1,
      category: 'Imported',
    };

    setPlaylists((prev) => [newPlaylist, ...prev]);
    setSelectedPlaylist(newPlaylist);
    setInputUrl('');
  };

  const handleTogglePreview = (track: Track) => {
    if (previewingTrackId === track.id) {
      audioEngine.pause();
      setPreviewingTrackId(null);
    } else {
      audioEngine.play(track.audioPreset);
      setPreviewingTrackId(track.id);
    }
  };

  const filteredTracks = selectedPlaylist.tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Controls & Platform Switcher */}
      <div className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800/80 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Spotify &amp; YouTube Playlist Sync Engine
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Two-way acoustic matching and playlist conversion. Keeps library in sync across platforms.
            </p>
          </div>

          {/* Direction Switcher */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                direction === 'spotify_to_youtube'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400'
              }`}
            >
              Spotify
            </span>

            <button
              onClick={handleToggleDirection}
              title="Reverse sync direction"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-transform active:rotate-180"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            <span
              className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                direction === 'youtube_to_spotify'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400'
              }`}
            >
              YouTube Music
            </span>
          </div>
        </div>

        {/* Input Bar for URL Import & Preset Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80">
          <form onSubmit={handleImportUrl} className="md:col-span-7 flex gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste public Spotify or YouTube playlist URL/ID (e.g. https://open.spotify.com/playlist/...)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 shrink-0 transition-colors"
            >
              Import URL
            </button>
          </form>

          {/* Curated Pre-Loaded Playlists Selector */}
          <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-slate-500 shrink-0">Presets:</span>
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium truncate shrink-0 transition-all ${
                  selectedPlaylist.id === pl.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {pl.name.split(':')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Playlist Overview Card */}
      <div className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800/80 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={selectedPlaylist.coverImage}
            alt={selectedPlaylist.name}
            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800 shadow-md"
            referrerPolicy="no-referrer"
          />

          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{selectedPlaylist.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
              <span>Curated by {selectedPlaylist.creator}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{selectedPlaylist.tracks.length} tracks</span>
              <span>·</span>
              <span>
                Status:{' '}
                {selectedPlaylist.syncedToYouTube && selectedPlaylist.syncedToSpotify ? (
                  <span className="text-emerald-400 font-medium">Fully Synced (Spotify + YouTube)</span>
                ) : (
                  <span className="text-amber-400 font-medium">Pending Two-Way Sync</span>
                )}
              </span>
              {selectedPlaylist.lastSyncedAt && (
                <>
                  <span>·</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Last synced {selectedPlaylist.lastSyncedAt}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sync & Export CTA Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleStartSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : `Sync to ${targetPlatform === 'youtube' ? 'YouTube' : 'Spotify'}`}</span>
          </button>

          <button
            onClick={handleExportM3U}
            title="Download standard .m3u playlist file"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export M3U</span>
          </button>

          <button
            onClick={handleExportJSON}
            title="Download full JSON dataset"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>JSON</span>
          </button>

          <button
            onClick={handleCopyLink}
            title="Copy shareable link"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Sync in-progress banner */}
      {syncProgress && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {syncProgress.message}
            </span>
            <span className="font-mono tabular-nums">{syncProgress.progressPercent}%</span>
          </div>

          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${syncProgress.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Track Matching Table */}
      <div className="bg-[#0D121F] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Cross-Platform Track Fingerprint Mapping
            </h4>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-emerald-400 tabular-nums">
              {filteredTracks.length} Matched Tracks
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter matched songs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Spotify Source Track</th>
                <th className="py-3 px-4">YouTube Matched Video</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Duration</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTracks.map((track, idx) => (
                <tr key={track.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-500 tabular-nums">{idx + 1}</td>

                  {/* Spotify Details */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={track.albumArt}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{track.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                        <p className="text-[10px] font-mono text-slate-500 truncate">
                          ID: {track.spotifyId}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* YouTube Match Details */}
                  <td className="py-3.5 px-4">
                    <div className="min-w-0 max-w-sm">
                      <p className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                        <span className="text-rose-400">▶</span>
                        {track.youtubeTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {track.youtubeChannel} · {track.youtubeViews}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        yt: {track.youtubeId}
                      </p>
                    </div>
                  </td>

                  {/* Match Score Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono tabular-nums bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {track.matchScore}%
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 tabular-nums">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleTogglePreview(track)}
                        title="Listen to preview audio"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        {previewingTrackId === track.id ? (
                          <Pause className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => onQueueTrack(track)}
                        title="Queue in collaborative room"
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium transition-colors"
                      >
                        + Room
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
