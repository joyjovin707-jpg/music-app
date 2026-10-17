import { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  accentColor?: string;
  barsCount?: number;
}

export default function AudioVisualizer({ isPlaying, accentColor = '#10B981', barsCount = 28 }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Fallback gentle idle wave when paused
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = 12;
        }
      }

      const barWidth = (width / barsCount) * 0.72;
      const barSpacing = (width / barsCount) * 0.28;
      let x = barSpacing / 2;

      for (let i = 0; i < barsCount; i++) {
        const binIndex = Math.floor((i / barsCount) * bufferLength);
        let barHeight = (dataArray[binIndex] / 255) * height;

        if (isPlaying) {
          barHeight = Math.max(4, barHeight);
        } else {
          barHeight = 3;
        }

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, `${accentColor}44`);
        gradient.addColorStop(0.6, accentColor);
        gradient.addColorStop(1, '#6EE7B7');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();

        x += barWidth + barSpacing;
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, accentColor, barsCount]);

  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={360}
        height={54}
        className="w-full max-w-sm h-12"
      />
    </div>
  );
}
