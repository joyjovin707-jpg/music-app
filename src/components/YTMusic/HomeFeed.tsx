import { useState } from 'react';
import { Play, Download, Check, Heart, MoreVertical, Sparkles, Radio } from 'lucide-react';
import { Track, Playlist } from '../../types';
import { TRACKS, PLAYLISTS } from '../../data/mockData';

interface HomeFeedProps {
  onPlayTrack: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
  downloadedTrackIds: Set<string>;
  onSelectPlaylist: (playlist: Playlist) => void;
  onQueueTrack: (track: Track) => void;
}

const MOODS = ['All', 'Energize', 'Workout', 'Relax', 'Focus', 'Commute'];

export default function HomeFeed({
  onPlayTrack,
  onDownloadTrack,
  downloadedTrackIds,
  onSelectPlaylist,
  onQueueTrack,
}: HomeFeedProps) {
  const [selectedMood, setSelectedMood] = useState('All');
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set(['track-1', 'track-2']));

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTracks = selectedMood === 'All'
    ? TRACKS
    : selectedMood === 'Relax' || selectedMood === 'Focus'
    ? TRACKS.filter((t) => t.genre.includes('Lo-Fi') || t.genre.includes('Ambient'))
    : TRACKS.filter((t) => t.genre.includes('Synthwave') || t.genre.includes('Outrun'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-8">
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
          {TRACKS.slice(0, 3).map((track) => (
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

      {/* Forgotten Favorites & Mixed For You */}
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
