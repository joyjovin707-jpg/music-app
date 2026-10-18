import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Download,
  Check,
  Heart,
  Share2,
  Radio,
  ListMusic,
  FileText,
  Sparkles,
  Youtube,
  Music,
  Plus,
  Loader2,
  FolderPlus,
  Mic2,
  Maximize2,
  Type,
} from 'lucide-react';
import { Track, SyncedLyricLine } from '../../types';
import { TRACKS } from '../../data/mockData';
import AudioVisualizer from '../AudioVisualizer';
import { MusicDatabaseService } from '../../services/musicDatabaseService';
import { Copy, History } from 'lucide-react';

interface PlayerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  isPlaying: boolean;
  positionSec: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  history?: Track[];
  isDownloaded: boolean;
  onTogglePlay: () => void;
  onSkip: () => void;
  onPrev: () => void;
  onSeek: (pos: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onDownload: (track: Track) => void;
  onQueueTrack: (track: Track) => void;
  onPlayTrack?: (track: Track) => void;
  onPlayHistoryTrack?: (track: Track) => void;
  onOpenRoom: () => void;
  onOpenAddToPlaylist?: (track: Track) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlayerDrawer({
  isOpen,
  onClose,
  track,
  isPlaying,
  positionSec,
  volume,
  isMuted,
  queue,
  history = [],
  isDownloaded,
  onTogglePlay,
  onSkip,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onDownload,
  onQueueTrack,
  onPlayTrack,
  onPlayHistoryTrack,
  onOpenRoom,
  onOpenAddToPlaylist,
}: PlayerDrawerProps) {
  const [mode, setMode] = useState<'song' | 'video'>('song');
  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics' | 'related'>('queue');
  const [queueSubTab, setQueueSubTab] = useState<'up_next' | 'history'>('up_next');
  const [isLiked, setIsLiked] = useState(false);
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLyricLine[]>([]);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

  const relatedTracks = MusicDatabaseService.getRelatedTracks(track, TRACKS);

  // Auto-fetch real-time synced lyrics from LRCLIB with timestamps
  useEffect(() => {
    let active = true;
    const loadLyrics = async () => {
      setIsFetchingLyrics(true);
      const lyrics = await MusicDatabaseService.fetchSyncedLyrics(
        track.artist,
        track.title,
        track.duration
      );

      if (active) {
        if (lyrics && lyrics.length > 0) {
          setSyncedLyrics(lyrics);
        } else if (track.lyrics && track.lyrics.length > 0) {
          const step = (track.duration || 210) / track.lyrics.length;
          setSyncedLyrics(
            track.lyrics.map((text, i) => ({
              timeSec: Math.round(i * step),
              text,
            }))
          );
        } else {
          setSyncedLyrics([
            { timeSec: 0, text: `[Instrumental intro for ${track.title}]` },
            { timeSec: 15, text: `Listening to ${track.artist}` },
            { timeSec: 45, text: 'Lyrics are being synchronized from LRCLIB...' },
          ]);
        }
        setIsFetchingLyrics(false);
      }
    };

    loadLyrics();
    return () => {
      active = false;
    };
  }, [track.title, track.artist, track.duration]);

  // Determine active lyric line based on current positionSec
  let activeLyricIdx = -1;
  for (let i = 0; i < syncedLyrics.length; i++) {
    if (positionSec >= syncedLyrics[i].timeSec) {
      activeLyricIdx = i;
    } else {
      break;
    }
  }

  // Auto-scroll lyrics container so active line stays in view
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIdx, activeTab]);

  const handleCopyLyrics = () => {
    const text = syncedLyrics.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030303]/98 backdrop-blur-2xl flex flex-col overflow-y-auto animate-fade-in text-neutral-100">
      {/* Top Header Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800/80 shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          title="Minimize player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Song / Video Switcher (YouTube Music Signature) */}
        <div className="flex items-center bg-[#212121] p-1 rounded-full border border-neutral-700">
          <button
            onClick={() => setMode('song')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              mode === 'song'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Song</span>
          </button>

          <button
            onClick={() => setMode('video')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              mode === 'video'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>
        </div>

        <button
          onClick={onOpenRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-600/30 transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="hidden sm:inline">Collaborative Room</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Artwork / Video Player & Controls */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-6">
          {mode === 'song' ? (
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 group">
              <img
                src={track.albumArt}
                alt={track.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {isPlaying && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <AudioVisualizer isPlaying={isPlaying} accentColor="#EF4444" barsCount={32} />
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full max-w-xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-black flex flex-col items-center justify-center">
              <iframe
                title={track.youtubeTitle}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${track.youtubeId && !track.youtubeId.startsWith('yt_') ? track.youtubeId : '4NRXx6U8ABQ'}?autoplay=1&enablejsapi=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Track Details & Action Buttons */}
          <div className="w-full max-w-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-4">
                <h2 className="text-2xl font-bold text-white tracking-tight truncate">
                  {track.title}
                </h2>
                <p className="text-sm text-neutral-400 font-medium truncate mt-0.5">
                  {track.artist} · {track.album}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  title={isLiked ? 'Remove from Liked' : 'Add to Liked'}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {onOpenAddToPlaylist && (
                  <button
                    onClick={() => onOpenAddToPlaylist(track)}
                    className="p-2.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Add to Playlist"
                  >
                    <FolderPlus className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={() => onDownload(track)}
                  title={isDownloaded ? 'Downloaded Offline' : 'Download track audio'}
                  className={`p-2.5 rounded-full hover:bg-neutral-800 transition-colors ${
                    isDownloaded ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {isDownloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Scrub Slider */}
            <div className="pt-2 space-y-1">
              <input
                type="range"
                min={0}
                max={track.duration}
                value={positionSec}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
              />
              <div className="flex justify-between text-xs font-mono text-neutral-400 tabular-nums">
                <span>{formatTime(positionSec)}</span>
                <span>{formatTime(track.duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2 w-28">
                <button onClick={onToggleMute} className="text-neutral-400 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              <div className="flex items-center gap-5">
                <button
                  onClick={onPrev}
                  className="p-3 text-neutral-400 hover:text-white transition-colors"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>

                <button
                  onClick={onTogglePlay}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={onSkip}
                  className="p-3 text-neutral-400 hover:text-white transition-colors"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
              </div>

              <div className="w-28 text-right">
                <span className="text-xs font-mono text-neutral-400">
                  {track.bpm} BPM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Up Next Queue, Real-time Lyrics & Related */}
        <div className="lg:col-span-5 bg-[#121212] border border-neutral-800 rounded-3xl p-5 shadow-2xl h-[560px] flex flex-col">
          {/* Tabs */}
          <div className="flex items-center border-b border-neutral-800 pb-3 gap-6 shrink-0">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors pb-1 ${
                activeTab === 'queue'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              <span>Up Next</span>
            </button>

            <button
              onClick={() => setActiveTab('lyrics')}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors pb-1 ${
                activeTab === 'lyrics'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Synced Lyrics</span>
            </button>

            <button
              onClick={() => setActiveTab('related')}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors pb-1 ${
                activeTab === 'related'
                  ? 'text-white border-b-2 border-red-500'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Related</span>
            </button>
          </div>

          {/* Tab 1: Up Next Queue & Previously Played */}
          {activeTab === 'queue' && (
            <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1">
              {/* Sub-tab switcher: Up Next vs Previously Played */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 shrink-0">
                <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs">
                  <button
                    onClick={() => setQueueSubTab('up_next')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      queueSubTab === 'up_next'
                        ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Up Next ({queue.length})
                  </button>
                  <button
                    onClick={() => setQueueSubTab('history')}
                    className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                      queueSubTab === 'history'
                        ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    Previously Played ({history.length})
                  </button>
                </div>
              </div>

              {queueSubTab === 'up_next' ? (
                <div className="space-y-3">
                  {/* Now Playing Card */}
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-900/40 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-md">
                        <img
                          src={track.albumArt}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 h-full bg-red-400 animate-pulse" />
                            <span className="w-0.5 h-2/3 bg-red-400 animate-pulse delay-75" />
                            <span className="w-0.5 h-4/5 bg-red-400 animate-pulse delay-150" />
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                            Now Playing
                          </span>
                        </div>
                        <p className="font-semibold text-white truncate text-xs">{track.title}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <span className="font-mono text-neutral-400 text-xs shrink-0">
                      {formatTime(positionSec)} / {formatTime(track.duration)}
                    </span>
                  </div>

                  {/* Queued tracks list */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1">
                      <span>Queue · Playing Next</span>
                      <span>{queue.length} Tracks</span>
                    </div>

                    {queue.length === 0 ? (
                      <div className="text-center py-8 text-xs text-neutral-500">
                        No more songs in queue. Pick a track from Related or Home to play next!
                      </div>
                    ) : (
                      queue.map((t, idx) => (
                        <div
                          key={`${t.id}-${idx}`}
                          onClick={() => onPlayTrack && onPlayTrack(t)}
                          className="p-2.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group"
                          title="Click to play this track"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-4 text-center font-mono text-neutral-500 tabular-nums group-hover:hidden">
                              {idx + 1}
                            </span>
                            <Play className="w-4 h-4 text-red-500 hidden group-hover:block shrink-0 fill-current" />
                            <img
                              src={t.albumArt}
                              alt={t.title}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                                  {t.title}
                                </p>
                                {t.queuedBy && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-900/50 text-red-300 font-mono border border-red-700/40 shrink-0">
                                    Play Next
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-400 truncate">{t.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-neutral-500 tabular-nums">
                              {formatTime(t.duration)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Previously Played History List */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1">
                    <span>Listening History</span>
                    <span>{history.length} Previous Tracks</span>
                  </div>

                  {history.length === 0 ? (
                    <div className="text-center py-10 text-xs text-neutral-500 space-y-1">
                      <History className="w-6 h-6 mx-auto text-neutral-600 mb-2" />
                      <p>No previously played songs in this session yet.</p>
                      <p className="text-[11px] text-neutral-600">Songs will appear here as you listen or skip.</p>
                    </div>
                  ) : (
                    history.map((t, idx) => (
                      <div
                        key={`hist-${t.id}-${idx}`}
                        className="p-2.5 rounded-xl bg-neutral-900/50 hover:bg-neutral-800/80 transition-colors flex items-center justify-between gap-3 text-xs group"
                      >
                        <div
                          onClick={() => {
                            if (onPlayHistoryTrack) onPlayHistoryTrack(t);
                            else if (onPlayTrack) onPlayTrack(t);
                          }}
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                          title="Click to play again"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm">
                            <img
                              src={t.albumArt}
                              alt={t.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                              {t.title}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">{t.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-neutral-500 tabular-nums mr-1">
                            {formatTime(t.duration)}
                          </span>

                          <button
                            onClick={() => onQueueTrack(t)}
                            title="Add back to Play Next"
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] flex items-center gap-1 font-medium transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Play Next</span>
                          </button>

                          <button
                            onClick={() => {
                              if (onPlayHistoryTrack) onPlayHistoryTrack(t);
                              else if (onPlayTrack) onPlayTrack(t);
                            }}
                            title="Play Now"
                            className="p-1.5 rounded-full hover:bg-red-600/20 text-neutral-400 hover:text-red-400 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Synced Lyrics */}
          {activeTab === 'lyrics' && (
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 no-scrollbar flex flex-col">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2 shrink-0">
                <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-red-500" />
                  <span>LRCLIB Synced Karaoke Engine</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsKaraokeMode(!isKaraokeMode)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
                      isKaraokeMode
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title="Toggle Immersive Karaoke Mode"
                  >
                    <Mic2 className="w-3 h-3" />
                    <span>Karaoke</span>
                  </button>

                  <button
                    onClick={handleCopyLyrics}
                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                    title="Copy full lyrics"
                  >
                    {copiedLyrics ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLyrics ? 'Copied' : 'Copy'}</span>
                  </button>
                  {isFetchingLyrics && <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />}
                </div>
              </div>

              <div
                className={`flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar transition-all ${
                  isKaraokeMode ? 'py-8 text-center' : 'py-2'
                }`}
              >
                {syncedLyrics.map((line, idx) => {
                  const isActive = idx === activeLyricIdx;
                  const isPast = idx < activeLyricIdx;
                  return (
                    <p
                      key={`${line.timeSec}-${idx}`}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => onSeek(line.timeSec)}
                      title={`Click to jump to ${formatTime(line.timeSec)}`}
                      className={`transition-all duration-300 cursor-pointer rounded-xl select-none ${
                        isKaraokeMode
                          ? isActive
                            ? 'text-white font-extrabold text-2xl py-3 px-4 bg-red-600/20 rounded-2xl shadow-xl shadow-red-500/10 scale-105 border border-red-500/40 text-glow'
                            : isPast
                            ? 'text-neutral-500 text-base py-1.5 opacity-50 hover:opacity-80'
                            : 'text-neutral-400 text-base py-1.5 opacity-70 hover:opacity-100'
                          : isActive
                          ? 'text-white font-bold text-base p-2.5 bg-neutral-900/90 border-l-4 border-red-500 shadow-md shadow-red-500/10 scale-101 flex items-baseline justify-between gap-3'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40 p-2 flex items-baseline justify-between gap-3 text-sm'
                      }`}
                    >
                      <span className={isKaraokeMode ? 'block' : 'flex-1'}>{line.text}</span>
                      {!isKaraokeMode && (
                        <span className="text-[10px] font-mono text-neutral-500 tabular-nums shrink-0">
                          {formatTime(line.timeSec)}
                        </span>
                      )}
                    </p>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-500 shrink-0">
                <span>Click any line to seek</span>
                <span>
                  {activeLyricIdx >= 0 ? `${activeLyricIdx + 1} / ${syncedLyrics.length}` : 'Starting...'}
                </span>
              </div>
            </div>
          )}

          {/* Tab 3: Related */}
          {activeTab === 'related' && (
            <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 block mb-2">
                  Similar Songs · Up Next in Queue
                </span>
                <div className="space-y-2">
                  {relatedTracks.slice(0, 6).map((rt) => (
                    <div
                      key={rt.id}
                      onClick={() => onPlayTrack && onPlayTrack(rt)}
                      className="p-2.5 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/90 transition-all flex items-center justify-between gap-3 text-xs cursor-pointer group border border-transparent hover:border-neutral-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={rt.albumArt}
                            alt={rt.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                            {rt.title}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">{rt.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-neutral-500 tabular-nums text-[11px]">
                          {formatTime(rt.duration)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQueueTrack(rt);
                          }}
                          title="Add to Up Next Queue"
                          className="p-1.5 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <p className="font-bold text-white">About {track.artist}</p>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {track.artist} is ranked in the global top charts. Matched across Spotify and YouTube Music catalogs with 99.8% audio fingerprint precision.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <p className="font-bold text-white">Platform Crossover Metrics</p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Spotify Popularity Score</span>
                  <span className="font-mono text-emerald-400">{track.spotifyPopularity}/100</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">YouTube Stream Counts</span>
                  <span className="font-mono text-red-400">{track.youtubeViews}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Lossless Audio Format</span>
                  <span className="font-mono text-neutral-300">WAV 44.1kHz / 16-bit PCM</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
