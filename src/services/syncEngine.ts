import { Track, Playlist } from '../types';
import { TRACKS } from '../data/mockData';

export interface SyncStep {
  step: number;
  totalSteps: number;
  message: string;
  progressPercent: number;
  currentTrackTitle?: string;
}

export class SyncEngine {
  /**
   * Calculates similarity between two strings (0 to 1)
   */
  public static calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const s2 = str2.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

    if (s1 === s2) return 1.0;
    if (!s1.length || !s2.length) return 0.0;

    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    const intersection = [...words1].filter((w) => words2.has(w));
    const union = new Set([...words1, ...words2]);

    return Math.round((intersection.length / union.size) * 100) / 100;
  }

  /**
   * Matches a track between Spotify and YouTube
   */
  public static matchTrack(track: Partial<Track>): Track {
    const existing = TRACKS.find(
      (t) =>
        t.title.toLowerCase() === track.title?.toLowerCase() ||
        t.spotifyId === track.spotifyId ||
        t.youtubeId === track.youtubeId
    );

    if (existing) {
      return { ...existing };
    }

    // Dynamic mock resolver for any custom input
    const title = track.title || 'Untitled Track';
    const artist = track.artist || 'Unknown Artist';
    const duration = track.duration || 210;

    const mockYouTubeId = 'yt_' + Math.random().toString(36).substring(2, 9);
    const mockSpotifyId = 'sp_' + Math.random().toString(36).substring(2, 9);

    return {
      id: 'track-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title,
      artist,
      album: track.album || 'Single Release',
      duration,
      albumArt: track.albumArt || '/src/assets/images/album_synthwave_night_1792258628594.jpg',
      genre: track.genre || 'Electronic',
      bpm: track.bpm || 120,
      audioPreset: 'synthwave',
      spotifyId: mockSpotifyId,
      spotifyUri: `spotify:track:${mockSpotifyId}`,
      spotifyPopularity: 85,
      youtubeId: mockYouTubeId,
      youtubeTitle: `${artist} - ${title} (Official Audio)`,
      youtubeChannel: `${artist} Official`,
      youtubeViews: '1.2M views',
      matchScore: 96,
      matchStatus: 'exact',
    };
  }

  /**
   * Runs simulated asynchronous 2-way sync process with live progress reporting
   */
  public static async runSyncSession(
    playlist: Playlist,
    targetPlatform: 'youtube' | 'spotify',
    onProgress: (step: SyncStep) => void
  ): Promise<Playlist> {
    const steps = [
      { msg: `Reading source tracks from ${playlist.platform === 'spotify' ? 'Spotify Web API' : 'YouTube Music'}...`, pct: 15 },
      { msg: 'Resolving ISRC codes and cross-referencing acoustic fingerprints...', pct: 35 },
      { msg: `Matching track metadata against ${targetPlatform === 'youtube' ? 'YouTube Music Content ID' : 'Spotify Catalog'}...`, pct: 60 },
      { msg: 'Normalizing audio duration and filtering studio vs live versions...', pct: 85 },
      { msg: `Finalizing playlist sync & building destination collection on ${targetPlatform}...`, pct: 100 },
    ];

    for (let i = 0; i < steps.length; i++) {
      onProgress({
        step: i + 1,
        totalSteps: steps.length,
        message: steps[i].msg,
        progressPercent: steps[i].pct,
        currentTrackTitle: playlist.tracks[i % playlist.tracks.length]?.title,
      });
      // Short delay for realistic feel
      await new Promise((r) => setTimeout(r, 600));
    }

    const updatedTracks = playlist.tracks.map((t) => ({
      ...t,
      matchScore: Math.max(92, t.matchScore),
      matchStatus: 'exact' as const,
    }));

    return {
      ...playlist,
      tracks: updatedTracks,
      syncedToYouTube: targetPlatform === 'youtube' ? true : playlist.syncedToYouTube,
      syncedToSpotify: targetPlatform === 'spotify' ? true : playlist.syncedToSpotify,
      platform: 'synced',
      lastSyncedAt: 'Just now',
    };
  }

  /**
   * Download playlist as .M3U file
   */
  public static exportToM3U(playlist: Playlist): void {
    let content = '#EXTM3U\n';
    content += `#PLAYLIST:${playlist.name}\n`;
    content += `#DESCRIPTION:${playlist.description}\n\n`;

    playlist.tracks.forEach((track) => {
      content += `#EXTINF:${track.duration},${track.artist} - ${track.title}\n`;
      content += `https://www.youtube.com/watch?v=${track.youtubeId}\n`;
      content += `#SPOTIFY_URI:${track.spotifyUri}\n\n`;
    });

    const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download playlist as JSON
   */
  public static exportToJSON(playlist: Playlist): void {
    const exportData = {
      app: 'OpenTune Sync',
      exportedAt: new Date().toISOString(),
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        trackCount: playlist.tracks.length,
        tracks: playlist.tracks.map((t) => ({
          title: t.title,
          artist: t.artist,
          album: t.album,
          durationSec: t.duration,
          spotify: {
            id: t.spotifyId,
            uri: t.spotifyUri,
          },
          youtube: {
            id: t.youtubeId,
            title: t.youtubeTitle,
            channel: t.youtubeChannel,
          },
          matchScore: t.matchScore,
        })),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_sync.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
