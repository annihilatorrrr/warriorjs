import { useInput } from 'ink';
import { useEffect, useReducer, useRef } from 'react';

export interface PlaybackState {
  currentTurn: number;
  totalTurns: number;
  isPlaying: boolean;
  speed: number;
  mode: 'playback' | 'review';
}

export type PlaybackAction =
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'CYCLE_SPEED' }
  | { type: 'CYCLE_SPEED_BACK' }
  | { type: 'SKIP' }
  | { type: 'ADVANCE_TURN' }
  | { type: 'STEP_FORWARD' }
  | { type: 'STEP_BACK' }
  | { type: 'RESTART' };

const SPEEDS = [1, 2, 4];

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
        currentTurn: state.totalTurns - 1,
        isPlaying: false,
        mode: 'review',
      };
    }
    case 'ADVANCE_TURN': {
      if (state.currentTurn >= state.totalTurns - 1) {
        return { ...state, isPlaying: false, mode: 'review' };
      }
      return { ...state, currentTurn: state.currentTurn + 1 };
    }
    case 'STEP_FORWARD': {
      if (state.mode !== 'review') return state;
      if (state.currentTurn >= state.totalTurns - 1) return state;
      return { ...state, currentTurn: state.currentTurn + 1 };
    }
    case 'STEP_BACK': {
      if (state.mode !== 'review') return state;
      if (state.currentTurn <= 0) return state;
      return { ...state, currentTurn: state.currentTurn - 1 };
    }
    case 'RESTART': {
      return {
        ...state,
        currentTurn: 0,
        isPlaying: true,
        mode: 'playback',
        speed: 1,
      };
    }
    default:
      return state;
  }
}

export function usePlayback(
  totalTurns: number,
  onPlaybackComplete: () => void,
  startInReview = false,
): { state: PlaybackState; dispatch: React.Dispatch<PlaybackAction> } {
  const [state, dispatch] = useReducer(playbackReducer, {
    currentTurn: startInReview ? totalTurns - 1 : 0,
    totalTurns,
    isPlaying: !startInReview,
    speed: 1,
    mode: startInReview ? 'review' : 'playback',
  });

  const hasFiredComplete = useRef(startInReview);

  useEffect(() => {
    if (!state.isPlaying) return;
    const interval = setInterval(() => dispatch({ type: 'ADVANCE_TURN' }), 600 / state.speed);
    return () => clearInterval(interval);
  }, [state.isPlaying, state.speed]);

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
