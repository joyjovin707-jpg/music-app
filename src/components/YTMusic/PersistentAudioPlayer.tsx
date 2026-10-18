import { useEffect, useRef, useState, useCallback } from 'react';
import { Youtube, ChevronDown, ChevronUp, Play, Volume2 } from 'lucide-react';
import { Track } from '../../types';
import { resolveFullYouTubeId } from '../../services/musicDatabaseService';

interface PersistentAudioPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  seekPos: number | null;
  onTimeUpdate: (currentSec: number) => void;
  onEnded: () => void;
}

export default function PersistentAudioPlayer({
  currentTrack,
  isPlaying,
  volume,
  isMuted,
  seekPos,
  onTimeUpdate,
  onEnded,
}: PersistentAudioPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isIframeReadyRef = useRef<boolean>(false);

  // Compute initial target ID synchronously to avoid starting lag
  const getImmediateId = (track: Track): string => {
    if (track.youtubeId && !track.youtubeId.startsWith('yt_') && track.youtubeId.length >= 10) {
      return track.youtubeId;
    }
    const resolved = resolveFullYouTubeId(track.artist, track.title);
    if (resolved) return resolved;
    return '4NRXx6U8ABQ'; // Default: Blinding Lights
  };

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

  // Dynamically resolve full YouTube video ID when track changes
  useEffect(() => {
    let isCancelled = false;

    const immediate = getImmediateId(currentTrack);
    if (immediate && immediate !== '4NRXx6U8ABQ') {
      if (activeYtId !== immediate) {
        setActiveYtId(immediate);
        if (isIframeReadyRef.current) {
          sendCommand('loadVideoById', [immediate, 0]);
        }
      }
      return;
    }

    // If not found in instant dictionary, resolve via server API
    setIsResolving(true);
    const cleanArt = currentTrack.artist.split(/,|&|feat\.|ft\./i)[0].trim();
    const cleanTit = currentTrack.title
      .replace(/[\(\[](feat\.|ft\.|official|video|remastered|version|audio|deluxe|explicit|remix).*?[\)\]]/gi, '')
      .trim();

    const query = `${cleanArt} ${cleanTit}`;

    fetch(`/api/resolve-youtube?q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data && data.youtubeId) {
          setActiveYtId(data.youtubeId);
          if (isIframeReadyRef.current) {
            sendCommand('loadVideoById', [data.youtubeId, 0]);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not resolve YouTube ID via server:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsResolving(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentTrack.id, currentTrack.artist, currentTrack.title, currentTrack.youtubeId, sendCommand]);

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
      sendCommand('seekTo', [seekPos, true]);
    }
  }, [seekPos, sendCommand]);

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
            if (isPlaying) {
              sendCommand('playVideo');
            }
          }
          if (data.event === 'infoDelivery' && data.info) {
            if (typeof data.info.currentTime === 'number' && data.info.currentTime >= 0) {
              onTimeUpdate(Math.floor(data.info.currentTime));
            }
            // playerState 0 = Ended
            if (data.info.playerState === 0) {
              onEnded();
            }
          }
        }
      } catch {
        // Ignore non-json postMessages from third-party extensions
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTimeUpdate, onEnded, volume, isPlaying, sendCommand]);

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
