import { useState, useEffect } from 'react';
import Navbar from './components/YTMusic/Navbar';
import Sidebar from './components/YTMusic/Sidebar';
import HomeFeed from './components/YTMusic/HomeFeed';
import SearchPage from './components/YTMusic/SearchPage';
import DownloadsPage from './components/YTMusic/DownloadsPage';
import PlayerDrawer from './components/YTMusic/PlayerDrawer';
import PlaylistDetailPage from './components/YTMusic/PlaylistDetailPage';
import CreatePlaylistModal from './components/YTMusic/CreatePlaylistModal';
import AddToPlaylistModal from './components/YTMusic/AddToPlaylistModal';
import CollaborativeRoom from './components/CollaborativeRoom/CollaborativeRoom';
import PlaylistSync from './components/PlaylistSync/PlaylistSync';
import SocialDiscovery from './components/SocialDiscovery/SocialDiscovery';
import LibraryView from './components/Library/LibraryView';
import CreateRoomModal from './components/CreateRoomModal';
import BottomPlayer from './components/BottomPlayer';
import PersistentAudioPlayer from './components/YTMusic/PersistentAudioPlayer';
import { ListeningRoom, Track, Playlist } from './types';
import { TRACKS, PLAYLISTS } from './data/mockData';
import { roomEngine } from './services/roomEngine';
import { audioEngine } from './services/audioEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'search' | 'downloads' | 'room' | 'sync' | 'social' | 'library' | 'playlist_detail'
  >('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [room, setRoom] = useState<ListeningRoom>(roomEngine.getRoom());
  const [positionSec, setPositionSec] = useState<number>(room.positionSec);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [seekRequest, setSeekRequest] = useState<number | null>(null);
  const [isPlayerDrawerOpen, setIsPlayerDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>(PLAYLISTS);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(PLAYLISTS[0]);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | null>(null);

  // Favorites / Liked Songs State
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(
    new Set(['track-4', 'track-5', 'track-7'])
  );

  // Download & Offline Storage State
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(
    new Set(['track-1', 'track-2', 'track-5'])
  );
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>(
    TRACKS.filter((t) => t.isDownloaded)
  );

  // Dynamic Liked Music Playlist
  const likedTracksList = TRACKS.filter((t) => likedTrackIds.has(t.id));
  const likedMusicPlaylist: Playlist = {
    id: 'liked-music',
    name: 'Liked Music',
    description: 'Auto-updated collection of your favorite tracks across the catalog.',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    creator: 'You',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    trackCount: likedTracksList.length,
    durationTotal: likedTracksList.reduce((acc, t) => acc + (t.duration || 210), 0),
    platform: 'synced',
    tracks: likedTracksList,
    syncedToYouTube: true,
    syncedToSpotify: true,
    lastSyncedAt: 'Just now',
    likesCount: likedTracksList.length,
    category: 'Favorites',
  };

  // Sync state updates from roomEngine
  useEffect(() => {
    const unsubscribe = roomEngine.subscribe((event) => {
      if (event.type === 'state_update') {
        setRoom({ ...roomEngine.getRoom() });
      } else if (event.type === 'track_change') {
        setRoom({ ...roomEngine.getRoom() });
        setPositionSec(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // Central continuous playback timer: advances seconds accurately whenever song is playing
  useEffect(() => {
    let timer: number | null = null;
    if (room.isPlaying) {
      timer = window.setInterval(() => {
        setPositionSec((prev) => {
          const duration = room.currentTrack?.duration || 210;
          if (prev >= duration) {
            return duration;
          }
          const next = prev + 1;
          roomEngine.setPosition(next, false);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [room.isPlaying, room.currentTrack?.id, room.currentTrack?.duration]);

  // Safe track completion transition
  useEffect(() => {
    const duration = room.currentTrack?.duration || 210;
    if (room.isPlaying && positionSec >= duration && duration > 0) {
      handleSkip();
    }
  }, [positionSec, room.isPlaying, room.currentTrack?.duration]);

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
    setPositionSec(0);
    setSeekRequest(0);
    audioEngine.playTrack(current);
  };

  const handlePlayAll = (tracks: Track[], shuffle = false) => {
    if (!tracks || tracks.length === 0) return;
    const playList = shuffle ? [...tracks].sort(() => Math.random() - 0.5) : [...tracks];
    const first = playList[0];
    const rest = playList.slice(1);

    // Set first track to play immediately
    const current = roomEngine.playTrackDirectly(first);
    // Queue remaining tracks into collaborative room queue
    rest.forEach((t) => roomEngine.addToQueue(t, 'Playlist'));
    setRoom({ ...roomEngine.getRoom() });
    setPositionSec(0);
    setSeekRequest(0);
    audioEngine.playTrack(current);
  };

  const handleSkip = () => {
    const next = roomEngine.skipTrack();
    setRoom({ ...roomEngine.getRoom() });
    setPositionSec(0);
    setSeekRequest(0);
    if (room.isPlaying) {
      audioEngine.playTrack(next);
    }
  };

  const handlePrev = () => {
    if (positionSec > 3) {
      handleSeek(0);
      return;
    }

    const prevTrack = roomEngine.previousTrack();
    if (prevTrack) {
      setRoom({ ...roomEngine.getRoom() });
      setPositionSec(0);
      setSeekRequest(0);
      audioEngine.playTrack(prevTrack);
    }
  };

  const handlePlayHistoryTrack = (track: Track) => {
    const current = roomEngine.playHistoryTrack(track);
    setRoom({ ...roomEngine.getRoom() });
    setPositionSec(0);
    setSeekRequest(0);
    audioEngine.playTrack(current);
  };

  const handleSeek = (pos: number) => {
    setPositionSec(pos);
    setSeekRequest(pos);
    roomEngine.setPosition(pos);
    audioEngine.seek(pos);
    setTimeout(() => setSeekRequest(null), 300);
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

  const handleQueueAllToRoom = (tracks: Track[]) => {
    tracks.forEach((t) => roomEngine.addToQueue(t, 'Playlist'));
    setRoom({ ...roomEngine.getRoom() });
    roomEngine.addSystemMessage(`Queued ${tracks.length} tracks to room session.`);
  };

  // Toggle Like song
  const handleToggleLike = (track: Track) => {
    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(track.id)) {
        next.delete(track.id);
        roomEngine.addSystemMessage(`Removed "${track.title}" from Liked Music.`);
      } else {
        next.add(track.id);
        roomEngine.addSystemMessage(`Saved "${track.title}" to Liked Music.`);
      }
      return next;
    });
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

  const handleDownloadAll = async (tracks: Track[]) => {
    for (const t of tracks) {
      await handleDownloadTrack(t);
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

  // Playlist Management Handlers
  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setActiveTab('playlist_detail');
  };

  const handleCreatePlaylist = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
    setSelectedPlaylist(newPlaylist);
    setActiveTab('playlist_detail');
    roomEngine.addSystemMessage(`Created new playlist "${newPlaylist.name}".`);
  };

  const handleOpenAddToPlaylist = (track: Track) => {
    setTrackForPlaylist(track);
    setIsAddToPlaylistModalOpen(true);
  };

  const handleAddTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.tracks.some((t) => t.id === track.id)) return pl;
          return {
            ...pl,
            tracks: [...pl.tracks, track],
            trackCount: pl.tracks.length + 1,
            lastSyncedAt: 'Just now',
          };
        }
        return pl;
      })
    );

    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      setSelectedPlaylist((prev) =>
        prev
          ? {
              ...prev,
              tracks: [...prev.tracks, track],
              trackCount: prev.tracks.length + 1,
            }
          : null
      );
    }
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const filtered = pl.tracks.filter((t) => t.id !== trackId);
          return {
            ...pl,
            tracks: filtered,
            trackCount: filtered.length,
          };
        }
        return pl;
      })
    );

    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      setSelectedPlaylist((prev) =>
        prev
          ? {
              ...prev,
              tracks: prev.tracks.filter((t) => t.id !== trackId),
              trackCount: prev.tracks.length - 1,
            }
          : null
      );
    }
  };

  const handleReorderTrack = (playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const reordered = [...pl.tracks];
          const [moved] = reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, moved);
          return { ...pl, tracks: reordered };
        }
        return pl;
      })
    );

    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      setSelectedPlaylist((prev) => {
        if (!prev) return null;
        const reordered = [...prev.tracks];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        return { ...prev, tracks: reordered };
      });
    }
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
          playlists={playlists}
          onSelectPlaylist={handleSelectPlaylist}
          onOpenCreatePlaylist={() => setIsCreatePlaylistModalOpen(true)}
          downloadedCount={downloadedTracks.length}
          likedCount={likedTrackIds.size}
          onSelectLikedMusic={() => handleSelectPlaylist(likedMusicPlaylist)}
        />

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto pb-28">
          {activeTab === 'home' && (
            <HomeFeed
              currentTrack={room.currentTrack}
              onPlayTrack={handlePlayTrack}
              onDownloadTrack={handleDownloadTrack}
              downloadedTrackIds={downloadedTrackIds}
              onSelectPlaylist={handleSelectPlaylist}
              onQueueTrack={handleQueueTrack}
              onOpenAddToPlaylist={handleOpenAddToPlaylist}
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
              onOpenAddToPlaylist={handleOpenAddToPlaylist}
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

          {activeTab === 'playlist_detail' && selectedPlaylist && (
            <PlaylistDetailPage
              playlist={selectedPlaylist}
              onPlayTrack={handlePlayTrack}
              onPlayAll={handlePlayAll}
              onDownloadTrack={handleDownloadTrack}
              onDownloadAll={handleDownloadAll}
              downloadedTrackIds={downloadedTrackIds}
              onQueueTrack={handleQueueTrack}
              onQueueAllToRoom={handleQueueAllToRoom}
              onNavigateToSync={() => setActiveTab('sync')}
              onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
              onReorderTrack={handleReorderTrack}
              onOpenAddToPlaylist={handleOpenAddToPlaylist}
              onNavigateToSearch={() => setActiveTab('search')}
            />
          )}

          {activeTab === 'room' && (
            <CollaborativeRoom
              room={room}
              isPlaying={room.isPlaying}
              positionSec={positionSec}
              volume={volume}
              isMuted={isMuted}
              onTogglePlay={handleTogglePlay}
              onSkip={handleSkip}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
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

      {/* Persistent Full-Song Audio Player */}
      <PersistentAudioPlayer
        currentTrack={room.currentTrack}
        isPlaying={room.isPlaying}
        volume={volume}
        isMuted={isMuted}
        seekPos={seekRequest}
        onTimeUpdate={(time) => {
          setPositionSec(time);
          roomEngine.setPosition(time, false);
        }}
        onEnded={handleSkip}
      />

      {/* Persistent Bottom Player Bar with Live Moving Timer & Quick Lyrics */}
      <BottomPlayer
        currentTrack={room.currentTrack}
        isPlaying={room.isPlaying}
        positionSec={positionSec}
        volume={volume}
        isMuted={isMuted}
        roomCode={room.code}
        roomListenersCount={room.members.length}
        isLiked={likedTrackIds.has(room.currentTrack.id)}
        onTogglePlay={handleTogglePlay}
        onSkip={handleSkip}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onExpandRoom={() => setIsPlayerDrawerOpen(true)}
        onOpenLyrics={() => setIsPlayerDrawerOpen(true)}
        onOpenQueue={() => setIsPlayerDrawerOpen(true)}
        onOpenAddToPlaylist={handleOpenAddToPlaylist}
        onToggleLike={handleToggleLike}
      />

      {/* Full YouTube Music Player Drawer (Song/Video switch, Synced Lyrics, Up Next) */}
      <PlayerDrawer
        isOpen={isPlayerDrawerOpen}
        onClose={() => setIsPlayerDrawerOpen(false)}
        track={room.currentTrack}
        isPlaying={room.isPlaying}
        positionSec={positionSec}
        volume={volume}
        isMuted={isMuted}
        queue={room.queue}
        history={room.history}
        isDownloaded={downloadedTrackIds.has(room.currentTrack.id)}
        onTogglePlay={handleTogglePlay}
        onSkip={handleSkip}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onDownload={handleDownloadTrack}
        onQueueTrack={handleQueueTrack}
        onPlayTrack={handlePlayTrack}
        onPlayHistoryTrack={handlePlayHistoryTrack}
        onOpenRoom={() => {
          setIsPlayerDrawerOpen(false);
          setActiveTab('room');
        }}
        onOpenAddToPlaylist={handleOpenAddToPlaylist}
      />

      {/* Create Custom Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistModalOpen}
        onClose={() => setIsCreatePlaylistModalOpen(false)}
        onCreatePlaylist={handleCreatePlaylist}
      />

      {/* Add Track to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistModalOpen}
        onClose={() => setIsAddToPlaylistModalOpen(false)}
        track={trackForPlaylist}
        playlists={playlists}
        onAddTrackToPlaylist={handleAddTrackToPlaylist}
        onOpenCreatePlaylist={() => setIsCreatePlaylistModalOpen(true)}
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(newRoom) => {
          setRoom(newRoom);
          audioEngine.playTrack(newRoom.currentTrack);
          setActiveTab('room');
        }}
      />
    </div>
  );
}
