import { useState, useEffect } from 'react';
import Navbar from './components/YTMusic/Navbar';
import Sidebar from './components/YTMusic/Sidebar';
import HomeFeed from './components/YTMusic/HomeFeed';
import SearchPage from './components/YTMusic/SearchPage';
import DownloadsPage from './components/YTMusic/DownloadsPage';
import PlayerDrawer from './components/YTMusic/PlayerDrawer';
import CollaborativeRoom from './components/CollaborativeRoom/CollaborativeRoom';
import PlaylistSync from './components/PlaylistSync/PlaylistSync';
import SocialDiscovery from './components/SocialDiscovery/SocialDiscovery';
import LibraryView from './components/Library/LibraryView';
import CreateRoomModal from './components/CreateRoomModal';
import BottomPlayer from './components/BottomPlayer';
import { ListeningRoom, Track, Playlist } from './types';
import { TRACKS, PLAYLISTS } from './data/mockData';
import { roomEngine } from './services/roomEngine';
import { audioEngine } from './services/audioEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'downloads' | 'room' | 'sync' | 'social' | 'library'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [room, setRoom] = useState<ListeningRoom>(roomEngine.getRoom());
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerDrawerOpen, setIsPlayerDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Download & Offline Storage State
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(
    new Set(['track-1', 'track-2', 'track-5'])
  );
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>(
    TRACKS.filter((t) => t.isDownloaded)
  );

  // Sync state updates from roomEngine
  useEffect(() => {
    const unsubscribe = roomEngine.subscribe((event) => {
      if (event.type === 'state_update') {
        setRoom({ ...roomEngine.getRoom() });
      } else if (event.type === 'track_change') {
        setRoom({ ...roomEngine.getRoom() });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateRoom = (updated: ListeningRoom) => {
    setRoom({ ...updated });
  };

  const handleTogglePlay = () => {
    const nextState = !room.isPlaying;
    roomEngine.togglePlay(nextState);
    if (nextState) {
      audioEngine.playTrack(room.currentTrack);
    } else {
      audioEngine.pause();
    }
  };

  const handlePlayTrack = (track: Track) => {
    const current = roomEngine.playTrackDirectly(track);
    setRoom({ ...roomEngine.getRoom() });
    audioEngine.playTrack(current);
  };

  const handleSkip = () => {
    const next = roomEngine.skipTrack();
    setRoom({ ...roomEngine.getRoom() });
    if (room.isPlaying) {
      audioEngine.playTrack(next);
    }
  };

  const handlePrev = () => {
    if (room.history.length > 0) {
      const prevTrack = room.history[0];
      handlePlayTrack(prevTrack);
    }
  };

  const handleSeek = (pos: number) => {
    roomEngine.setPosition(pos);
    audioEngine.seek(pos);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(vol === 0);
    audioEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.7);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  const handleQueueTrack = (track: Track) => {
    roomEngine.addToQueue(track, 'You');
    setRoom({ ...roomEngine.getRoom() });
  };

  // Download Audio Track handler: generates genuine WAV file and saves to offline library
  const handleDownloadTrack = async (track: Track) => {
    try {
      const audioBlob = await audioEngine.generateAudioDownload(
        track.title,
        track.artist,
        track.audioPreset,
        15
      );

      // Trigger browser file download
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.artist} - ${track.title}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Mark as downloaded in state
      setDownloadedTrackIds((prev) => new Set([...prev, track.id]));
      setDownloadedTracks((prev) => {
        if (prev.some((t) => t.id === track.id)) return prev;
        return [{ ...track, isDownloaded: true, downloadSizeMb: '8.4 MB' }, ...prev];
      });

      roomEngine.addSystemMessage(`Downloaded "${track.title}" for offline playback.`);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleRemoveDownload = (trackId: string) => {
    setDownloadedTrackIds((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
    setDownloadedTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    setActiveTab('sync');
  };

  const handleSearchSubmit = (q: string) => {
    setSearchQuery(q);
    setActiveTab('search');
  };

  return (
    <div className="min-h-screen bg-[#030303] text-neutral-100 flex flex-col font-sans selection:bg-red-500/30">
      {/* YouTube Music Styled Navbar with live Search & Room indicator */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onSelectTrack={handlePlayTrack}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        roomCode={room.code}
        downloadedCount={downloadedTracks.length}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* YouTube Music Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          playlists={PLAYLISTS}
          onSelectPlaylist={handleSelectPlaylist}
          downloadedCount={downloadedTracks.length}
        />

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto pb-28">
          {activeTab === 'home' && (
            <HomeFeed
              onPlayTrack={handlePlayTrack}
              onDownloadTrack={handleDownloadTrack}
              downloadedTrackIds={downloadedTrackIds}
              onSelectPlaylist={handleSelectPlaylist}
              onQueueTrack={handleQueueTrack}
            />
          )}

          {activeTab === 'search' && (
            <SearchPage
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onPlayTrack={handlePlayTrack}
              onDownloadTrack={handleDownloadTrack}
              downloadedTrackIds={downloadedTrackIds}
              onQueueTrack={handleQueueTrack}
            />
          )}

          {activeTab === 'downloads' && (
            <DownloadsPage
              downloadedTracks={downloadedTracks}
              onPlayTrack={handlePlayTrack}
              onRemoveDownload={handleRemoveDownload}
              onExportFile={handleDownloadTrack}
            />
          )}

          {activeTab === 'room' && (
            <CollaborativeRoom
              room={room}
              onUpdateRoom={handleUpdateRoom}
              onNavigateToSync={() => setActiveTab('sync')}
            />
          )}

          {activeTab === 'sync' && (
            <PlaylistSync
              onQueueTrack={handleQueueTrack}
              onPlayTrack={handlePlayTrack}
            />
          )}

          {activeTab === 'social' && (
            <SocialDiscovery
              onJoinRoom={() => setActiveTab('room')}
              onPlayTrack={handlePlayTrack}
              onQueueTrack={handleQueueTrack}
              onSelectPlaylist={handleSelectPlaylist}
            />
          )}

          {activeTab === 'library' && (
            <LibraryView
              onPlayTrack={handlePlayTrack}
              onSelectPlaylist={handleSelectPlaylist}
              onOpenCreateRoom={() => setIsCreateModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Persistent Bottom Player Bar */}
      <BottomPlayer
        currentTrack={room.currentTrack}
        isPlaying={room.isPlaying}
        positionSec={room.positionSec}
        volume={volume}
        isMuted={isMuted}
        roomCode={room.code}
        roomListenersCount={room.members.length}
        onTogglePlay={handleTogglePlay}
        onSkip={handleSkip}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onExpandRoom={() => setIsPlayerDrawerOpen(true)}
      />

      {/* Full YouTube Music Player Drawer (Song/Video switch, Lyrics, Up Next) */}
      <PlayerDrawer
        isOpen={isPlayerDrawerOpen}
        onClose={() => setIsPlayerDrawerOpen(false)}
        track={room.currentTrack}
        isPlaying={room.isPlaying}
        positionSec={room.positionSec}
        volume={volume}
        isMuted={isMuted}
        queue={room.queue}
        isDownloaded={downloadedTrackIds.has(room.currentTrack.id)}
        onTogglePlay={handleTogglePlay}
        onSkip={handleSkip}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onDownload={handleDownloadTrack}
        onQueueTrack={handleQueueTrack}
        onOpenRoom={() => {
          setIsPlayerDrawerOpen(false);
          setActiveTab('room');
        }}
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(newRoom) => {
          setRoom(newRoom);
          audioEngine.play(newRoom.currentTrack.audioPreset);
          setActiveTab('room');
        }}
      />
    </div>
  );
}
