import { ListeningRoom, ChatMessage, Track, FloatingReaction } from '../types';
import { INITIAL_ROOM, INITIAL_CHAT_MESSAGES, TRACKS } from '../data/mockData';

export type RoomEventCallback = (event: {
  type: 'state_update' | 'chat_message' | 'reaction' | 'vote_skip' | 'track_change';
  payload: unknown;
}) => void;

class RoomEngine {
  private room: ListeningRoom = { ...INITIAL_ROOM };
  private chatMessages: ChatMessage[] = [...INITIAL_CHAT_MESSAGES];
  private channel: BroadcastChannel | null = null;
  private listeners: Set<RoomEventCallback> = new Set();
  private simulatedPeerInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('opentune_collaborative_room');
        this.channel.onmessage = (event) => {
          this.handleIncomingBroadcast(event.data);
        };
      } catch {
        // Fallback if BroadcastChannel restricted
      }
    }
    this.startSimulatedPeerInteractions();
  }

  public subscribe(cb: RoomEventCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(type: 'state_update' | 'chat_message' | 'reaction' | 'vote_skip' | 'track_change', payload: unknown) {
    this.listeners.forEach((cb) => cb({ type, payload }));
  }

  private broadcast(type: string, data: unknown) {
    if (this.channel) {
      this.channel.postMessage({ type, data, timestamp: Date.now() });
    }
  }

  private handleIncomingBroadcast(msg: { type: string; data: unknown }) {
    if (msg.type === 'PLAY_STATE') {
      const { isPlaying, positionSec } = msg.data as { isPlaying: boolean; positionSec: number };
      this.room.isPlaying = isPlaying;
      this.room.positionSec = positionSec;
      this.notify('state_update', this.room);
    } else if (msg.type === 'CHAT_MESSAGE') {
      const message = msg.data as ChatMessage;
      this.chatMessages.push(message);
      this.notify('chat_message', message);
    } else if (msg.type === 'REACTION') {
      this.notify('reaction', msg.data);
    } else if (msg.type === 'VOTE_SKIP') {
      const { voteCount } = msg.data as { voteCount: number };
      this.room.voteSkipCount = voteCount;
      this.notify('vote_skip', voteCount);
    } else if (msg.type === 'QUEUE_ADD') {
      const track = msg.data as Track;
      this.room.queue.push(track);
      this.notify('state_update', this.room);
    } else if (msg.type === 'TRACK_CHANGE') {
      this.room.currentTrack = msg.data as Track;
      this.room.positionSec = 0;
      this.room.voteSkipCount = 0;
      this.notify('track_change', this.room.currentTrack);
    }
  }

  public getRoom(): ListeningRoom {
    return this.room;
  }

  public getChatMessages(): ChatMessage[] {
    return this.chatMessages;
  }

  public togglePlay(isPlaying?: boolean): boolean {
    const newState = isPlaying !== undefined ? isPlaying : !this.room.isPlaying;
    this.room.isPlaying = newState;
    this.broadcast('PLAY_STATE', { isPlaying: newState, positionSec: this.room.positionSec });
    this.notify('state_update', this.room);
    return newState;
  }

  public setPosition(pos: number) {
    this.room.positionSec = pos;
    this.broadcast('PLAY_STATE', { isPlaying: this.room.isPlaying, positionSec: pos });
    this.notify('state_update', this.room);
  }

  public sendChatMessage(text: string, senderName = 'You (Host)', role: 'host' | 'dj' | 'listener' = 'host'): ChatMessage {
    const message: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      senderId: 'user-self',
      senderName,
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      senderRole: role,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'message',
    };

    this.chatMessages.push(message);
    this.broadcast('CHAT_MESSAGE', message);
    this.notify('chat_message', message);
    return message;
  }

  public sendReaction(emoji: string, senderName = 'You'): FloatingReaction {
    const reaction: FloatingReaction = {
      id: 'react-' + Date.now() + '-' + Math.random(),
      emoji,
      senderName,
      leftPercent: 20 + Math.random() * 60,
    };

    this.broadcast('REACTION', reaction);
    this.notify('reaction', reaction);
    return reaction;
  }

  public voteSkip(): { voteCount: number; skipped: boolean } {
    this.room.voteSkipCount += 1;
    let skipped = false;

    if (this.room.voteSkipCount >= this.room.voteSkipRequired) {
      skipped = true;
      this.skipTrack();
      const sysMsg = this.addSystemMessage(`Vote to skip passed (${this.room.voteSkipRequired}/${this.room.voteSkipRequired} votes). Advancing track!`);
      this.notify('chat_message', sysMsg);
    } else {
      const sysMsg = this.addSystemMessage(`A member voted to skip (${this.room.voteSkipCount}/${this.room.voteSkipRequired} needed)`);
      this.notify('chat_message', sysMsg);
    }

    this.broadcast('VOTE_SKIP', { voteCount: this.room.voteSkipCount });
    this.notify('vote_skip', this.room.voteSkipCount);
    return { voteCount: this.room.voteSkipCount, skipped };
  }

  public playTrackDirectly(track: Track): Track {
    if (this.room.currentTrack && this.room.currentTrack.id !== track.id) {
      this.room.history.unshift(this.room.currentTrack);
    }
    this.room.currentTrack = track;
    this.room.positionSec = 0;
    this.room.voteSkipCount = 0;
    this.room.isPlaying = true;

    this.broadcast('TRACK_CHANGE', track);
    this.broadcast('PLAY_STATE', { isPlaying: true, positionSec: 0 });
    this.notify('track_change', track);
    this.notify('state_update', this.room);
    return track;
  }

  public skipTrack(): Track {
    const nextTrack = this.room.queue.shift() || TRACKS[0];
    this.room.history.unshift(this.room.currentTrack);
    this.room.currentTrack = nextTrack;
    this.room.positionSec = 0;
    this.room.voteSkipCount = 0;

    this.broadcast('TRACK_CHANGE', nextTrack);
    this.notify('track_change', nextTrack);
    this.notify('state_update', this.room);
    return nextTrack;
  }

  public addToQueue(track: Track, queuedByName = 'You'): void {
    const queuedTrack: Track = {
      ...track,
      queuedBy: queuedByName,
    };
    this.room.queue.push(queuedTrack);
    this.broadcast('QUEUE_ADD', queuedTrack);
    this.addSystemMessage(`${queuedByName} added "${track.title}" to the room queue`);
    this.notify('state_update', this.room);
  }

  public removeFromQueue(trackId: string): void {
    this.room.queue = this.room.queue.filter((t) => t.id !== trackId);
    this.notify('state_update', this.room);
  }

  public reorderQueue(startIndex: number, endIndex: number): void {
    const [removed] = this.room.queue.splice(startIndex, 1);
    this.room.queue.splice(endIndex, 0, removed);
    this.notify('state_update', this.room);
  }

  public addSystemMessage(text: string): ChatMessage {
    const msg: ChatMessage = {
      id: 'sys-' + Date.now(),
      senderId: 'sys',
      senderName: 'System',
      senderAvatar: '',
      senderRole: 'system',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'system',
    };
    this.chatMessages.push(msg);
    this.broadcast('CHAT_MESSAGE', msg);
    this.notify('chat_message', msg);
    return msg;
  }

  private startSimulatedPeerInteractions() {
    const peerNames = ['Elena R.', 'Marcus Chen', 'Sophie Vance'];
    const peerReactions = ['🔥', '🎧', '💃', '❤️', '⚡'];
    const peerRemarks = [
      'The audio sync on this room is so tight!',
      'Love the crossover between Spotify and YouTube here',
      'This drop is unbelievable 🚀',
      'Adding another track to the queue in a sec',
      'Vibes are immaculate today 🎶',
    ];

    this.simulatedPeerInterval = window.setInterval(() => {
      // 35% chance every 28 seconds of an organic peer interaction
      if (Math.random() < 0.35 && this.room.isPlaying) {
        const peer = peerNames[Math.floor(Math.random() * peerNames.length)];
        const isChat = Math.random() > 0.5;

        if (isChat) {
          const remark = peerRemarks[Math.floor(Math.random() * peerRemarks.length)];
          const peerAvatar =
            peer === 'Elena R.'
              ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
              : peer === 'Marcus Chen'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80';

          const msg: ChatMessage = {
            id: 'msg-' + Date.now(),
            senderId: 'peer-' + peer,
            senderName: peer,
            senderAvatar: peerAvatar,
            senderRole: peer === 'Elena R.' ? 'dj' : 'listener',
            text: remark,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'message',
          };
          this.chatMessages.push(msg);
          this.notify('chat_message', msg);
        } else {
          const emoji = peerReactions[Math.floor(Math.random() * peerReactions.length)];
          this.sendReaction(emoji, peer);
        }
      }
    }, 28000);
  }

  public destroy() {
    if (this.simulatedPeerInterval) {
      window.clearInterval(this.simulatedPeerInterval);
    }
    if (this.channel) {
      this.channel.close();
    }
  }
}

export const roomEngine = new RoomEngine();
