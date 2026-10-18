import { useState, useEffect } from 'react';
import { Search, Play, Download, Check, Heart, Plus, Loader2, Sparkles, Radio, FolderPlus } from 'lucide-react';
import { Track } from '../../types';
import { TRACKS } from '../../data/mockData';
import { MusicDatabaseService } from '../../services/musicDatabaseService';

interface SearchPageProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onPlayTrack: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
  downloadedTrackIds: Set<string>;
  onQueueTrack: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
}

const CATEGORIES = ['All', 'Songs', 'Videos', 'Artists', 'Albums', 'Smart Mix'];

export default function SearchPage({
  searchQuery,
  setSearchQuery,
  onPlayTrack,
  onDownloadTrack,
  downloadedTrackIds,
  onQueueTrack,
  onOpenAddToPlaylist,
}: SearchPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set(['track-4']));
  const [results, setResults] = useState<Track[]>(TRACKS);
  const [isLoading, setIsLoading] = useState(false);

  // Live search across the entire global music catalog
  useEffect(() => {
    let isCancelled = false;

    if (!searchQuery.trim()) {
      setResults(TRACKS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const liveTracks = await MusicDatabaseService.searchGlobalCatalog(searchQuery);
        if (!isCancelled) {
          setResults(liveTracks);
        }
      } catch {
        if (!isCancelled) {
          const q = searchQuery.toLowerCase();
          setResults(
            TRACKS.filter(
              (t) =>
                t.title.toLowerCase().includes(q) ||
                t.artist.toLowerCase().includes(q) ||
                t.genre.toLowerCase().includes(q)
            )
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const topResult = results[0] || TRACKS[0];

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleQuickPreset = (term: string) => {
    setSearchQuery(term);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">
      {/* Search Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121212]/80 border border-neutral-800 backdrop-blur-md">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span>LastWave Global Music Database Search</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Querying millions of songs across YouTube Music &amp; Spotify catalogs in real-time.
          </p>
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] text-neutral-500 shrink-0">Popular:</span>
          {['The Weeknd', 'Daft Punk', 'Lo-Fi Study', 'City Pop', 'Synthwave'].map((chip) => (
            <button
              key={chip}
              onClick={() => handleQuickPreset(chip)}
              className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-white text-neutral-900 font-semibold'
                : 'bg-[#212121] hover:bg-[#2e2e2e] text-neutral-200 border border-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10 gap-3 text-neutral-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-red-500" />
          <span>Searching global music database...</span>
        </div>
      )}

      {/* Top Result Card & Live Matches */}
      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Top Result Spotlight */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Top Result
            </h3>

            <div
              onClick={() => onPlayTrack(topResult)}
              className="p-5 rounded-2xl bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 cursor-pointer transition-all space-y-4 shadow-xl group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-lg shrink-0">
                  <img
                    src={topResult.albumArt}
                    alt={topResult.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 fill-white text-white" />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(topResult);
                  }}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>

              <div>
                <h4 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {topResult.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                  <span className="font-medium text-neutral-300">{topResult.artist}</span>
                  <span>·</span>
                  <span className="truncate">{topResult.album}</span>
                  <span>·</span>
                  <span className="font-mono">{Math.floor(topResult.duration / 60)}:{(topResult.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs gap-2">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 truncate">
                  {topResult.matchScore}% Matched (Spotify &amp; YouTube)
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenAddToPlaylist && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddToPlaylist(topResult);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#282828] hover:bg-[#333333] text-neutral-200 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Add to Playlist"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Playlist</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadTrack(topResult);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#282828] hover:bg-[#333333] text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {downloadedTrackIds.has(topResult.id) || topResult.isDownloaded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Offline Ready</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Songs List on Right */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Matching Tracks ({results.length})
              </h3>
              <span className="text-xs font-mono text-neutral-500">Live Catalog</span>
            </div>

            <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl divide-y divide-neutral-800/60 overflow-hidden shadow-lg max-h-[640px] overflow-y-auto">
              {results.map((track) => {
                const isDownloaded = downloadedTrackIds.has(track.id) || track.isDownloaded;
                const isLiked = likedTrackIds.has(track.id);

                return (
                  <div
                    key={track.id}
                    onClick={() => onPlayTrack(track)}
                    className="group p-3 hover:bg-[#1f1f1f] cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-sm">
                        <img
                          src={track.albumArt}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {track.artist} · {track.album}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Download, Like, Room Queue */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-neutral-400 tabular-nums hidden sm:inline mr-2">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </span>

                      <button
                        onClick={(e) => toggleLike(track.id, e)}
                        title="Like song"
                        className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {onOpenAddToPlaylist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAddToPlaylist(track);
                          }}
                          title="Add to Playlist"
                          className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadTrack(track);
                        }}
                        title={isDownloaded ? 'Downloaded Offline' : 'Download Audio (.wav)'}
                        className={`p-1.5 hover:bg-neutral-800 rounded-full transition-colors ${
                          isDownloaded ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQueueTrack(track);
                        }}
                        title="Add to Play Next"
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Play Next</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-base font-semibold text-neutral-300">No tracks found for "{searchQuery}"</p>
          <p className="text-xs text-neutral-500">
            Try searching artist names like "Daft Punk", "The Weeknd", or genres like "Synthwave".
          </p>
        </div>
      )}
    </div>
  );
}
