import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'vitest';

import { waitForRender, makeLevelReport, makeLevelRun } from '../testing.js';
import LevelCompleteScreen from './LevelCompleteScreen.js';

describe('LevelCompleteScreen', () => {
  test('shows passed menu with Next level when hasNextLevel', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport({ passed: true, hasNextLevel: true })}
        levelRun={makeLevelRun()}
        action={{ type: 'prompt' }}
        onSelect={vi.fn()}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Next level');
    expect(output).toContain('Review turns');
    expect(output).toContain('Stay and hone');
  });

  test('shows Enter epic mode when no next level', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport({ passed: true, hasNextLevel: false })}
        levelRun={makeLevelRun()}
        action={{ type: 'prompt' }}
        onSelect={vi.fn()}
      />,
    );
    expect(lastFrame()!).toContain('Enter epic mode');
  });

  test('shows failed menu with Try again', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport({ passed: false })}
        levelRun={makeLevelRun()}
        action={{ type: 'prompt' }}
        onSelect={vi.fn()}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Try again');
    expect(output).toContain('Review turns');
  });

  test('shows Reveal clues when clue available and not showing', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport({ passed: false, hasClue: true, isShowingClue: false })}
        levelRun={makeLevelRun()}
        action={{ type: 'prompt' }}
        onSelect={vi.fn()}
      />,
    );
    expect(lastFrame()!).toContain('Reveal clues');
  });

  test('hides Reveal clues when already showing', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport({ passed: false, hasClue: true, isShowingClue: true })}
        levelRun={makeLevelRun()}
        action={{ type: 'prompt' }}
        onSelect={vi.fn()}
      />,
    );
    expect(lastFrame()!).not.toContain('Reveal clues');
  });

  test('renders next-level action message', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport()}
        levelRun={makeLevelRun()}
        action={{ type: 'next-level', readmePath: 'path/to/README' }}
        onSelect={vi.fn()}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('path/to/README');
    expect(output).toContain('instructions');
  });

  test('renders clue action message', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport()}
        levelRun={makeLevelRun()}
        action={{ type: 'clue', readmePath: 'path/to/README' }}
        onSelect={vi.fn()}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('path/to/README');
    expect(output).toContain('clues');
  });

  test('renders stay action message', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport()}
        levelRun={makeLevelRun()}
        action={{ type: 'stay' }}
        onSelect={vi.fn()}
      />,
    );
    expect(lastFrame()!).toContain('stayed on the current level');
  });

  test('renders epic-mode action message', () => {
    const { lastFrame } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport()}
        levelRun={makeLevelRun()}
        action={{ type: 'epic-mode' }}
        onSelect={vi.fn()}
      />,
    );
    expect(lastFrame()!).toContain('Run warriorjs again to play epic mode');
  });

  test('calls onSelect when menu item is chosen', async () => {
    const onSelect = vi.fn();
    const { stdin } = render(
      <LevelCompleteScreen
        levelReport={makeLevelReport({ passed: true, hasNextLevel: true })}
        levelRun={makeLevelRun()}
        action={{ type: 'prompt' }}
        onSelect={onSelect}
      />,
    );
    stdin.write('\r');
    await waitForRender();
    expect(onSelect).toHaveBeenCalledWith('next-level');
  });
});
