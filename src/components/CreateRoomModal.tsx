import { useState } from 'react';
import { X, Radio, Users, Lock, Unlock, Sparkles } from 'lucide-react';
import { ListeningRoom, Track } from '../types';
import { TRACKS } from '../data/mockData';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (room: ListeningRoom) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('Global Chart Listening Party');
  const [roomCode, setRoomCode] = useState(() => 'SYNC-' + Math.floor(100 + Math.random() * 900));
  const [description, setDescription] = useState('Shared real-time listening session with Spotify and YouTube sync.');
  const [mode, setMode] = useState<'collaborative' | 'host_only'>('collaborative');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACKS[1].id);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const track = TRACKS.find((t) => t.id === selectedTrackId) || TRACKS[0];

    const newRoom: ListeningRoom = {
      id: 'room-' + Date.now(),
      name: roomName.trim() || 'My Music Lounge',
      code: roomCode.trim().toUpperCase() || 'ROOM-101',
      description: description.trim(),
      coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      hostId: 'user-self',
      hostName: 'You (Host)',
      currentTrack: track,
      positionSec: 0,
      isPlaying: true,
      queue: TRACKS.filter((t) => t.id !== track.id).slice(0, 3),
      history: [],
      members: [
        {
          id: 'user-self',
          name: 'You (Host)',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          role: 'host',
          isSelf: true,
          pingMs: 12,
          joinedAt: 'Just now',
        },
        {
          id: 'user-elena',
          name: 'Elena R.',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          role: 'dj',
          isDancing: true,
          pingMs: 24,
          joinedAt: 'Just now',
        },
      ],
      voteSkipCount: 0,
      voteSkipRequired: 2,
      mode,
      tags: ['Live Room', 'Spotify & YouTube Synced', mode === 'collaborative' ? 'Open DJ' : 'Host Curated'],
    };

    onCreate(newRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#0D121F] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Host New Collaborative Room</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Room Title</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Queue Control</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'collaborative' | 'host_only')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="collaborative">Collaborative DJ (Anyone)</option>
                <option value="host_only">Host Only (Curated)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description / Vibe</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Starting Track</label>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} - {t.artist} ({t.genre})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold transition-colors shadow-md shadow-emerald-500/20"
            >
              Start Shared Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
