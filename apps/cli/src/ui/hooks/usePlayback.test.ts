import { describe, expect, test } from 'vitest';

import { type PlaybackState, playbackReducer } from './usePlayback.js';

describe('playbackReducer', () => {
  const initial: PlaybackState = {
    currentTurn: 0,
    totalTurns: 10,
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

  test('skip goes to last turn and enters review mode', () => {
    const skipped = playbackReducer(initial, { type: 'SKIP' });
    expect(skipped.currentTurn).toBe(9);
    expect(skipped.isPlaying).toBe(false);
    expect(skipped.mode).toBe('review');
  });

  test('advance_turn moves forward during playback', () => {
    const next = playbackReducer(initial, { type: 'ADVANCE_TURN' });
    expect(next.currentTurn).toBe(1);
  });

  test('advance_turn at last turn transitions to review mode', () => {
    const atEnd = { ...initial, currentTurn: 9 };
    const result = playbackReducer(atEnd, { type: 'ADVANCE_TURN' });
    expect(result.mode).toBe('review');
    expect(result.isPlaying).toBe(false);
  });

  test('step_forward in review mode', () => {
    const review: PlaybackState = { ...initial, mode: 'review', isPlaying: false, currentTurn: 5 };
    const next = playbackReducer(review, { type: 'STEP_FORWARD' });
    expect(next.currentTurn).toBe(6);
  });

  test('step_forward at last turn is no-op', () => {
    const review: PlaybackState = { ...initial, mode: 'review', isPlaying: false, currentTurn: 9 };
    const next = playbackReducer(review, { type: 'STEP_FORWARD' });
    expect(next.currentTurn).toBe(9);
  });

  test('step_back in review mode', () => {
    const review: PlaybackState = { ...initial, mode: 'review', isPlaying: false, currentTurn: 5 };
    const prev = playbackReducer(review, { type: 'STEP_BACK' });
    expect(prev.currentTurn).toBe(4);
  });

  test('step_back at turn 0 is no-op', () => {
    const review: PlaybackState = { ...initial, mode: 'review', isPlaying: false, currentTurn: 0 };
    const prev = playbackReducer(review, { type: 'STEP_BACK' });
    expect(prev.currentTurn).toBe(0);
  });

  test('restart goes back to playback mode from turn 0', () => {
    const review: PlaybackState = { ...initial, mode: 'review', isPlaying: false, currentTurn: 9 };
    const restarted = playbackReducer(review, { type: 'RESTART' });
    expect(restarted.currentTurn).toBe(0);
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

  test('startInReview initializes at last turn in review mode', () => {
    const startInReview: PlaybackState = {
      currentTurn: 9,
      totalTurns: 10,
      isPlaying: false,
      speed: 1,
      mode: 'review',
    };
    // Verify stepping back works from the review start position.
    const stepped = playbackReducer(startInReview, { type: 'STEP_BACK' });
    expect(stepped.currentTurn).toBe(8);
    // Verify restart works.
    const restarted = playbackReducer(startInReview, { type: 'RESTART' });
    expect(restarted.currentTurn).toBe(0);
    expect(restarted.isPlaying).toBe(true);
    expect(restarted.mode).toBe('playback');
  });
});
