import { useState } from 'react';
import {
  Compass,
  Radio,
  Heart,
  Headphones,
  TrendingUp,
  Sparkles,
  Play,
  Plus,
  Flame,
  PieChart,
} from 'lucide-react';
import { FriendActivity, Track, Playlist } from '../../types';
import { FRIEND_ACTIVITIES, TASTE_PROFILE, PLAYLISTS, TRACKS } from '../../data/mockData';

interface SocialDiscoveryProps {
  onJoinRoom: (roomCode: string) => void;
  onPlayTrack: (track: Track) => void;
  onQueueTrack: (track: Track) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
}

export default function SocialDiscovery({
  onJoinRoom,
  onPlayTrack,
  onQueueTrack,
  onSelectPlaylist,
}: SocialDiscoveryProps) {
  const [activities, setActivities] = useState<FriendActivity[]>(FRIEND_ACTIVITIES);
  const [likedActivities, setLikedActivities] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLikedActivities((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Social Discovery Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0D121F] border border-slate-800/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Social Music Discovery &amp; Community</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            See what friends are streaming in real-time, jump into active rooms, and explore cross-platform community mixes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>4 Friends Online</span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Friend Stream & Trending) + Right Column (Taste DNA & Community Mixes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Friend Stream */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0D121F] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Friend Activity</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Real-Time Feed</span>
            </div>

            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={act.friendAvatar}
                      alt={act.friendName}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-700"
                      referrerPolicy="no-referrer"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-slate-200">{act.friendName}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400 font-mono text-[11px]">{act.timestamp}</span>
                      </div>

                      {act.activityType === 'listening_room' && (
                        <p className="text-xs text-slate-300 mt-0.5 truncate">
                          Listening in{' '}
                          <span className="text-emerald-400 font-medium">{act.roomName}</span>
                        </p>
                      )}

                      {act.activityType === 'synced_playlist' && (
                        <p className="text-xs text-slate-300 mt-0.5 truncate">
                          Synced playlist{' '}
                          <span className="text-emerald-400 font-medium">"{act.playlistName}"</span> to YouTube
                        </p>
                      )}

                      {act.activityType === 'liked_track' && (
                        <p className="text-xs text-slate-300 mt-0.5 truncate">
                          Liked{' '}
                          <span className="text-slate-100 font-medium">"{act.trackTitle}"</span> by {act.artist}
                        </p>
                      )}

                      {act.activityType === 'created_mix' && (
                        <p className="text-xs text-slate-300 mt-0.5 truncate">
                          Published new mix{' '}
                          <span className="text-purple-400 font-medium">"{act.playlistName}"</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => toggleLike(act.id)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        likedActivities[act.id]
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedActivities[act.id] ? 'fill-current' : ''}`} />
                    </button>

                    {act.roomCode && (
                      <button
                        onClick={() => onJoinRoom(act.roomCode!)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Radio className="w-3 h-3 text-emerald-400" />
                        <span>Join Room</span>
                      </button>
                    )}

                    {act.trackTitle && (
                      <button
                        onClick={() => {
                          const t = TRACKS.find((tr) => tr.title === act.trackTitle) || TRACKS[0];
                          onQueueTrack(t);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Queue</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Platform Trending Radar */}
          <div className="bg-[#0D121F] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Cross-Platform Trending Tracks</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">Spotify ⇄ YouTube</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRACKS.slice(0, 4).map((track, i) => (
                <div
                  key={track.id}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">#{i + 1}</span>
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{track.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onPlayTrack(track)}
                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Musical DNA & Community Curated Mixes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Musical DNA & Crossover Breakdown */}
          <div className="bg-[#0D121F] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Platform Streaming Affinity</h3>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums">148 Total Hours</span>
            </div>

            {/* Split Bar: Spotify vs YouTube */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-400">Spotify: {TASTE_PROFILE.platformAffinity.spotify}%</span>
                <span className="text-rose-400">YouTube: {TASTE_PROFILE.platformAffinity.youtube}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${TASTE_PROFILE.platformAffinity.spotify}%` }}
                />
                <div
                  className="h-full bg-rose-500 transition-all"
                  style={{ width: `${TASTE_PROFILE.platformAffinity.youtube}%` }}
                />
              </div>
            </div>

            {/* Genre breakdown */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-300">Top Soundscapes</span>
              <div className="space-y-2">
                {TASTE_PROFILE.topGenres.map((g) => (
                  <div key={g.genre} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{g.genre}</span>
                      <span className="font-mono tabular-nums text-slate-300">{g.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400/80 rounded-full"
                        style={{ width: `${g.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Curated Community Mixes */}
          <div className="bg-[#0D121F] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Community Curated Mixes</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Open Hub</span>
            </div>

            <div className="space-y-3">
              {PLAYLISTS.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl)}
                  className="group cursor-pointer p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={pl.coverImage}
                      alt={pl.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-800 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                        {pl.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                        <span>{pl.category}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{pl.trackCount} tracks</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-emerald-400 block tabular-nums">
                      {pl.likesCount} saves
                    </span>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      {pl.platform}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
