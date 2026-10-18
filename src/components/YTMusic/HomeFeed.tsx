import { useState, useMemo } from 'react';
import { Play, Download, Check, Heart, Sparkles, Radio, FolderPlus, ListPlus } from 'lucide-react';
import { Track, Playlist } from '../../types';
import { TRACKS, PLAYLISTS } from '../../data/mockData';
import { MusicDatabaseService } from '../../services/musicDatabaseService';

interface HomeFeedProps {
  currentTrack?: Track | null;
  onPlayTrack: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
  downloadedTrackIds: Set<string>;
  onSelectPlaylist: (playlist: Playlist) => void;
  onQueueTrack: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
}

const MOODS = ['All', 'Energize', 'Workout', 'Relax', 'Focus', 'Commute'];

export default function HomeFeed({
  currentTrack,
  onPlayTrack,
  onDownloadTrack,
  downloadedTrackIds,
  onSelectPlaylist,
  onQueueTrack,
  onOpenAddToPlaylist,
}: HomeFeedProps) {
  const [selectedMood, setSelectedMood] = useState('All');
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set(['track-1', 'track-2']));

  const activeTrack = currentTrack || TRACKS[0];

  // Dynamically compute recommended tracks based on current track metadata
  const recommendedItems = useMemo(() => {
    const related = MusicDatabaseService.getRelatedTracks(activeTrack, TRACKS);
    return related.slice(0, 8).map((track) => {
      let reason = 'Similar vibe & style';
      const isSameArtist = track.artist.toLowerCase().includes(activeTrack.artist.toLowerCase()) ||
        activeTrack.artist.toLowerCase().includes(track.artist.toLowerCase());
      
      if (isSameArtist) {
        reason = `More from ${activeTrack.artist}`;
      } else if (
        track.genre &&
        activeTrack.genre &&
        (track.genre.toLowerCase().includes(activeTrack.genre.toLowerCase()) ||
         activeTrack.genre.toLowerCase().includes(track.genre.toLowerCase()))
      ) {
        reason = `${track.genre.split('/')[0].trim()} match`;
      } else if (Math.abs(track.bpm - activeTrack.bpm) <= 15) {
        reason = `Matching tempo (${track.bpm} BPM)`;
      } else if (track.audioPreset === activeTrack.audioPreset) {
        reason = `Complementary ${track.audioPreset} tone`;
      } else {
        reason = `Fans also enjoy`;
      }
      return { track, reason };
    });
  }, [activeTrack]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePlayRecommendedMix = () => {
    if (recommendedItems.length > 0) {
      onPlayTrack(recommendedItems[0].track);
      // Queue the remaining recommended tracks
      for (let i = 1; i < recommendedItems.length; i++) {
        onQueueTrack(recommendedItems[i].track);
      }
    }
  };

  const filteredTracks = selectedMood === 'All'
    ? TRACKS
    : selectedMood === 'Relax' || selectedMood === 'Focus'
    ? TRACKS.filter((t) => {
        const g = (t.genre || '').toLowerCase();
        return g.includes('r&b') || g.includes('indie') || g.includes('ballad') || g.includes('pop');
      })
    : selectedMood === 'Energize' || selectedMood === 'Workout'
    ? TRACKS.filter((t) => {
        const g = (t.genre || '').toLowerCase();
        return g.includes('dance') || g.includes('hip-hop') || g.includes('disco') || g.includes('synth') || t.bpm >= 120;
      })
    : TRACKS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-9">
      {/* Mood Filter Chips (YouTube Music Signature) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {MOODS.map((mood) => (
          <button
            key={mood}
            onClick={() => setSelectedMood(mood)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedMood === mood
                ? 'bg-white text-neutral-900 font-semibold shadow-sm'
                : 'bg-[#212121] hover:bg-[#2e2e2e] text-neutral-200 border border-neutral-800'
            }`}
          >
            {mood}
          </button>
        ))}
      </div>

      {/* Recommended for You Section - Powered by activeTrack metadata */}
      <section className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#1a1315]/80 via-[#141414] to-[#121212] border border-red-900/20 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-red-600/20 text-red-400 border border-red-500/30">
                <Sparkles className="w-3 h-3 fill-red-400 text-red-400" />
                Recommended for You
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-neutral-400 font-medium truncate max-w-xs sm:max-w-md">
                Inspired by <strong className="text-white font-semibold">{activeTrack.title}</strong> ({activeTrack.artist})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Similar Songs &amp; Radio Mix
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                {activeTrack.genre}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={handlePlayRecommendedMix}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Radio className="w-3.5 h-3.5" />
              Start Radio Mix
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recommendedItems.map(({ track, reason }) => {
            const isDownloaded = downloadedTrackIds.has(track.id) || track.isDownloaded;
            const isLiked = likedTrackIds.has(track.id);

            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="group p-3 rounded-xl bg-[#181818]/80 hover:bg-[#242424] cursor-pointer transition-all flex flex-col justify-between gap-3 border border-neutral-800/60 hover:border-red-900/40 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-md">
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {track.artist}
                    </p>
                    <div className="mt-1">
                      <span className="text-[10px] text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800/30 truncate block max-w-full font-mono">
                        {reason}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/50 text-[11px] text-neutral-400">
                  <span className="font-mono text-[10px] text-neutral-500">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')} · {track.bpm} BPM
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => toggleLike(track.id, e)}
                      title={isLiked ? 'Unlike' : 'Like'}
                      className="p-1.5 hover:bg-neutral-700/80 rounded-full text-neutral-400 hover:text-white transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQueueTrack(track);
                      }}
                      title="Play Next"
                      className="p-1.5 hover:bg-neutral-700/80 rounded-full text-neutral-400 hover:text-white transition-colors"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>

                    {onOpenAddToPlaylist && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddToPlaylist(track);
                        }}
                        title="Add to Playlist"
                        className="p-1.5 hover:bg-neutral-700/80 rounded-full text-neutral-400 hover:text-white transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadTrack(track);
                      }}
                      title={isDownloaded ? 'Downloaded Offline' : 'Download Audio to Device'}
                      className={`p-1.5 hover:bg-neutral-700/80 rounded-full transition-colors ${
                        isDownloaded ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Picks Section (YouTube Music 4-column Grid) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
              Start radio from a song
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Quick Picks
            </h2>
          </div>

          <button
            onClick={() => onPlayTrack(filteredTracks[0])}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#212121] hover:bg-[#2d2d2d] text-white border border-neutral-700 transition-colors"
          >
            Play all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {filteredTracks.map((track) => {
            const isDownloaded = downloadedTrackIds.has(track.id) || track.isDownloaded;
            const isLiked = likedTrackIds.has(track.id);

            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="group p-2 rounded-xl bg-[#121212]/70 hover:bg-[#212121] cursor-pointer transition-all flex items-center justify-between gap-3 border border-transparent hover:border-neutral-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-md">
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Quick Action Icons: Like, Download, Queue */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => toggleLike(track.id, e)}
                    title={isLiked ? 'Unlike' : 'Like'}
                    className="p-1.5 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQueueTrack(track);
                    }}
                    title="Play Next"
                    className="p-1.5 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>

                  {onOpenAddToPlaylist && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddToPlaylist(track);
                      }}
                      title="Add to Playlist"
                      className="p-1.5 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadTrack(track);
                    }}
                    title={isDownloaded ? 'Downloaded Offline' : 'Download Audio to Device'}
                    className={`p-1.5 hover:bg-neutral-700 rounded-full transition-colors ${
                      isDownloaded ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recommended Music Videos (16:9 YouTube aspect ratio) */}
      <section className="space-y-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
            Official Visualizers &amp; Live Sessions
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Recommended Music Videos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRACKS.slice(0, 6).map((track) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track)}
              className="group cursor-pointer space-y-2.5"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-lg">
                <img
                  src={track.albumArt}
                  alt={track.youtubeTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {track.youtubeTitle}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                  <span>{track.youtubeChannel}</span>
                  <span>·</span>
                  <span>{track.youtubeViews}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cross-Platform Curations & Synced Mixes */}
      <section className="space-y-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
            Cross-Platform Curations
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Mixed For You &amp; Synced Mixes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PLAYLISTS.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className="group cursor-pointer p-3.5 rounded-2xl bg-[#121212] hover:bg-[#212121] border border-neutral-800 transition-all space-y-3"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                <img
                  src={pl.coverImage}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                  {pl.syncedToYouTube ? 'Spotify + YouTube Synced' : 'Ready to Sync'}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {pl.name}
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2 mt-0.5">
                  {pl.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2 font-mono">
                  <span>{pl.trackCount} Tracks</span>
                  <span>{pl.creator}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
