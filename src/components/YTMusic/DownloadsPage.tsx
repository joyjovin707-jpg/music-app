import { useState } from 'react';
import { Download, HardDrive, Trash2, Play, CheckCircle2, FileAudio, ExternalLink } from 'lucide-react';
import { Track } from '../../types';

interface DownloadsPageProps {
  downloadedTracks: Track[];
  onPlayTrack: (track: Track) => void;
  onRemoveDownload: (trackId: string) => void;
  onExportFile: (track: Track) => void;
}

export default function DownloadsPage({
  downloadedTracks,
  onPlayTrack,
  onRemoveDownload,
  onExportFile,
}: DownloadsPageProps) {
  const totalSizeMb = downloadedTracks.reduce((acc, t) => {
    const size = parseFloat(t.downloadSizeMb?.replace(' MB', '') || '7.5');
    return acc + size;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header and Storage Meter */}
      <div className="p-6 rounded-2xl bg-[#121212] border border-neutral-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Downloads &amp; Offline Storage
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Saved tracks are cached for offline playback and available for high-fidelity export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 tabular-nums">
              {downloadedTracks.length} Tracks Offline
            </span>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="space-y-1.5 pt-2 border-t border-neutral-800">
          <div className="flex justify-between text-xs text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
              <span>Used: {totalSizeMb.toFixed(1)} MB</span>
            </span>
            <span>Allocated: 2,048 MB Free</span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(3, (totalSizeMb / 500) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Downloaded Songs Table */}
      <div className="bg-[#121212] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
            Cached Songs Available Offline
          </h3>
          <span className="text-xs font-mono text-emerald-400 tabular-nums">
            FLAC / 320kbps Master
          </span>
        </div>

        {downloadedTracks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Download className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-neutral-300">No tracks downloaded yet</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Click the download button on any track in Quick Picks or Search to save it for offline listening.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/70">
            {downloadedTracks.map((track, i) => (
              <div
                key={track.id}
                className="p-3.5 hover:bg-neutral-800/40 transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-5 text-center font-mono text-neutral-500 tabular-nums">
                    {i + 1}
                  </span>

                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-11 h-11 rounded-lg object-cover shrink-0 border border-neutral-800 shadow-md"
                    referrerPolicy="no-referrer"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate">{track.title}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Offline
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {track.artist} · {track.album}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-neutral-400 tabular-nums hidden sm:inline">
                    {track.downloadSizeMb || '8.2 MB'}
                  </span>

                  <span className="font-mono text-neutral-400 tabular-nums hidden md:inline">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </span>

                  <button
                    onClick={() => onPlayTrack(track)}
                    title="Play track offline"
                    className="p-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>

                  <button
                    onClick={() => onExportFile(track)}
                    title="Export audio file (.wav) to computer"
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition-colors"
                  >
                    <FileAudio className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Export .wav</span>
                  </button>

                  <button
                    onClick={() => onRemoveDownload(track.id)}
                    title="Remove from offline downloads"
                    className="p-2 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
