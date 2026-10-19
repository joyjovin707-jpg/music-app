import { useEffect, useRef, useState, useCallback } from 'react';
import { Youtube, ChevronDown, ChevronUp } from 'lucide-react';
import { Track } from '../../types';
import { resolveFullYouTubeId } from '../../services/musicDatabaseService';

interface PersistentAudioPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  seekPos: number | null;
  onTimeUpdate: (currentSec: number) => void;
  onDurationChange?: (durationSec: number) => void;
  onEnded: () => void;
}

export default function PersistentAudioPlayer({
  currentTrack,
  isPlaying,
  volume,
  isMuted,
  seekPos,
  onTimeUpdate,
  onDurationChange,
  onEnded,
}: PersistentAudioPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isIframeReadyRef = useRef<boolean>(false);
  const hasEndedRef = useRef<boolean>(false);
  const trackLoadTimeRef = useRef<number>(Date.now());
  const currentTimeRef = useRef<number>(0);
  const trackDurationRef = useRef<number>(currentTrack.duration || 200);
  const prevTrackIdRef = useRef<string>(currentTrack.id);

  // Compute initial target ID synchronously to avoid starting lag
  const getImmediateId = useCallback((track: Track): string => {
    if (track.youtubeId && !track.youtubeId.startsWith('yt_') && track.youtubeId.length >= 10) {
      return track.youtubeId;
    }
    const resolved = resolveFullYouTubeId(track.artist, track.title);
    if (resolved) return resolved;
    return '4NRXx6U8ABQ'; // Default: Blinding Lights
  }, []);

  const [activeYtId, setActiveYtId] = useState<string>(() => getImmediateId(currentTrack));
  const [isResolving, setIsResolving] = useState(false);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);

  // Send control commands to YouTube iframe API
  const sendCommand = useCallback((func: string, args: unknown[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*'
        );
      } catch {
        // Safe guard
      }
    }
  }, []);

  // Safe trigger for track completion to guarantee only one transition per genuine song ending
  const triggerEnded = useCallback(() => {
    if (hasEndedRef.current) return;
    const elapsedMs = Date.now() - trackLoadTimeRef.current;
    const curr = currentTimeRef.current;
    const dur = trackDurationRef.current;

    // A song genuinely ends when currentTime is near the duration, or has completed at least 80% with substantial playback
    const isNearEnd = dur > 0 && curr >= Math.max(10, dur - 4);
    const hasSubstantialProgress = curr >= 20 && dur > 0 && curr >= dur * 0.85;
    const isLongPlayback = elapsedMs >= 15000 && dur > 0 && curr >= dur * 0.8;

    if (!isNearEnd && !hasSubstantialProgress && !isLongPlayback) {
      return;
    }

    hasEndedRef.current = true;
    onEnded();
  }, [onEnded]);

  // Handle track changes
  useEffect(() => {
    let isCancelled = false;
    const targetId = getImmediateId(currentTrack);

    hasEndedRef.current = false;
    trackLoadTimeRef.current = Date.now();
    currentTimeRef.current = 0;
    trackDurationRef.current = currentTrack.duration || 200;
    const isDifferentTrack = prevTrackIdRef.current !== currentTrack.id;
    prevTrackIdRef.current = currentTrack.id;

    if (activeYtId !== targetId) {
      setActiveYtId(targetId);
    } else if (isDifferentTrack || isIframeReadyRef.current) {
      // If same YouTube ID but replayed / next track, seek to start and play
      sendCommand('seekTo', [0, true]);
      if (isPlaying) {
        sendCommand('playVideo');
      }
    }

    // If not a verified hit, attempt background resolution without blocking
    const isVerified = Boolean(
      (currentTrack.youtubeId && !currentTrack.youtubeId.startsWith('yt_')) ||
      resolveFullYouTubeId(currentTrack.artist, currentTrack.title)
    );

    if (!isVerified) {
      setIsResolving(true);
      const cleanArt = currentTrack.artist.split(/,|&|feat\.|ft\./i)[0].trim();
      const cleanTit = currentTrack.title
        .replace(/[\(\[](feat\.|ft\.|official|video|remastered|version|audio|deluxe|explicit|remix).*?[\)\]]/gi, '')
        .trim();

      const query = `${cleanArt} ${cleanTit}`;

      fetch(`/api/resolve-youtube?q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isCancelled && data && data.youtubeId && data.youtubeId !== targetId) {
            setActiveYtId(data.youtubeId);
            if (isIframeReadyRef.current) {
              sendCommand('loadVideoById', [data.youtubeId, 0]);
              if (isPlaying) {
                sendCommand('playVideo');
              }
            }
          }
        })
        .catch(() => {
          // Fallback ID remains active
        })
        .finally(() => {
          if (!isCancelled) setIsResolving(false);
        });
    } else {
      setIsResolving(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [currentTrack, getImmediateId, isPlaying, sendCommand, activeYtId]);

  // Sync Play / Pause state with YouTube player
  useEffect(() => {
    if (isPlaying) {
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }, [isPlaying, sendCommand]);

  // Sync Volume & Mute with YouTube player
  useEffect(() => {
    if (isMuted) {
      sendCommand('mute');
    } else {
      sendCommand('unMute');
      sendCommand('setVolume', [Math.round(volume * 100)]);
    }
  }, [volume, isMuted, sendCommand]);

  // Handle Seek requests
  useEffect(() => {
    if (seekPos !== null) {
      currentTimeRef.current = seekPos;
      // If seeking away from the end, reset ended flag
      if (trackDurationRef.current > 0 && seekPos < trackDurationRef.current - 5) {
        hasEndedRef.current = false;
      }
      sendCommand('seekTo', [seekPos, true]);
      if (isPlaying) {
        sendCommand('playVideo');
      }
    }
  }, [seekPos, isPlaying, sendCommand]);

  // Listen to YouTube player state events (time updates & track ending)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        if (typeof e.data === 'string') {
          const data = JSON.parse(e.data);

          if (data.event === 'onReady') {
            isIframeReadyRef.current = true;
            sendCommand('unMute');
            sendCommand('setVolume', [Math.round(volume * 100)]);
            sendCommand('getDuration');
            if (isPlaying) {
              sendCommand('playVideo');
            }
          }

          // State change event (0 = ended, 1 = playing, 2 = paused)
          if (data.event === 'onStateChange') {
            if (data.info === 0) {
              triggerEnded();
            } else if (data.info === 1) {
              hasEndedRef.current = false;
              sendCommand('getDuration');
            }
          }

          // infoDelivery or initialDelivery updates
          if ((data.event === 'infoDelivery' || data.event === 'initialDelivery') && data.info) {
            if (typeof data.info.currentTime === 'number' && data.info.currentTime >= 0) {
              currentTimeRef.current = data.info.currentTime;
              onTimeUpdate(Math.floor(data.info.currentTime));
            }

            // Capture duration from YouTube duration number or videoData length_seconds
            const reportedDuration =
              typeof data.info.duration === 'number' && data.info.duration > 0
                ? data.info.duration
                : data.info.videoData && Number(data.info.videoData.length_seconds) > 0
                ? Number(data.info.videoData.length_seconds)
                : null;

            if (reportedDuration && reportedDuration > 0) {
              const durSec = Math.round(reportedDuration);
              trackDurationRef.current = durSec;
              if (onDurationChange) {
                onDurationChange(durSec);
              }
            }

            // playerState 0 = Ended
            if (data.info.playerState === 0) {
              triggerEnded();
            } else if (data.info.playerState === 1) {
              hasEndedRef.current = false;
            }
          }
        }
      } catch {
        // Ignore non-json postMessages from third-party extensions
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTimeUpdate, onDurationChange, triggerEnded, volume, isPlaying, sendCommand]);

  // Build high-compatibility embed URL
  const embedUrl = `https://www.youtube-nocookie.com/embed/${activeYtId}?enablejsapi=1&autoplay=1&controls=1&playsinline=1&rel=0`;

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ${
        isMiniPlayerOpen
          ? 'bottom-20 right-4 w-72 sm:w-80 shadow-2xl rounded-2xl overflow-hidden border border-neutral-800 bg-[#121212]'
          : 'bottom-20 right-4 w-64 shadow-xl rounded-xl overflow-hidden border border-neutral-800/90 bg-[#121212]/95 backdrop-blur-md'
      }`}
    >
      {/* Header bar of floating player widget */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#181818] border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-300 truncate max-w-[170px]">
          <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate font-semibold text-[11px] text-neutral-200">
            {isResolving ? 'Resolving Full Song...' : 'YouTube Full Audio'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMiniPlayerOpen(!isMiniPlayerOpen)}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-0.5"
            title={isMiniPlayerOpen ? 'Minimize Video View' : 'Open Video View'}
          >
            {isMiniPlayerOpen ? (
              <>
                <span>Mini</span>
                <ChevronDown className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Video</span>
                <ChevronUp className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Persistent Single Iframe Container: Never destroyed on view switch to maintain uninterrupted audio */}
      <div className={isMiniPlayerOpen ? 'aspect-video w-full bg-black relative' : 'p-2.5 flex items-center justify-between gap-2.5'}>
        <div
          className={
            isMiniPlayerOpen
              ? 'w-full h-full'
              : 'w-16 h-10 rounded overflow-hidden bg-black shrink-0 relative shadow'
          }
        >
          <iframe
            ref={iframeRef}
            id="persistent-youtube-player-singleton"
            title={`${currentTrack.artist} - ${currentTrack.title}`}
            src={embedUrl}
            allow="autoplay; encrypted-media; picture-in-picture"
            className="w-full h-full border-0"
          />
        </div>

        {!isMiniPlayerOpen && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
              {currentTrack.artist}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full Song Stream</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
