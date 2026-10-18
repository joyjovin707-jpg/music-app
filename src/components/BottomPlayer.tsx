import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  Maximize2,
  Mic2,
  ListMusic,
  FolderPlus,
  Heart,
} from 'lucide-react';
import { Track } from '../types';

interface BottomPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  positionSec: number;
  volume: number;
  isMuted: boolean;
  roomCode: string;
  roomListenersCount: number;
  isLiked?: boolean;
  onTogglePlay: () => void;
  onSkip: () => void;
  onPrev?: () => void;
  onSeek: (pos: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onExpandRoom: () => void;
  onOpenLyrics?: () => void;
  onOpenQueue?: () => void;
  onOpenAddToPlaylist?: (track: Track) => void;
  onToggleLike?: (track: Track) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function BottomPlayer({
  currentTrack,
  isPlaying,
  positionSec,
  volume,
  isMuted,
  roomCode,
  roomListenersCount,
  isLiked = false,
  onTogglePlay,
  onSkip,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onExpandRoom,
  onOpenLyrics,
  onOpenQueue,
  onOpenAddToPlaylist,
  onToggleLike,
}: BottomPlayerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212]/98 backdrop-blur-2xl border-t border-neutral-800 px-4 sm:px-6 py-2 shadow-2xl transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Track Info & Quick Actions */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <div
            onClick={onExpandRoom}
            className="relative group shrink-0 cursor-pointer"
            title="Open Full Player"
          >
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover border border-neutral-800 shadow-md group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center gap-0.5">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce" />
              </div>
            )}
          </div>

          <div
            onClick={onExpandRoom}
            className="min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            title="Open Full Player & Lyrics"
          >
            <p className="text-xs font-bold text-white truncate hover:text-red-400 transition-colors">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-neutral-400 truncate">
              {currentTrack.artist}
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-1 ml-1 shrink-0">
            {onToggleLike && (
              <button
                onClick={() => onToggleLike(currentTrack)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            )}

            {onOpenAddToPlaylist && (
              <button
                onClick={() => onOpenAddToPlaylist(currentTrack)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Add to Playlist"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Center Playback Controls & Continuous Scrub Slider */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-4">
            {onPrev && (
              <button
                onClick={onPrev}
                title="Previous Track"
                className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-all shadow-md shadow-white/10"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onSkip}
              title="Next Track"
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2 text-[10px] font-mono text-neutral-400 tabular-nums">
            <span className="w-8 text-right">{formatTime(positionSec)}</span>
            <input
              type="range"
              min={0}
              max={currentTrack.duration || 210}
              value={positionSec}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
            />
            <span className="w-8">{formatTime(currentTrack.duration || 210)}</span>
          </div>
        </div>

        {/* Right Section: Lyrics Quick Button, Queue, Volume & Room Jump Pill */}
        <div className="flex items-center justify-end gap-2.5 w-1/4">
          {/* Quick Synced Lyrics Button */}
          {onOpenLyrics && (
            <button
              onClick={onOpenLyrics}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="View Synced Lyrics (LRCLIB)"
            >
              <Mic2 className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden xl:inline">Lyrics</span>
            </button>
          )}

          {/* Quick Queue Button */}
          {onOpenQueue && (
            <button
              onClick={onOpenQueue}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="View Up Next Queue"
            >
              <ListMusic className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Collaborative Room Pill */}
          <button
            onClick={onExpandRoom}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-mono transition-colors"
            title="Expand Full YouTube Music Player & Room"
          >
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span>#{roomCode}</span>
            <span className="text-neutral-500">·</span>
            <span>{roomListenersCount}</span>
            <Maximize2 className="w-3 h-3 text-red-400 ml-0.5" />
          </button>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-1.5 w-24">
            <button
              onClick={onToggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
