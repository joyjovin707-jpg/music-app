import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Music2, Check } from 'lucide-react';
import { Track } from '../../types';
import { TRACKS } from '../../data/mockData';

interface RoomQueueProps {
  queue: Track[];
  onRemoveTrack: (trackId: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onAddToQueue: (track: Track) => void;
  mode: 'collaborative' | 'host_only';
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function RoomQueue({
  queue,
  onRemoveTrack,
  onReorder,
  onAddToQueue,
  mode,
}: RoomQueueProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const availableTracks = TRACKS.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTrack = (track: Track) => {
    onAddToQueue(track);
    setRecentlyAddedId(track.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D121F] border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Music2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Collaborative DJ Queue</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">{queue.length} up next</span>
        </div>

        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className="px-2.5 py-1 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Queue Song</span>
        </button>
      </div>

      {/* Add track dropdown / panel */}
      {showAddModal && (
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog or paste Spotify/YouTube title..."
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
            {availableTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-800/60 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-7 h-7 rounded object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 truncate">
                    <p className="font-medium text-slate-200 truncate">{track.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectTrack(track)}
                  disabled={recentlyAddedId === track.id}
                  className="px-2 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 flex items-center gap-1 transition-colors"
                >
                  {recentlyAddedId === track.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue items list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[360px]">
        {queue.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Queue is empty. Click "+ Queue Song" above to add tracks!
          </div>
        ) : (
          queue.map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              className="group flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/50 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="w-4 text-center font-mono text-[11px] text-slate-500 tabular-nums">
                  {idx + 1}
                </span>

                <img
                  src={track.albumArt}
                  alt={track.title}
                  className="w-9 h-9 rounded object-cover shrink-0 border border-slate-800"
                  referrerPolicy="no-referrer"
                />

                <div className="min-w-0 truncate">
                  <p className="font-medium text-slate-200 truncate">{track.title}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                    <span>{track.artist}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{formatDuration(track.duration)}</span>
                    {track.queuedBy && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-400/90 truncate">DJ: {track.queuedBy}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {idx > 0 && (
                  <button
                    onClick={() => onReorder(idx, idx - 1)}
                    title="Move up in queue"
                    className="p-1 hover:bg-slate-700/80 rounded text-slate-400 hover:text-slate-200"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx < queue.length - 1 && (
                  <button
                    onClick={() => onReorder(idx, idx + 1)}
                    title="Move down in queue"
                    className="p-1 hover:bg-slate-700/80 rounded text-slate-400 hover:text-slate-200"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onRemoveTrack(track.id)}
                  title="Remove from queue"
                  className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400">
        <span>Session mode: {mode === 'collaborative' ? 'Open DJ (Anyone can queue)' : 'Host Curated'}</span>
        <span className="font-mono text-emerald-400">Synced</span>
      </div>
    </div>
  );
}
