'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { VolumeX } from 'lucide-react';

export type AmbientMusicHandle = {
  start: () => void;
};

export const AmbientMusic = forwardRef<AmbientMusicHandle>(function AmbientMusic(_, ref) {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const mutedRef = useRef(false);

  function releaseAudio() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
  }

  function start() {
    if (mutedRef.current || contextRef.current) return;

    try {
      const context = new AudioContext();
      const notes = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66];
      let step = 0;
      const strike = () => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = notes[step % notes.length];
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.5);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 1.6);
        step += 1;
      };

      contextRef.current = context;
      strike();
      timerRef.current = window.setInterval(strike, 1_250);
      setPlaying(true);
    } catch {
      releaseAudio();
      setPlaying(false);
    }
  }

  function mute() {
    mutedRef.current = true;
    releaseAudio();
    setPlaying(false);
  }

  useImperativeHandle(ref, () => ({ start }));
  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    void contextRef.current?.close();
    timerRef.current = null;
    contextRef.current = null;
  }, []);

  if (!playing) return null;

  return (
    <button
      className="music-mute"
      type="button"
      aria-label="ปิดเสียงเพลงคลอ"
      onClick={mute}
    >
      <VolumeX size={18} aria-hidden="true" />
    </button>
  );
});
