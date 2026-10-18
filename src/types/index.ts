export interface SyncedLyricLine {
  timeSec: number;
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  albumArt: string;
  genre: string;
  bpm: number;
  audioPreset: 'synthwave' | 'lofi' | 'ambient' | 'indie' | 'groove';
  
  // Cross-platform & YouTube Music metadata
  spotifyId: string;
  spotifyUri: string;
  spotifyPopularity: number;
  
  youtubeId: string;
  youtubeTitle: string;
  youtubeChannel: string;
  youtubeViews: string;
  
  matchScore: number;
  matchStatus: 'exact' | 'high_confidence' | 'manual_review';
  queuedBy?: string;
  queuedByAvatar?: string;

  // YT Music additions: downloads & lyrics
  isDownloaded?: boolean;
  downloadSizeMb?: string;
  lyrics?: string[];
  syncedLyrics?: SyncedLyricLine[];
  isVideoAvailable?: boolean;
  audioUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  creator: string;
  creatorAvatar: string;
  trackCount: number;
  durationTotal: number;
  platform: 'spotify' | 'youtube' | 'synced';
  tracks: Track[];
  syncedToYouTube: boolean;
  syncedToSpotify: boolean;
  lastSyncedAt?: string;
  likesCount: number;
  category: string;
}

export interface RoomMember {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'dj' | 'listener';
  isSelf?: boolean;
  isDancing?: boolean;
  pingMs: number;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: 'host' | 'dj' | 'listener' | 'system';
  text: string;
  timestamp: string;
  type: 'message' | 'system' | 'reaction' | 'vote_skip';
  reactionEmoji?: string;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  leftPercent: number;
}

export interface ListeningRoom {
  id: string;
  name: string;
  code: string;
  description: string;
  coverArt: string;
  hostId: string;
  hostName: string;
  currentTrack: Track;
  positionSec: number;
  isPlaying: boolean;
  queue: Track[];
  history: Track[];
  members: RoomMember[];
  voteSkipCount: number;
  voteSkipRequired: number;
  mode: 'collaborative' | 'host_only';
  tags: string[];
}

export interface FriendActivity {
  id: string;
  friendName: string;
  friendAvatar: string;
  activityType: 'listening_room' | 'synced_playlist' | 'liked_track' | 'created_mix';
  trackTitle?: string;
  artist?: string;
  playlistName?: string;
  roomName?: string;
  roomCode?: string;
  timestamp: string;
  platform: 'spotify' | 'youtube' | 'opentune';
}

export interface TasteProfile {
  topGenres: { genre: string; percentage: number }[];
  platformAffinity: { spotify: number; youtube: number };
  totalHoursStreamed: number;
  playlistsSyncedCount: number;
  favoriteArtists: string[];
}
