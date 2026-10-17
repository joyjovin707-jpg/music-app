import { Play, Pause, SkipForward, Volume2, VolumeX, Radio, Maximize2 } from 'lucide-react';
import { Track } from '../types';

interface BottomPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  positionSec: number;
  volume: number;
  isMuted: boolean;
  roomCode: string;
  roomListenersCount: number;
  onTogglePlay: () => void;
  onSkip: () => void;
  onSeek: (pos: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onExpandRoom: () => void;
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
  onTogglePlay,
  onSkip,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onExpandRoom,
}: BottomPlayerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#090D16]/95 backdrop-blur-xl border-t border-slate-800/90 px-4 sm:px-6 py-2.5 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <div className="relative group shrink-0">
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover border border-slate-800 shadow-md"
              referrerPolicy="no-referrer"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center gap-0.5">
                <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
            <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Center Playback Controls & Progress Slider */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
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
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2 text-[10px] font-mono text-slate-400 tabular-nums">
            <span className="w-8 text-right">{formatTime(positionSec)}</span>
            <input
              type="range"
              min={0}
              max={currentTrack.duration}
              value={positionSec}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
            />
            <span className="w-8">{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Right Section: Volume & Room Jump Pill */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          {/* Room Pill */}
          <button
            onClick={onExpandRoom}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono transition-colors"
            title="Expand Collaborative Room"
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>#{roomCode}</span>
            <span className="text-slate-500">·</span>
            <span>{roomListenersCount} listening</span>
            <Maximize2 className="w-3 h-3 text-emerald-400 ml-0.5" />
          </button>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-1.5 w-24">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
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
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
