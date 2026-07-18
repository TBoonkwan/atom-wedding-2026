# Invitation Interaction Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Modern invitation's horizontal timeline with a vertical stepper, remove its persistent shortcut bar, start ambient music from Enter with a compact mute action, and show the envelope on every page load.

**Architecture:** Keep the existing client-side invitation experience and separate responsibilities at the current component boundaries. `InvitationExperience` coordinates the Enter action through an imperative `AmbientMusicHandle`, `AmbientMusic` owns all Web Audio resources and mute state, and `EnvelopeGate` owns only in-memory open state. Modern-only markup hooks and CSS create the vertical stepper without changing legacy-theme presentation.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Motion 12, Vitest 4, Testing Library, global CSS.

## Global Constraints

- Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`, and `node_modules/next/dist/docs/03-architecture/accessibility.md` before editing.
- Do not add dependencies or new routes.
- Every fresh page load follows Landing → Envelope → Details.
- Pressing `Enter to our wedding` is the only action that attempts to start audio.
- Audio failure must leave the invitation usable and silent.
- The mute action must have an accessible Thai label and a touch target of at least 44 by 44 CSS pixels.
- Do not persist envelope, mute, volume, or audio state.
- Keep legacy-theme timeline presentation unchanged.
- Respect the existing `prefers-reduced-motion` behavior.

## File Map

- Modify `src/components/invitation/envelope.tsx`: remove storage/default-open behavior and retain only mount-local open state.
- Modify `src/components/invitation/envelope.test.tsx`: specify that stored envelope keys are ignored and opening performs no storage writes.
- Modify `src/components/invitation/ambient-music.tsx`: expose `AmbientMusicHandle.start()`, own audio cleanup, and render only a compact mute action while playing.
- Create `src/components/invitation/ambient-music.test.tsx`: cover explicit start, mute, no restart, cleanup, and initialization failure.
- Modify `src/components/invitation/invitation-experience.tsx`: mount music before the landing transition, start it synchronously from Enter, simplify `EnvelopeGate`, remove quick navigation, and add the Modern stepper class.
- Modify `src/components/invitation/invitation-experience.test.tsx`: cover the new entry flow, audio trigger, missing navigation, stepper markup, focus, and non-persistence.
- Modify `src/app/globals.css`: replace the music pill and Modern horizontal timeline rules with compact mute and vertical-stepper styles; delete quick-navigation styles.

---

### Task 1: Make the envelope mount-local on every visit

**Files:**
- Modify: `src/components/invitation/envelope.tsx`
- Test: `src/components/invitation/envelope.test.tsx`
- Modify: `src/components/invitation/invitation-experience.tsx`
- Test: `src/components/invitation/invitation-experience.test.tsx`

**Interfaces:**
- Consumes: `children: ReactNode`, optional `onOpen?: () => void`.
- Produces: `EnvelopeGate({ children, onOpen })` with no storage-related props or browser storage access.

- [ ] **Step 1: Replace storage expectations with failing tests**

Replace the second and third tests in `src/components/invitation/envelope.test.tsx` so the file contains these three behaviors:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EnvelopeGate } from './envelope';

describe('EnvelopeGate', () => {
  it('reveals the invitation after the guest opens the envelope', () => {
    render(
      <EnvelopeGate>
        <p>รายละเอียดงานแต่ง</p>
      </EnvelopeGate>,
    );

    expect(screen.queryByText('รายละเอียดงานแต่ง')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
    expect(screen.getByText('รายละเอียดงานแต่ง')).toBeInTheDocument();
  });

  it('shows the envelope even when a legacy opened key exists', () => {
    window.localStorage.setItem('returning-envelope', 'opened');

    render(
      <EnvelopeGate>
        <p>ยินดีต้อนรับกลับ</p>
      </EnvelopeGate>,
    );

    expect(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' })).toBeInTheDocument();
    expect(screen.queryByText('ยินดีต้อนรับกลับ')).not.toBeInTheDocument();
  });

  it('does not write browser storage when the envelope opens', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <EnvelopeGate>
        <p>รายละเอียดงานแต่ง</p>
      </EnvelopeGate>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
    expect(setItem).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the envelope tests and verify the prop/API mismatch fails**

Run: `npm test -- src/components/invitation/envelope.test.tsx`

Expected: FAIL because the existing `EnvelopeGate` requires `storageKey` and still skips/writes based on local storage.

- [ ] **Step 3: Remove envelope persistence with the minimal implementation**

Replace `src/components/invitation/envelope.tsx` with:

```tsx
'use client';

import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function EnvelopeGate({
  children,
  onOpen,
}: {
  children: ReactNode;
  onOpen?: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const reduceMotion = useReducedMotion();

  function openEnvelope() {
    onOpen?.();
    setOpened(true);
  }

  if (opened) {
    return (
      <motion.div
        initial={{ opacity: reduceMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <main className="envelope-stage">
      <div className="floating-cloud cloud-one" aria-hidden="true" />
      <div className="floating-cloud cloud-two" aria-hidden="true" />
      <motion.button
        id="invitation-envelope-button"
        className="envelope-button"
        type="button"
        aria-label="เปิดซองคำเชิญ"
        onClick={openEnvelope}
        whileHover={reduceMotion ? undefined : { y: -6, rotate: -0.5 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      >
        <span className="envelope-flap" aria-hidden="true" />
        <span className="envelope-copy">คำเชิญสำหรับคุณ</span>
        <span className="wax-seal" aria-hidden="true">NP</span>
        <span className="tap-note">แตะเพื่อเปิดซอง</span>
      </motion.button>
    </main>
  );
}
```

- [ ] **Step 4: Run the envelope tests**

Run: `npm test -- src/components/invitation/envelope.test.tsx`

Expected: PASS, 3 tests.

- [ ] **Step 5: Add failing experience tests for the every-visit envelope flow**

Add this helper below `holdAnimationFrame()` in `src/components/invitation/invitation-experience.test.tsx`:

```tsx
function openModernInvitation() {
  fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
  fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
}
```

In `renders only the four selected portraits in the detail gallery`, the parameterized calendar-status test, and `offers calendar actions after the guest accepts`, remove each `window.localStorage.setItem('np-wedding-envelope-modern-xi-club', 'opened')` setup line. Replace each Enter-only action with:

```tsx
openModernInvitation();
```

In `keeps the legacy single-image gallery`, remove `window.localStorage.setItem(...)` and add this action immediately after `render(...)`:

```tsx
fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
```

In `src/components/invitation/invitation-experience.test.tsx`, replace `shows the landing before routing first-time and returning Modern guests to their entry state` with:

```tsx
it('shows the landing and envelope on every Modern visit before details', () => {
  window.localStorage.setItem('np-wedding-envelope-modern-xi-club', 'opened');
  const entryFrame = holdAnimationFrame();
  render(
    <InvitationExperience
      theme="modern-xi-club"
      token="returning-demo"
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
      preview
    />,
  );

  expect(screen.getByRole('button', { name: 'Enter to our wedding' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
  expect(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' })).toBeInTheDocument();
  entryFrame.flush();
  expect(document.activeElement).toBe(document.getElementById('invitation-envelope-button'));

  fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
  entryFrame.flush();
  expect(document.activeElement).toBe(document.getElementById('invitation-detail-heading'));
  entryFrame.restore();
});
```

Delete `keeps the production Modern entry flow usable when storage is unavailable`, because envelope access no longer depends on storage. Replace `persists production envelope state with the invite code and never the bearer token` with:

```tsx
it('stores the invite code but never persists envelope state or the bearer token', () => {
  const bearerToken = 'raw-secret-invitation-token';
  const setItem = vi.spyOn(Storage.prototype, 'setItem');

  render(
    <InvitationExperience
      theme="modern-xi-club"
      token={bearerToken}
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
  fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

  expect(setItem).toHaveBeenCalledWith('np-wedding-invite-code', DEMO_PUBLIC_INVITATION.inviteCode);
  const storageKeys = setItem.mock.calls.map(([key]) => String(key));
  expect(storageKeys.some((key) => key.startsWith('np-wedding-envelope-'))).toBe(false);
  expect(storageKeys.every((key) => !key.includes(bearerToken))).toBe(true);
});
```

- [ ] **Step 6: Run the focused experience tests and verify the old gate call fails**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: FAIL because `InvitationExperience` still passes storage props and lets old keys/default state skip the envelope.

- [ ] **Step 7: Simplify the experience's envelope gate call**

In `src/components/invitation/invitation-experience.tsx`, replace the gate opening tag with:

```tsx
<EnvelopeGate
  onOpen={() => {
    setContentMounted(true);
    focusInvitationEntryTarget();
  }}
>
```

This deletes `storageKey` and `defaultOpen` from the call while leaving the existing children and closing tag unchanged.

- [ ] **Step 8: Run envelope and experience tests**

Run: `npm test -- src/components/invitation/envelope.test.tsx src/components/invitation/invitation-experience.test.tsx`

Expected: PASS for both files.

- [ ] **Step 9: Commit the mount-local envelope behavior**

```bash
git add src/components/invitation/envelope.tsx src/components/invitation/envelope.test.tsx src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx
git commit -m "feat: show invitation envelope on every visit"
```

---

### Task 2: Start ambient music from Enter and provide one-way mute

**Files:**
- Modify: `src/components/invitation/ambient-music.tsx`
- Create: `src/components/invitation/ambient-music.test.tsx`
- Modify: `src/components/invitation/invitation-experience.tsx`
- Test: `src/components/invitation/invitation-experience.test.tsx`

**Interfaces:**
- Consumes: a React ref owned by `InvitationExperience`.
- Produces: `export type AmbientMusicHandle = { start: () => void }` and a `forwardRef` component whose `start()` is safe to call repeatedly.

- [ ] **Step 1: Add failing unit tests for explicit start, mute, and failure**

Create `src/components/invitation/ambient-music.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the new unit test and verify it fails**

Run: `npm test -- src/components/invitation/ambient-music.test.tsx`

Expected: FAIL because `AmbientMusicHandle` and the ref-driven `start()` API do not exist.

- [ ] **Step 3: Implement ref-driven playback and one-way mute**

Replace `src/components/invitation/ambient-music.tsx` with:

```tsx
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
```

- [ ] **Step 4: Run the music unit tests**

Run: `npm test -- src/components/invitation/ambient-music.test.tsx`

Expected: PASS, 4 tests.

- [ ] **Step 5: Add a failing integration test for Enter-triggered music**

In `src/components/invitation/invitation-experience.test.tsx`, add:

```tsx
it('starts ambient music when Enter is pressed and still shows the envelope', () => {
  const close = vi.fn().mockResolvedValue(undefined);
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
  };
  const oscillator = {
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(() => gain),
    start: vi.fn(),
    stop: vi.fn(),
  };
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

  render(
    <InvitationExperience
      theme="modern-xi-club"
      token="music-entry-demo"
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
      preview
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));

  expect(AudioContext).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'ปิดเสียงเพลงคลอ' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' })).toBeInTheDocument();
});
```

Also extend the file's existing `afterEach` to restore stubbed globals:

```tsx
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
```

- [ ] **Step 6: Run the integration test and verify it fails**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx -t "starts ambient music"`

Expected: FAIL because Enter does not call the music component and the mute button is not mounted during the envelope stage.

- [ ] **Step 7: Wire the already-mounted music component to Enter**

In `src/components/invitation/invitation-experience.tsx`, change the import and add the ref:

```tsx
import { AmbientMusic, type AmbientMusicHandle } from './ambient-music';

// Inside InvitationExperience, beside focusFrame:
const musicRef = useRef<AmbientMusicHandle>(null);
```

Mount music directly under the root so it exists before Enter:

```tsx
return (
  <div className="invitation-theme" data-theme={theme}>
    <AmbientMusic ref={musicRef} />
    {preview ? <div className="preview-ribbon">CLICKABLE DRAFT · {theme.replaceAll('-', ' ')}</div> : null}
    {/* existing invitation-entry-stack */}
  </div>
);
```

Start it synchronously in the landing button callback:

```tsx
onEnter={() => {
  musicRef.current?.start();
  setEntered(true);
  focusInvitationEntryTarget();
}}
```

Delete the old `<AmbientMusic />` from inside `EnvelopeGate`.

- [ ] **Step 8: Run the focused music and experience tests**

Run: `npm test -- src/components/invitation/ambient-music.test.tsx src/components/invitation/invitation-experience.test.tsx`

Expected: PASS for both files.

- [ ] **Step 9: Commit the Enter-triggered music behavior**

```bash
git add src/components/invitation/ambient-music.tsx src/components/invitation/ambient-music.test.tsx src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx
git commit -m "feat: start invitation music on entry"
```

---

### Task 3: Remove quick navigation and create the Modern vertical stepper

**Files:**
- Modify: `src/components/invitation/invitation-experience.tsx`
- Test: `src/components/invitation/invitation-experience.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing `TIMELINE` data in chronological order.
- Produces: Modern-only `.timeline-stepper` markup hook and no quick-navigation landmark.

- [ ] **Step 1: Replace the obsolete navigation test and add stepper coverage**

Replace `shows compact section shortcuts after the envelope opens` with:

```tsx
it('removes the persistent section shortcuts from the Modern details', () => {
  render(
    <InvitationExperience
      theme="modern-xi-club"
      token="no-shortcuts-demo"
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
      preview
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
  fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

  expect(screen.queryByRole('navigation', { name: 'ทางลัด' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'เลื่อนดูรายละเอียด ↓' })).toHaveAttribute('href', '#schedule');
});
```

Add a focused stepper test:

```tsx
it('renders the Modern timeline as a chronological vertical stepper', () => {
  render(
    <InvitationExperience
      theme="modern-xi-club"
      token="stepper-demo"
      initialInvitation={DEMO_PUBLIC_INVITATION}
      calendarLinks={{ google: '#google', ics: '#ics' }}
      preview
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Enter to our wedding' }));
  fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));

  const timeline = screen.getByRole('heading', { name: 'กำหนดการ' })
    .closest('section')?.querySelector('.timeline-list');
  expect(timeline).toHaveClass('timeline-stepper');
  expect(Array.from(timeline?.querySelectorAll('time') ?? []).map((time) => time.textContent))
    .toEqual(['15:00', '15:40', '17:00', '18:00–20:00', '20:00–22:00']);
});
```

Add legacy-theme protection:

```tsx
it.each(['blush-shanghai', 'tea-to-toast'] as const)(
  'keeps the %s timeline out of the Modern stepper treatment',
  (theme) => {
    render(
      <InvitationExperience
        theme={theme}
        token={`legacy-timeline-${theme}`}
        initialInvitation={DEMO_PUBLIC_INVITATION}
        calendarLinks={{ google: '#google', ics: '#ics' }}
        preview
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'เปิดซองคำเชิญ' }));
    const timeline = screen.getByRole('heading', { name: 'กำหนดการ' })
      .closest('section')?.querySelector('.timeline-list');
    expect(timeline).not.toHaveClass('timeline-stepper');
  },
);
```

- [ ] **Step 2: Run the focused experience tests and verify failures**

Run: `npm test -- src/components/invitation/invitation-experience.test.tsx`

Expected: FAIL because quick navigation is still present and `.timeline-stepper` is missing.

- [ ] **Step 3: Remove quick navigation and add the stepper hook**

Delete the complete conditional `<nav className="quick-nav" ...>` block.

Change the timeline list opening tag to:

```tsx
<div className={`timeline-list${isModernTheme ? ' timeline-stepper' : ''}`}>
```

Keep the existing `TIMELINE.map(...)` contents unchanged so event order and copy remain sourced from the domain constant.

- [ ] **Step 4: Replace obsolete CSS with compact mute and vertical-stepper styles**

In `src/app/globals.css`:

1. Delete `.music-toggle`, all three `.quick-nav` rules, the mobile `.quick-nav` rule, and every Modern horizontal timeline rule using `display: flex`, `overflow-x`, `flex-basis`, or hidden scrollbars.
2. Remove the early `[data-theme="modern-xi-club"] .timeline-item { grid-template-columns: 50px 90px 1fr; }` rule.
3. Add the following rules after the envelope styles:

```css
.music-mute {
  position: fixed;
  z-index: 25;
  top: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent);
  border-radius: 50%;
  color: var(--ink);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  box-shadow: 0 10px 28px #160a0828;
  backdrop-filter: blur(12px);
  cursor: pointer;
}
.music-mute:hover { background: var(--surface); }
.music-mute:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
```

4. Add these Modern timeline rules where the old horizontal rules were:

```css
[data-theme="modern-xi-club"] .timeline-stepper {
  --stepper-marker-x: 99px;
  position: relative;
  display: grid;
  gap: 0;
  overflow: visible;
  padding: 0;
  border: 0;
}
[data-theme="modern-xi-club"] .timeline-stepper::before {
  content: "";
  position: absolute;
  z-index: 0;
  top: 33px;
  bottom: 33px;
  left: var(--stepper-marker-x);
  width: 1px;
  background: linear-gradient(var(--accent), color-mix(in srgb, var(--accent) 30%, transparent));
}
[data-theme="modern-xi-club"] .timeline-stepper .timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 50px 72px 1fr;
  align-items: center;
  gap: 22px;
  min-height: 118px;
  padding: 12px 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}
[data-theme="modern-xi-club"] .timeline-stepper .timeline-symbol {
  z-index: 1;
  width: 54px;
  height: 54px;
  border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent);
  background: var(--surface);
  box-shadow: 0 8px 24px #160a0828;
}
[data-theme="modern-xi-club"] .timeline-stepper .timeline-index { align-self: center; }
[data-theme="modern-xi-club"] .timeline-stepper .timeline-item h3 { font-size: 20px; }
```

5. Inside `@media (max-width: 540px)`, replace the old music/timeline Modern overrides with:

```css
.music-mute { top: 12px; right: 12px; }
[data-theme="modern-xi-club"] .timeline-stepper { --stepper-marker-x: 64px; }
[data-theme="modern-xi-club"] .timeline-stepper .timeline-item {
  grid-template-columns: 30px 50px 1fr;
  gap: 12px;
  min-height: 104px;
}
[data-theme="modern-xi-club"] .timeline-stepper .timeline-symbol {
  width: 44px;
  height: 44px;
}
[data-theme="modern-xi-club"] .timeline-stepper .timeline-item h3 { font-size: 18px; }
```

- [ ] **Step 5: Run component tests and lint the changed files**

Run: `npm test -- src/components/invitation/envelope.test.tsx src/components/invitation/ambient-music.test.tsx src/components/invitation/invitation-experience.test.tsx`

Expected: PASS for all focused tests.

Run: `npx eslint src/components/invitation/envelope.tsx src/components/invitation/envelope.test.tsx src/components/invitation/ambient-music.tsx src/components/invitation/ambient-music.test.tsx src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx`

Expected: exit code 0 with no lint errors.

- [ ] **Step 6: Commit the navigation and stepper refinement**

```bash
git add src/components/invitation/invitation-experience.tsx src/components/invitation/invitation-experience.test.tsx src/app/globals.css
git commit -m "feat: refine invitation timeline navigation"
```

---

### Task 4: Full regression and responsive visual verification

**Files:**
- Verify only; modify the Task 1–3 files only if a verification failure reveals a scoped defect.

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: verified production-ready invitation interaction refinement.

- [ ] **Step 1: Run the complete unit and component suite**

Run: `npm test`

Expected: all Vitest files and tests PASS with exit code 0.

- [ ] **Step 2: Run the complete lint suite**

Run: `npm run lint`

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Build the production application**

Run: `npm run build`

Expected: Next.js 16.2.10 completes compilation, type checking, and route generation with exit code 0.

- [ ] **Step 4: Inspect the working tree before visual QA**

Run: `git status --short`

Expected: empty output. If verification required a scoped fix, commit that fix before continuing.

- [ ] **Step 5: Verify the experience in a real browser at mobile and desktop sizes**

Run: `npm run dev`

Open the public invitation route and verify at 390×844 and 1440×900:

- Landing appears first.
- Enter starts the melody, reveals the envelope, and shows only the 44×44 mute control.
- Muting removes the control and music does not restart.
- Refreshing shows Landing → Envelope again.
- Opening the envelope moves into details.
- No persistent section navigation appears at the top or bottom.
- Timeline reads top-to-bottom with one continuous connector line and no horizontal scroll.
- Step markers align with the connector at both widths.
- The mute button does not cover the preview ribbon, envelope seal, headings, or RSVP controls.
- Keyboard focus moves Landing button → envelope button → detail heading, and the mute button has a visible focus ring.

Expected: every item passes at both viewports with no console error.

- [ ] **Step 6: Record final evidence**

Run:

```bash
git log -4 --oneline
git status --short
```

Expected: the design commit plus the Task 1–3 implementation commits are present; working tree output is empty.
