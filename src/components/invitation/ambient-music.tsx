'use client';

import { useEffect, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';

export function AmbientMusic() {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
    setPlaying(false);
  }

  function play() {
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
    strike();
    timerRef.current = window.setInterval(strike, 1_250);
    contextRef.current = context;
    setPlaying(true);
  }

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    void contextRef.current?.close();
  }, []);

  return (
    <button className="music-toggle" type="button" onClick={playing ? stop : play}>
      {playing ? <VolumeX size={17} /> : <Music2 size={17} />}
      {playing ? 'ปิดเสียง' : 'เปิดเพลงคลอ'}
    </button>
  );
}
