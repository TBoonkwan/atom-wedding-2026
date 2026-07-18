import { act, createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AmbientMusic, type AmbientMusicHandle } from './ambient-music';

function installAudioContext() {
  const close = vi.fn().mockResolvedValue(undefined);
  const oscillator = {
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  oscillator.connect.mockReturnValue(gain);
  gain.connect.mockReturnValue(gain);

  const AudioContext = vi.fn(function FakeAudioContext() {
    return {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gain),
      close,
    };
  });
  vi.stubGlobal('AudioContext', AudioContext);
  return { AudioContext, close };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AmbientMusic', () => {
  it('starts only when requested and offers a compact mute action', () => {
    const audio = installAudioContext();
    const ref = createRef<AmbientMusicHandle>();
    render(<AmbientMusic ref={ref} />);

    expect(screen.queryByRole('button', { name: 'ปิดเสียงเพลงคลอ' })).not.toBeInTheDocument();

    act(() => ref.current?.start());

    expect(audio.AudioContext).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'ปิดเสียงเพลงคลอ' })).toBeInTheDocument();
  });

  it('stops on mute and never restarts during the same mount', () => {
    const audio = installAudioContext();
    const ref = createRef<AmbientMusicHandle>();
    render(<AmbientMusic ref={ref} />);

    act(() => ref.current?.start());
    fireEvent.click(screen.getByRole('button', { name: 'ปิดเสียงเพลงคลอ' }));
    act(() => ref.current?.start());

    expect(audio.close).toHaveBeenCalledTimes(1);
    expect(audio.AudioContext).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'ปิดเสียงเพลงคลอ' })).not.toBeInTheDocument();
  });

  it('continues silently when AudioContext initialization fails', () => {
    vi.stubGlobal('AudioContext', vi.fn(() => {
      throw new Error('Audio unavailable');
    }));
    const ref = createRef<AmbientMusicHandle>();
    render(<AmbientMusic ref={ref} />);

    expect(() => act(() => ref.current?.start())).not.toThrow();
    expect(screen.queryByRole('button', { name: 'ปิดเสียงเพลงคลอ' })).not.toBeInTheDocument();
  });

  it('releases audio resources when unmounted', () => {
    const audio = installAudioContext();
    const ref = createRef<AmbientMusicHandle>();
    const view = render(<AmbientMusic ref={ref} />);

    act(() => ref.current?.start());
    view.unmount();

    expect(audio.close).toHaveBeenCalledTimes(1);
  });
});
