import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Share2,
  Vote,
  Youtube,
  Radio,
  Sliders,
  Check,
  Disc,
} from 'lucide-react';
import { ListeningRoom, Track, ChatMessage, FloatingReaction } from '../../types';
import { audioEngine } from '../../services/audioEngine';
import { roomEngine } from '../../services/roomEngine';
import AudioVisualizer from '../AudioVisualizer';
import RoomChat from './RoomChat';
import RoomQueue from './RoomQueue';
import RoomMembers from './RoomMembers';

interface CollaborativeRoomProps {
  room: ListeningRoom;
  isPlaying: boolean;
  positionSec: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSkip: () => void;
  onSeek: (pos: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onUpdateRoom: (room: ListeningRoom) => void;
  onNavigateToSync?: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function CollaborativeRoom({
  room,
  isPlaying,
  positionSec,
  volume,
  isMuted,
  onTogglePlay,
  onSkip,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onUpdateRoom,
  onNavigateToSync,
}: CollaborativeRoomProps) {
  const [streamMode, setStreamMode] = useState<'synth' | 'youtube' | 'spotify'>('synth');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(roomEngine.getChatMessages());
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [hasVotedSkip, setHasVotedSkip] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to roomEngine multi-tab events (chat, reactions)
  useEffect(() => {
    const unsubscribe = roomEngine.subscribe((event) => {
      if (event.type === 'chat_message') {
        setChatMessages([...roomEngine.getChatMessages()]);
      } else if (event.type === 'reaction') {
        const react = event.payload as FloatingReaction;
        setReactions((prev) => [...prev.slice(-12), react]);
      } else if (event.type === 'track_change') {
        setHasVotedSkip(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleVoteSkip = () => {
    if (hasVotedSkip) return;
    setHasVotedSkip(true);
    const { skipped } = roomEngine.voteSkip();
    if (skipped) {
      onSkip();
      setHasVotedSkip(false);
    }
  };



  const handleSendChat = (text: string) => {
    roomEngine.sendChatMessage(text, 'You (Host)', 'host');
  };

  const handleSendReaction = (emoji: string) => {
    const newReact = roomEngine.sendReaction(emoji, 'You');
    setReactions((prev) => [...prev.slice(-12), newReact]);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}?room=${room.code}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddTrackToQueue = (track: Track) => {
    roomEngine.addToQueue(track, 'You');
    onUpdateRoom({ ...roomEngine.getRoom() });
  };

  const handleRemoveTrack = (trackId: string) => {
    roomEngine.removeFromQueue(trackId);
    onUpdateRoom({ ...roomEngine.getRoom() });
  };

  const handleReorderQueue = (from: number, to: number) => {
    roomEngine.reorderQueue(from, to);
    onUpdateRoom({ ...roomEngine.getRoom() });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Room Information Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D121F] border border-slate-800/80">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white truncate">{room.name}</h2>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-emerald-400 font-mono">Code: {room.code}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">Host: {room.hostName}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{room.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyInvite}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Room Link'}</span>
          </button>

          {onNavigateToSync && (
            <button
              onClick={onNavigateToSync}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium text-emerald-400 border border-emerald-500/30 transition-colors"
            >
              Sync to YouTube/Spotify
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Split: Player Centerstage on Left, Social & Queue on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage: Center Player & Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative p-6 rounded-2xl bg-[#0D121F] border border-slate-800/80 shadow-2xl overflow-hidden">
            {/* Ambient Backlight Glow based on album */}
            <div
              className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ backgroundColor: '#10B981' }}
            />

            {/* Floating Reactions Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  style={{ left: `${r.leftPercent}%`, bottom: '25%' }}
                  className="absolute text-3xl select-none animate-reaction"
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Vinyl & Cover Artwork Container */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-6">
                <div
                  className={`w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 ${
                    isPlaying ? 'ring-2 ring-emerald-500/40' : ''
                  }`}
                >
                  <img
                    src={room.currentTrack.albumArt}
                    alt={room.currentTrack.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Rotating Vinyl Disc Peek */}
                <div
                  className={`absolute -right-6 top-3 w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-slate-950 border-4 border-slate-900 shadow-xl -z-10 flex items-center justify-center opacity-85 ${
                    isPlaying ? 'animate-spin [animation-duration:6s]' : ''
                  }`}
                >
                  <div className="w-16 h-16 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center">
                    <Disc className="w-8 h-8 text-slate-600" />
                  </div>
                </div>
              </div>

              {/* Track Title and Artist */}
              <div className="text-center max-w-md space-y-1 mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-wrap-balance">
                  {room.currentTrack.title}
                </h3>
                <p className="text-sm text-slate-300 font-medium">
                  {room.currentTrack.artist}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{room.currentTrack.album}</span>
                  <span>·</span>
                  <span>{room.currentTrack.genre}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{room.currentTrack.bpm} BPM</span>
                </div>
              </div>

              {/* Audio Visualizer */}
              <div className="w-full max-w-sm mb-4">
                <AudioVisualizer isPlaying={isPlaying} accentColor="#10B981" barsCount={30} />
              </div>

              {/* Progress Slider */}
              <div className="w-full space-y-1.5 mb-6">
                <input
                  type="range"
                  min={0}
                  max={room.currentTrack.duration}
                  value={positionSec}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                  <span>{formatTime(positionSec)}</span>
                  <span>{formatTime(room.currentTrack.duration)}</span>
                </div>
              </div>

              {/* Main Playback Controls Bar */}
              <div className="flex items-center justify-between w-full max-w-md pt-2">
                {/* Volume slider */}
                <div className="flex items-center gap-2 w-28">
                  <button
                    onClick={onToggleMute}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
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

                {/* Primary Play/Pause Button */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={onTogglePlay}
                    className="w-13 h-13 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-emerald-500/25"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={onSkip}
                    title="Skip to next track in queue"
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Vote to Skip */}
                <button
                  onClick={handleVoteSkip}
                  disabled={hasVotedSkip}
                  title="Collaborative vote to skip current track"
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    hasVotedSkip
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <Vote className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Skip ({room.voteSkipCount}/{room.voteSkipRequired})
                  </span>
                </button>
              </div>

              {/* Cross-Platform Stream Engine Switcher */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 w-full flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Stream Source:</span>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setStreamMode('synth')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      streamMode === 'synth'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Web Audio Synth
                  </button>

                  <button
                    onClick={() => setStreamMode('youtube')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                      streamMode === 'youtube'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Youtube className="w-3 h-3 text-rose-400" />
                    <span>YouTube Match</span>
                  </button>

                  <button
                    onClick={() => setStreamMode('spotify')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                      streamMode === 'spotify'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Disc className="w-3 h-3 text-emerald-400" />
                    <span>Spotify Meta</span>
                  </button>
                </div>
              </div>

              {/* Mode Specific Details View */}
              {streamMode === 'youtube' && (
                <div className="w-full mt-3 p-3 rounded-lg bg-slate-900/80 border border-rose-500/30 text-xs space-y-1 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-rose-300 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5" />
                      {room.currentTrack.youtubeTitle}
                    </span>
                    <span className="font-mono text-emerald-400">
                      {room.currentTrack.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Channel: {room.currentTrack.youtubeChannel} · {room.currentTrack.youtubeViews} · Video ID: {room.currentTrack.youtubeId}
                  </p>
                </div>
              )}

              {streamMode === 'spotify' && (
                <div className="w-full mt-3 p-3 rounded-lg bg-slate-900/80 border border-emerald-500/30 text-xs space-y-1 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-emerald-300 flex items-center gap-1.5">
                      <Disc className="w-3.5 h-3.5" />
                      Spotify ID: {room.currentTrack.spotifyId}
                    </span>
                    <span className="font-mono text-slate-300">
                      Popularity: {room.currentTrack.spotifyPopularity}/100
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    URI: {room.currentTrack.spotifyUri}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active Listening Peers Strip */}
          <RoomMembers members={room.members} onInviteFriend={handleCopyInvite} />
        </div>

        {/* Right Stage: Collaborative Queue & Room Chat */}
        <div className="lg:col-span-5 space-y-6">
          {/* Room Queue */}
          <RoomQueue
            queue={room.queue}
            history={room.history}
            onRemoveTrack={handleRemoveTrack}
            onReorder={handleReorderQueue}
            onAddToQueue={handleAddTrackToQueue}
            mode={room.mode}
          />

          {/* Room Chat & Social Activity Feed */}
          <RoomChat
            messages={chatMessages}
            onSendMessage={handleSendChat}
            onSendReaction={handleSendReaction}
          />
        </div>
      </div>
    </div>
  );
}
