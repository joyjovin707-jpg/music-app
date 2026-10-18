import { useState } from 'react';
import { X, FolderPlus, Sparkles } from 'lucide-react';
import { Playlist } from '../../types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (playlist: Playlist) => void;
}

const COVER_PRESETS = [
  '/src/assets/images/album_synthwave_night_1792258628594.jpg',
  '/src/assets/images/album_lofi_aesthetic_1792258629142.jpg',
  '/src/assets/images/album_indie_dreamscape_1792258630310.jpg',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
];

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onCreatePlaylist,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal Mix');
  const [selectedCover, setSelectedCover] = useState(COVER_PRESETS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlaylist: Playlist = {
      id: 'pl-' + Date.now(),
      name: name.trim(),
      description: description.trim() || 'Created with OpenTune & LastWave engine',
      coverImage: selectedCover,
      creator: 'You',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      trackCount: 0,
      durationTotal: 0,
      platform: 'synced',
      tracks: [],
      syncedToYouTube: true,
      syncedToSpotify: true,
      lastSyncedAt: 'Just now',
      likesCount: 1,
      category,
    };

    onCreatePlaylist(newPlaylist);
    onClose();
    setName('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-neutral-100">
      <div className="w-full max-w-md bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">Create New Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Playlist Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Late Night Synthwave, Tokyo Beats..."
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give your playlist a vibe or mood..."
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Category / Genre</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-red-500"
            >
              <option value="Personal Mix">Personal Mix</option>
              <option value="Electronic & Synth">Electronic &amp; Synth</option>
              <option value="Lo-Fi & Chillhop">Lo-Fi &amp; Chillhop</option>
              <option value="Pop & Chart Hits">Pop &amp; Chart Hits</option>
              <option value="Indie & Alternative">Indie &amp; Alternative</option>
              <option value="City Pop & Funk">City Pop &amp; Funk</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-2">Choose Cover Art</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {COVER_PRESETS.map((cover, i) => (
                <img
                  key={i}
                  src={cover}
                  alt={`Preset ${i}`}
                  onClick={() => setSelectedCover(cover)}
                  className={`w-14 h-14 rounded-xl object-cover cursor-pointer border-2 transition-all shrink-0 ${
                    selectedCover === cover ? 'border-red-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-red-600/30"
            >
              Create Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
