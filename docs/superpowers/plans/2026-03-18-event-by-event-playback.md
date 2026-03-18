# Event-by-Event Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change playback stepping from turn-by-turn to event-by-event, with dual-speed auto-play timing and chronological log rendering.

**Architecture:** Replace the single `currentTurn` index in the playback reducer with a two-level `{ turn, event }` cursor. The reducer needs the turn structure (`TurnEvent[][]`) to handle overflow/underflow. Auto-play uses `setTimeout` instead of `setInterval` to alternate between intra-turn and inter-turn delays. LogArea switches to chronological order with current-event highlighting.

**Tech Stack:** React (Ink), TypeScript, Vitest

---

### Task 1: Update playback hook, PlayScreen, and their tests

The reducer currently tracks `currentTurn: number`. Change it to `cursor: { turn: number; event: number }` and update all actions to step event-by-event. Update PlayScreen to use the new cursor and pass it to child components. These changes are done together since the hook signature change would break PlayScreen if committed separately.

**Files:**
- Modify: `apps/cli/src/ui/hooks/usePlayback.ts`
- Modify: `apps/cli/src/ui/screens/PlayScreen/PlayScreen.tsx`
- Test: `apps/cli/src/ui/hooks/usePlayback.test.ts`
- Test: `apps/cli/src/ui/screens/PlayScreen/PlayScreen.test.tsx`

- [ ] **Step 1: Update usePlayback test file — change `PlaybackState` shape and update existing tests**

Replace all `currentTurn` references with `cursor` in test assertions. The `initial` state needs a `turnEventCounts` array to tell the reducer how many events each turn has. Add tests for `nextStepCrossesTurn`.

```typescript
// Replace the entire test file content:

import { describe, expect, test } from 'vitest';

import { type PlaybackState, nextStepCrossesTurn, playbackReducer } from './usePlayback.js';

describe('playbackReducer', () => {
  // 10 turns: turn 0 has 1 event, turns 1-9 each have 2 events
  const turnEventCounts = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2];
  const initial: PlaybackState = {
    cursor: { turn: 0, event: 0 },
    totalTurns: 10,
    turnEventCounts,
    isPlaying: true,
    speed: 1,
    mode: 'playback',
  };

  test('toggles pause/resume during playback', () => {
    const paused = playbackReducer(initial, { type: 'TOGGLE_PLAY_PAUSE' });
    expect(paused.isPlaying).toBe(false);
    const resumed = playbackReducer(paused, { type: 'TOGGLE_PLAY_PAUSE' });
    expect(resumed.isPlaying).toBe(true);
  });

  test('cycles speed forward: 1 -> 2 -> 4 -> 1', () => {
    const s2 = playbackReducer(initial, { type: 'CYCLE_SPEED' });
    expect(s2.speed).toBe(2);
    const s4 = playbackReducer(s2, { type: 'CYCLE_SPEED' });
    expect(s4.speed).toBe(4);
    const s1 = playbackReducer(s4, { type: 'CYCLE_SPEED' });
    expect(s1.speed).toBe(1);
  });

  test('cycles speed backward: 1 -> 4 -> 2 -> 1', () => {
    const s4 = playbackReducer(initial, { type: 'CYCLE_SPEED_BACK' });
    expect(s4.speed).toBe(4);
    const s2 = playbackReducer(s4, { type: 'CYCLE_SPEED_BACK' });
    expect(s2.speed).toBe(2);
    const s1 = playbackReducer(s2, { type: 'CYCLE_SPEED_BACK' });
    expect(s1.speed).toBe(1);
  });

  test('skip goes to last event of last turn and enters review mode', () => {
    const skipped = playbackReducer(initial, { type: 'SKIP' });
    expect(skipped.cursor).toEqual({ turn: 9, event: 1 });
    expect(skipped.isPlaying).toBe(false);
    expect(skipped.mode).toBe('review');
  });

  test('advance steps to next event within same turn', () => {
    // Turn 1 has 2 events. Start at event 0.
    const atTurn1 = { ...initial, cursor: { turn: 1, event: 0 } };
    const next = playbackReducer(atTurn1, { type: 'ADVANCE' });
    expect(next.cursor).toEqual({ turn: 1, event: 1 });
  });

  test('advance overflows to next turn', () => {
    // Turn 1 has 2 events. At event 1 (last), should overflow to turn 2, event 0.
    const atLastEvent = { ...initial, cursor: { turn: 1, event: 1 } };
    const next = playbackReducer(atLastEvent, { type: 'ADVANCE' });
    expect(next.cursor).toEqual({ turn: 2, event: 0 });
  });

  test('advance at last event of last turn transitions to review mode', () => {
    const atEnd = { ...initial, cursor: { turn: 9, event: 1 } };
    const result = playbackReducer(atEnd, { type: 'ADVANCE' });
    expect(result.mode).toBe('review');
    expect(result.isPlaying).toBe(false);
    expect(result.cursor).toEqual({ turn: 9, event: 1 });
  });

  test('step_forward in review mode advances one event', () => {
    const review: PlaybackState = {
      ...initial,
      mode: 'review',
      isPlaying: false,
      cursor: { turn: 5, event: 0 },
    };
    const next = playbackReducer(review, { type: 'STEP_FORWARD' });
    expect(next.cursor).toEqual({ turn: 5, event: 1 });
  });

  test('step_forward overflows to next turn in review mode', () => {
    const review: PlaybackState = {
      ...initial,
      mode: 'review',
      isPlaying: false,
      cursor: { turn: 5, event: 1 },
    };
    const next = playbackReducer(review, { type: 'STEP_FORWARD' });
    expect(next.cursor).toEqual({ turn: 6, event: 0 });
  });

  test('step_forward at last event of last turn is no-op', () => {
    const review: PlaybackState = {
      ...initial,
      mode: 'review',
      isPlaying: false,
      cursor: { turn: 9, event: 1 },
    };
    const next = playbackReducer(review, { type: 'STEP_FORWARD' });
    expect(next.cursor).toEqual({ turn: 9, event: 1 });
  });

  test('step_back decrements event within same turn', () => {
    const review: PlaybackState = {
      ...initial,
      mode: 'review',
      isPlaying: false,
      cursor: { turn: 5, event: 1 },
    };
    const prev = playbackReducer(review, { type: 'STEP_BACK' });
    expect(prev.cursor).toEqual({ turn: 5, event: 0 });
  });

  test('step_back underflows to previous turn last event', () => {
    const review: PlaybackState = {
      ...initial,
      mode: 'review',
      isPlaying: false,
      cursor: { turn: 5, event: 0 },
    };
    const prev = playbackReducer(review, { type: 'STEP_BACK' });
    // Turn 4 has 2 events, so last event index is 1.
    expect(prev.cursor).toEqual({ turn: 4, event: 1 });
  });

  test('step_back at turn 0 event 0 is no-op', () => {
    const review: PlaybackState = {
      ...initial,
      mode: 'review',
      isPlaying: false,
      cursor: { turn: 0, event: 0 },
    };
    const prev = playbackReducer(review, { type: 'STEP_BACK' });
    expect(prev.cursor).toEqual({ turn: 0, event: 0 });
  });

  test('restart goes back to playback mode from turn 0 event 0', () => {
    const review: PlaybackState = {
      ...initial,
      mode: 'review',
      isPlaying: false,
      cursor: { turn: 9, event: 1 },
    };
    const restarted = playbackReducer(review, { type: 'RESTART' });
    expect(restarted.cursor).toEqual({ turn: 0, event: 0 });
    expect(restarted.isPlaying).toBe(true);
    expect(restarted.mode).toBe('playback');
    expect(restarted.speed).toBe(1);
  });

  test('toggle_play_pause is ignored in review mode', () => {
    const review: PlaybackState = { ...initial, mode: 'review', isPlaying: false };
    const result = playbackReducer(review, { type: 'TOGGLE_PLAY_PAUSE' });
    expect(result.isPlaying).toBe(false);
  });

  test('cycle_speed is ignored in review mode', () => {
    const review: PlaybackState = { ...initial, mode: 'review', isPlaying: false };
    const result = playbackReducer(review, { type: 'CYCLE_SPEED' });
    expect(result.speed).toBe(review.speed);
  });

  test('startInReview initializes at last event of last turn in review mode', () => {
    const startInReview: PlaybackState = {
      cursor: { turn: 9, event: 1 },
      totalTurns: 10,
      turnEventCounts,
      isPlaying: false,
      speed: 1,
      mode: 'review',
    };
    const stepped = playbackReducer(startInReview, { type: 'STEP_BACK' });
    expect(stepped.cursor).toEqual({ turn: 9, event: 0 });
    const restarted = playbackReducer(startInReview, { type: 'RESTART' });
    expect(restarted.cursor).toEqual({ turn: 0, event: 0 });
    expect(restarted.isPlaying).toBe(true);
    expect(restarted.mode).toBe('playback');
  });
});

describe('nextStepCrossesTurn', () => {
  const counts = [1, 2, 3];

  test('returns true when at last event of a turn', () => {
    expect(nextStepCrossesTurn({ turn: 0, event: 0 }, counts)).toBe(true);
    expect(nextStepCrossesTurn({ turn: 1, event: 1 }, counts)).toBe(true);
    expect(nextStepCrossesTurn({ turn: 2, event: 2 }, counts)).toBe(true);
  });

  test('returns false when not at last event of a turn', () => {
    expect(nextStepCrossesTurn({ turn: 1, event: 0 }, counts)).toBe(false);
    expect(nextStepCrossesTurn({ turn: 2, event: 0 }, counts)).toBe(false);
    expect(nextStepCrossesTurn({ turn: 2, event: 1 }, counts)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run apps/cli/src/ui/hooks/usePlayback.test.ts`
Expected: FAIL — `PlaybackState` no longer matches (missing `cursor`, has `currentTurn`).

- [ ] **Step 3: Update `PlaybackState`, `PlaybackAction`, and `playbackReducer`**

Replace the contents of `apps/cli/src/ui/hooks/usePlayback.ts`:

```typescript
import { useInput } from 'ink';
import { useEffect, useReducer, useRef } from 'react';

export interface PlaybackCursor {
  turn: number;
  event: number;
}

export interface PlaybackState {
  cursor: PlaybackCursor;
  totalTurns: number;
  turnEventCounts: number[];
  isPlaying: boolean;
  speed: number;
  mode: 'playback' | 'review';
}

export type PlaybackAction =
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'CYCLE_SPEED' }
  | { type: 'CYCLE_SPEED_BACK' }
  | { type: 'SKIP' }
  | { type: 'ADVANCE' }
  | { type: 'STEP_FORWARD' }
  | { type: 'STEP_BACK' }
  | { type: 'RESTART' };

const SPEEDS = [1, 2, 4];

function stepForward(cursor: PlaybackCursor, counts: number[]): PlaybackCursor | null {
  const maxEvent = counts[cursor.turn]! - 1;
  if (cursor.event < maxEvent) {
    return { turn: cursor.turn, event: cursor.event + 1 };
  }
  if (cursor.turn < counts.length - 1) {
    return { turn: cursor.turn + 1, event: 0 };
  }
  return null; // already at end
}

function stepBack(cursor: PlaybackCursor, counts: number[]): PlaybackCursor | null {
  if (cursor.event > 0) {
    return { turn: cursor.turn, event: cursor.event - 1 };
  }
  if (cursor.turn > 0) {
    const prevTurn = cursor.turn - 1;
    return { turn: prevTurn, event: counts[prevTurn]! - 1 };
  }
  return null; // already at start
}

function lastCursor(counts: number[]): PlaybackCursor {
  const lastTurn = counts.length - 1;
  return { turn: lastTurn, event: counts[lastTurn]! - 1 };
}

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'TOGGLE_PLAY_PAUSE': {
      if (state.mode !== 'playback') return state;
      return { ...state, isPlaying: !state.isPlaying };
    }
    case 'CYCLE_SPEED': {
      if (state.mode !== 'playback') return state;
      const currentIndex = SPEEDS.indexOf(state.speed);
      const nextSpeed = SPEEDS[(currentIndex + 1) % SPEEDS.length]!;
      return { ...state, speed: nextSpeed };
    }
    case 'CYCLE_SPEED_BACK': {
      if (state.mode !== 'playback') return state;
      const currentIndex = SPEEDS.indexOf(state.speed);
      const prevSpeed = SPEEDS[(currentIndex - 1 + SPEEDS.length) % SPEEDS.length]!;
      return { ...state, speed: prevSpeed };
    }
    case 'SKIP': {
      return {
        ...state,
        cursor: lastCursor(state.turnEventCounts),
        isPlaying: false,
        mode: 'review',
      };
    }
    case 'ADVANCE': {
      const next = stepForward(state.cursor, state.turnEventCounts);
      if (!next) {
        return { ...state, isPlaying: false, mode: 'review' };
      }
      return { ...state, cursor: next };
    }
    case 'STEP_FORWARD': {
      if (state.mode !== 'review') return state;
      const next = stepForward(state.cursor, state.turnEventCounts);
      if (!next) return state;
      return { ...state, cursor: next };
    }
    case 'STEP_BACK': {
      if (state.mode !== 'review') return state;
      const prev = stepBack(state.cursor, state.turnEventCounts);
      if (!prev) return state;
      return { ...state, cursor: prev };
    }
    case 'RESTART': {
      return {
        ...state,
        cursor: { turn: 0, event: 0 },
        isPlaying: true,
        mode: 'playback',
        speed: 1,
      };
    }
    default:
      return state;
  }
}

/** Returns true if the next step crosses a turn boundary. */
export function nextStepCrossesTurn(cursor: PlaybackCursor, turnEventCounts: number[]): boolean {
  const maxEvent = turnEventCounts[cursor.turn]! - 1;
  return cursor.event >= maxEvent;
}

const INTRA_TURN_DELAY = 600;
const INTER_TURN_DELAY = 720;

export function usePlayback(
  turns: unknown[][],
  onPlaybackComplete: () => void,
  startInReview = false,
): { state: PlaybackState; dispatch: React.Dispatch<PlaybackAction> } {
  const turnEventCounts = turns.map((t) => t.length);
  const totalTurns = turns.length;
  const last = lastCursor(turnEventCounts);

  const [state, dispatch] = useReducer(playbackReducer, {
    cursor: startInReview ? last : { turn: 0, event: 0 },
    totalTurns,
    turnEventCounts,
    isPlaying: !startInReview,
    speed: 1,
    mode: startInReview ? 'review' : 'playback',
  });

  const hasFiredComplete = useRef(startInReview);

  // Auto-play: use setTimeout with variable delay based on turn boundary.
  useEffect(() => {
    if (!state.isPlaying) return;
    const crossesTurn = nextStepCrossesTurn(state.cursor, state.turnEventCounts);
    const delay = (crossesTurn ? INTER_TURN_DELAY : INTRA_TURN_DELAY) / state.speed;
    const timer = setTimeout(() => dispatch({ type: 'ADVANCE' }), delay);
    return () => clearTimeout(timer);
  }, [state.isPlaying, state.speed, state.cursor]);

  useEffect(() => {
    if (state.mode === 'review' && !hasFiredComplete.current) {
      hasFiredComplete.current = true;
      onPlaybackComplete();
    }
  }, [state.mode, onPlaybackComplete]);

  useInput((input, key) => {
    if (state.mode === 'playback') {
      if (input === ' ') dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
      if (key.tab && key.shift) dispatch({ type: 'CYCLE_SPEED_BACK' });
      else if (key.tab) dispatch({ type: 'CYCLE_SPEED' });
      if (input === 's') dispatch({ type: 'SKIP' });
    } else {
      if (key.escape) onPlaybackComplete();
      if (key.leftArrow) dispatch({ type: 'STEP_BACK' });
      if (key.rightArrow) dispatch({ type: 'STEP_FORWARD' });
    }
  });

  return { state, dispatch };
}
```

- [ ] **Step 4: Run usePlayback tests to verify they pass**

Run: `npx vitest run apps/cli/src/ui/hooks/usePlayback.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Update PlayScreen test — add multi-event replay test**

Add this test after the existing one in `PlayScreen.test.tsx`:

```typescript
test('passes turn event counts to usePlayback', () => {
  // Replay with a multi-event turn: turn 1 has 2 events.
  const multiEventReplay = {
    initialState: replay.initialState,
    turns: [
      [
        {
          message: 'attacks forward',
          unit: { name: 'Warrior', color: '#ffffff' },
          floorMap: [
            [{ character: '╔' }, { character: '═' }, { character: '╗' }],
            [{ character: '║' }, { character: '@', unit: { color: '#ffffff' } }, { character: '║' }],
            [{ character: '╚' }, { character: '═' }, { character: '╝' }],
          ],
          warriorStatus: { health: 20, score: 5 },
        },
        {
          message: 'takes 3 damage',
          unit: { name: 'Sludge', color: '#00ff00' },
          floorMap: [
            [{ character: '╔' }, { character: '═' }, { character: '╗' }],
            [{ character: '║' }, { character: '@', unit: { color: '#ffffff' } }, { character: '║' }],
            [{ character: '╚' }, { character: '═' }, { character: '╝' }],
          ],
          warriorStatus: { health: 17, score: 5 },
        },
      ],
    ],
  };

  const { lastFrame } = render(
    <PlayScreen replay={multiEventReplay} context={context} onPlaybackComplete={vi.fn()} />,
  );
  const output = lastFrame()!;
  // At turn 0 (initial state), floor map renders.
  expect(output).toContain('@');
  expect(output).toContain('Turn 0/1');
});
```

- [ ] **Step 6: Update PlayScreen component**

Replace the contents of `apps/cli/src/ui/screens/PlayScreen/PlayScreen.tsx`:

```typescript
import { Box } from 'ink';
import type React from 'react';
import { useMemo } from 'react';

import Divider from '../../components/Divider/index.js';
import FloorMap from '../../components/FloorMap/index.js';
import Header from '../../components/Header/index.js';
import LogArea from '../../components/LogArea/index.js';
import Scrubber from '../../components/Scrubber/index.js';
import WarriorStatus from '../../components/WarriorStatus/index.js';
import { usePlayback } from '../../hooks/usePlayback.js';
import { type LevelContext, type LevelReplay } from '../../types.js';

interface PlayScreenProps {
  replay: LevelReplay;
  context: LevelContext;
  reviewMode?: boolean;
  onPlaybackComplete: () => void;
}

export default function PlayScreen({
  replay,
  context,
  reviewMode,
  onPlaybackComplete,
}: PlayScreenProps): React.ReactElement {
  const turnsWithInitial = useMemo(
    () => [[replay.initialState], ...replay.turns],
    [replay.initialState, replay.turns],
  );
  const { state } = usePlayback(turnsWithInitial, onPlaybackComplete, reviewMode);
  const { cursor } = state;
  const currentEvent = turnsWithInitial[cursor.turn]?.[cursor.event];

  return (
    <Box flexDirection="column" width="100%">
      <Header
        warriorName={context.warriorName}
        towerName={context.towerName}
        levelNumber={context.levelNumber}
        score={context.totalScore}
      />
      <Box flexDirection="column">
        {currentEvent && (
          <>
            <FloorMap floorMap={currentEvent.floorMap} />
            {currentEvent.warriorStatus && (
              <WarriorStatus
                health={currentEvent.warriorStatus.health}
                maxHealth={context.maxHealth}
                score={currentEvent.warriorStatus.score}
              />
            )}
          </>
        )}
      </Box>
      <Divider />
      <Box flexDirection="column" height={10}>
        <LogArea turns={turnsWithInitial} cursor={cursor} />
      </Box>
      <Divider />
      <Scrubber
        currentTurn={cursor.turn}
        totalTurns={turnsWithInitial.length}
        speed={state.speed}
        mode={state.mode}
        isPlaying={state.isPlaying}
      />
    </Box>
  );
}
```

Key changes:
- `usePlayback` now receives `turnsWithInitial` (the actual 2D array) instead of just its length.
- `currentEvent` is derived from `cursor.turn` and `cursor.event` directly (not `lastEvent` of the turn).
- `LogArea` receives `cursor` instead of `currentTurn`.
- `Scrubber` still receives `cursor.turn` for its turn display.

Note: PlayScreen tests will have a TypeScript error for LogArea's `cursor` prop until Task 2 is complete. Run only PlayScreen's own test file at this point.

- [ ] **Step 7: Run PlayScreen tests to verify they pass**

Run: `npx vitest run apps/cli/src/ui/screens/PlayScreen/PlayScreen.test.tsx`
Expected: PASS (both tests).

- [ ] **Step 8: Commit**

```bash
git add apps/cli/src/ui/hooks/usePlayback.ts apps/cli/src/ui/hooks/usePlayback.test.ts apps/cli/src/ui/screens/PlayScreen/PlayScreen.tsx apps/cli/src/ui/screens/PlayScreen/PlayScreen.test.tsx
git commit -m "feat(cli): change playback from turn-level to event-level cursor"
```

---

### Task 2: Rewrite LogArea for chronological order and event highlighting

LogArea currently renders newest-first and takes `currentTurn: number`. Change it to render top-to-bottom (chronological), accept the `{ turn, event }` cursor, show events up to the cursor position, and highlight the current event line.

**Files:**
- Modify: `apps/cli/src/ui/components/LogArea/LogArea.tsx`
- Test: `apps/cli/src/ui/components/LogArea/LogArea.test.tsx`

- [ ] **Step 1: Rewrite LogArea tests for new behavior**

Replace the contents of `apps/cli/src/ui/components/LogArea/LogArea.test.tsx`:

```tsx
import { render } from 'ink-testing-library';
import { describe, expect, test } from 'vitest';

import LogArea from './LogArea.js';

describe('LogArea', () => {
  const turns = [
    [
      {
        message: '',
        unit: { name: 'Warrior', color: '#ffffff' },
        floorMap: [],
        warriorStatus: { health: 20, score: 0 },
      },
    ],
    [
      {
        message: 'walks forward',
        unit: { name: 'Warrior', color: '#ffffff' },
        floorMap: [],
        warriorStatus: { health: 20, score: 0 },
      },
    ],
    [
      {
        message: 'attacks forward',
        unit: { name: 'Warrior', color: '#ffffff' },
        floorMap: [],
        warriorStatus: { health: 18, score: 5 },
      },
      {
        message: 'takes 5 damage, dies',
        unit: { name: 'Sludge', color: '#00ff00' },
        floorMap: [],
        warriorStatus: { health: 18, score: 10 },
      },
    ],
  ];

  test('shows nothing at turn 0 event 0 (initial state)', () => {
    const { lastFrame } = render(
      <LogArea turns={turns} cursor={{ turn: 0, event: 0 }} />,
    );
    const output = lastFrame()!;
    expect(output).not.toContain('Turn');
  });

  test('renders first event of turn 1', () => {
    const { lastFrame } = render(
      <LogArea turns={turns} cursor={{ turn: 1, event: 0 }} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Turn 1');
    expect(output).toContain('walks forward');
  });

  test('renders first event of turn 2 without second event', () => {
    const { lastFrame } = render(
      <LogArea turns={turns} cursor={{ turn: 2, event: 0 }} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Turn 1');
    expect(output).toContain('walks forward');
    expect(output).toContain('Turn 2');
    expect(output).toContain('attacks forward');
    expect(output).not.toContain('Sludge');
  });

  test('renders both events of turn 2 at second event', () => {
    const { lastFrame } = render(
      <LogArea turns={turns} cursor={{ turn: 2, event: 1 }} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Turn 2');
    expect(output).toContain('attacks forward');
    expect(output).toContain('Sludge');
  });

  test('renders in chronological order (oldest first)', () => {
    const { lastFrame } = render(
      <LogArea turns={turns} cursor={{ turn: 2, event: 1 }} />,
    );
    const output = lastFrame()!;
    const turn1Pos = output.indexOf('Turn 1');
    const turn2Pos = output.indexOf('Turn 2');
    expect(turn1Pos).toBeLessThan(turn2Pos);
  });

  test('truncates oldest lines when exceeding maxLines', () => {
    const { lastFrame } = render(
      <LogArea turns={turns} cursor={{ turn: 2, event: 1 }} maxLines={3} />,
    );
    const output = lastFrame()!;
    // Only 3 lines visible: Turn 2 header + 2 events. Turn 1 scrolled off.
    expect(output).toContain('Turn 2');
    expect(output).toContain('attacks forward');
    expect(output).toContain('Sludge');
    expect(output).not.toContain('Turn 1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run apps/cli/src/ui/components/LogArea/LogArea.test.tsx`
Expected: FAIL — `LogArea` still expects `currentTurn: number`, not `cursor`.

- [ ] **Step 3: Rewrite LogArea component**

Replace the contents of `apps/cli/src/ui/components/LogArea/LogArea.tsx`:

```tsx
import { Box, Text } from 'ink';
import type React from 'react';
import { useMemo } from 'react';

import type { PlaybackCursor } from '../../hooks/usePlayback.js';
import { type TurnEvent } from '../../types.js';

interface LogAreaProps {
  turns: TurnEvent[][];
  cursor: PlaybackCursor;
  maxLines?: number;
}

interface LogLine {
  type: 'turn' | 'event';
  turnNumber: number;
  event?: TurnEvent;
}

function buildUnitColorMap(turns: TurnEvent[][]): Map<string, string> {
  const map = new Map<string, string>();
  for (const turn of turns) {
    for (const event of turn) {
      if (event.unit) {
        map.set(event.unit.name, event.unit.color);
      }
    }
  }
  return map;
}

const STAT_RE = /\d+ damage|\d+ HP/;

function buildColorizeRegex(unitColors: Map<string, string>): RegExp {
  const unitNames = Array.from(unitColors.keys()).map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  const alternatives = [STAT_RE.source, ...unitNames];
  return new RegExp(`(${alternatives.join('|')})`);
}

function colorizeMessage(
  message: string,
  unitColors: Map<string, string>,
  regex: RegExp,
): React.ReactNode[] {
  const parts = message.split(regex);

  return parts.map((part, i) => {
    const unitColor = unitColors.get(part);
    if (unitColor) {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: split parts are positional
        <Text key={i} color={unitColor}>
          {part}
        </Text>
      );
    }
    if (STAT_RE.test(part)) {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: split parts are positional
        <Text key={i} bold>
          {part}
        </Text>
      );
    }
    // biome-ignore lint/suspicious/noArrayIndexKey: split parts are positional
    return <Text key={i}>{part}</Text>;
  });
}

export default function LogArea({
  turns,
  cursor,
  maxLines = 10,
}: LogAreaProps): React.ReactElement {
  const unitColors = useMemo(() => buildUnitColorMap(turns), [turns]);
  const colorizeRegex = useMemo(() => buildColorizeRegex(unitColors), [unitColors]);

  // Build a flat list of lines in chronological order, up to the cursor position.
  const visibleLines = useMemo(() => {
    const lines: LogLine[] = [];

    for (let t = 0; t <= cursor.turn; t++) {
      const turnEvents = turns[t]!;
      const maxEvent = t === cursor.turn ? cursor.event : turnEvents.length - 1;
      const eventsInRange: TurnEvent[] = [];

      for (let e = 0; e <= maxEvent; e++) {
        const event = turnEvents[e]!;
        if (event.message) {
          eventsInRange.push(event);
        }
      }

      if (eventsInRange.length > 0) {
        lines.push({ type: 'turn', turnNumber: t });
        for (const event of eventsInRange) {
          lines.push({ type: 'event', turnNumber: t, event });
        }
      }
    }

    // Truncate from the top (oldest lines scroll off).
    return lines.length > maxLines ? lines.slice(lines.length - maxLines) : lines;
  }, [turns, cursor, maxLines]);

  const lastIndex = visibleLines.length - 1;

  return (
    <Box flexDirection="column">
      {visibleLines.map((line, index) => {
        if (line.type === 'turn') {
          return (
            <Text key={`t${line.turnNumber}`} dimColor>
              {`Turn ${line.turnNumber}`}
            </Text>
          );
        }
        const event = line.event!;
        const text = event.unit ? `${event.unit.name} ${event.message}` : event.message;
        const isCurrent = index === lastIndex;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: unique with turnNumber
          <Box key={`e${line.turnNumber}-${index}`} gap={1}>
            <Text dimColor={!isCurrent}>{'>'}</Text>
            <Text bold={isCurrent} dimColor={!isCurrent}>
              {isCurrent
                ? colorizeMessage(text, unitColors, colorizeRegex)
                : text}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
```

Key changes:
- Props: `cursor: PlaybackCursor` instead of `currentTurn: number`.
- Chronological order: iterates turns 0 → cursor.turn, events 0 → cursor.event.
- Turn headings appear before the first event of each turn (only when that turn has visible events).
- Current event (last visible line) renders bold with colorization. All previous event lines render dimmed.
- Truncation slices from the start (oldest lines scroll off the top).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run apps/cli/src/ui/components/LogArea/LogArea.test.tsx`
Expected: All tests PASS.

- [ ] **Step 5: Run the full CLI test suite to verify nothing is broken**

Run: `npx vitest run apps/cli/`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/cli/src/ui/components/LogArea/LogArea.tsx apps/cli/src/ui/components/LogArea/LogArea.test.tsx
git commit -m "feat(cli): render log chronologically with event-level cursor and highlighting"
```

---

### Task 3: Run full test suite and lint

Final verification that everything works together.

**Files:** None (verification only).

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS.

- [ ] **Step 2: Run linter**

Run: `pnpm lint`
Expected: No errors. If there are formatting issues, run `pnpm lint:fix` and commit.

- [ ] **Step 3: Typecheck**

Run: `pnpm build`
Expected: Build succeeds with no type errors.
