/**
 * Real-time Web Audio Synthesizer, Analyser, and Offline Audio File Generator
 * Enables genuine sound playback, real-time frequency visualizer, and actual .WAV audio file downloads.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;
  private currentVolume = 0.8;
  private timerId: number | null = null;
  private noteStep = 0;
  private activeOscillators: OscillatorNode[] = [];
  private currentPreset: 'synthwave' | 'lofi' | 'ambient' | 'indie' | 'groove' = 'synthwave';
  private audioElement: HTMLAudioElement | null = null;
  private currentTrackAudioUrl: string | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTrack(track: { audioUrl?: string; audioPreset?: 'synthwave' | 'lofi' | 'ambient' | 'indie' | 'groove' }) {
    this.initContext();
    this.isPlaying = true;

    if (track.audioUrl) {
      this.stopPattern();
      if (!this.audioElement || this.currentTrackAudioUrl !== track.audioUrl) {
        if (this.audioElement) {
          this.audioElement.pause();
          this.audioElement = null;
        }
        this.currentTrackAudioUrl = track.audioUrl;
        this.audioElement = new Audio(track.audioUrl);
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.volume = this.currentVolume;
      }
      this.audioElement.play().catch(() => {
        // If external audio blocked or fails, seamlessly fall back to synthesizer
        this.play(track.audioPreset || 'synthwave');
      });
    } else {
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.play(track.audioPreset || 'synthwave');
    }
  }

  public play(preset: 'synthwave' | 'lofi' | 'ambient' | 'indie' | 'groove' = 'synthwave') {
    this.initContext();
    this.currentPreset = preset;
    this.isPlaying = true;
    this.stopPattern();
    this.startPattern();
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopPattern();
  }

  public seek(positionSec: number) {
    if (this.audioElement) {
      try {
        this.audioElement.currentTime = positionSec;
      } catch {
        // ignore
      }
    }
  }

  public setVolume(val: number) {
    this.currentVolume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.currentVolume;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private stopPattern() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore already stopped
      }
    });
    this.activeOscillators = [];
  }

  private startPattern() {
    if (!this.ctx || !this.masterGain) return;

    const scales = {
      synthwave: [130.81, 164.81, 196.00, 246.94, 261.63, 329.63, 392.00],
      lofi: [146.83, 174.61, 220.00, 261.63, 329.63, 349.23],
      ambient: [110.00, 164.81, 220.00, 277.18, 329.63, 440.00],
      indie: [130.81, 164.81, 196.00, 220.00, 261.63, 329.63],
      groove: [116.54, 146.83, 174.61, 207.65, 233.08, 293.66],
    };

    const notes = scales[this.currentPreset] || scales.synthwave;
    const intervalMs = this.currentPreset === 'ambient' ? 1200 : this.currentPreset === 'lofi' ? 700 : 450;

    this.triggerWarmPad(notes[0], notes[2]);

    this.timerId = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      this.noteStep = (this.noteStep + 1) % notes.length;
      const freq = notes[this.noteStep];

      this.triggerTone(freq, 0.45, this.currentPreset === 'synthwave' ? 'sawtooth' : 'sine');

      if (this.noteStep % 2 === 0 && this.currentPreset !== 'ambient') {
        this.triggerSubBass(notes[0] * 0.5);
      }
    }, intervalMs);
  }

  private triggerWarmPad(rootFreq: number, thirdFreq: number) {
    if (!this.ctx || !this.masterGain) return;

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(rootFreq, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(thirdFreq, this.ctx.currentTime);

    osc1.connect(padGain);
    osc2.connect(padGain);
    padGain.connect(filter);
    filter.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.activeOscillators.push(osc1, osc2);
  }

  private triggerTone(freq: number, durationSec: number, type: OscillatorType) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.currentPreset === 'synthwave' ? 1400 : 900, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  }

  private triggerSubBass(freq: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.25);

    const now = this.ctx.currentTime;
    env.gain.setValueAtTime(0.18, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Generates a real playable WAV audio file using OfflineAudioContext.
   * Allows users to download genuine audio tracks onto their device!
   */
  public async generateAudioDownload(
    title: string,
    artist: string,
    preset: 'synthwave' | 'lofi' | 'ambient' | 'indie' | 'groove' = 'synthwave',
    durationSec = 15
  ): Promise<Blob> {
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

    const scales = {
      synthwave: [130.81, 164.81, 196.00, 261.63, 329.63],
      lofi: [146.83, 174.61, 220.00, 261.63, 329.63],
      ambient: [110.00, 164.81, 220.00, 329.63, 440.00],
      indie: [130.81, 164.81, 196.00, 261.63],
      groove: [116.54, 146.83, 174.61, 233.08],
    };

    const notes = scales[preset] || scales.synthwave;
    const master = offlineCtx.createGain();
    master.gain.setValueAtTime(0.65, 0);
    master.connect(offlineCtx.destination);

    // Warm chord pad in background
    const padOsc = offlineCtx.createOscillator();
    const padGain = offlineCtx.createGain();
    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(notes[0], 0);
    padGain.gain.setValueAtTime(0.2, 0);
    padOsc.connect(padGain);
    padGain.connect(master);
    padOsc.start(0);
    padOsc.stop(durationSec);

    // Sequence arpeggios
    const stepDuration = 0.5;
    const steps = Math.floor(durationSec / stepDuration);

    for (let i = 0; i < steps; i++) {
      const time = i * stepDuration;
      const freq = notes[i % notes.length];

      const noteOsc = offlineCtx.createOscillator();
      const noteGain = offlineCtx.createGain();
      noteOsc.type = preset === 'synthwave' ? 'sawtooth' : 'triangle';
      noteOsc.frequency.setValueAtTime(freq, time);

      noteGain.gain.setValueAtTime(0.001, time);
      noteGain.gain.exponentialRampToValueAtTime(0.3, time + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.9);

      noteOsc.connect(noteGain);
      noteGain.connect(master);

      noteOsc.start(time);
      noteOsc.stop(time + stepDuration);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // FMT sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // subchunk1size (16 for PCM)
    setUint16(1); // audio format (1 = PCM)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample

    // data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }
}

export const audioEngine = new AudioEngine();
