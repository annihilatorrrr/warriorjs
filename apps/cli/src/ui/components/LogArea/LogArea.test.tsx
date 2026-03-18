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
    const { lastFrame } = render(<LogArea turns={turns} cursor={{ turn: 0, event: 0 }} />);
    const output = lastFrame()!;
    expect(output).not.toContain('Turn');
  });

  test('renders first event of turn 1', () => {
    const { lastFrame } = render(<LogArea turns={turns} cursor={{ turn: 1, event: 0 }} />);
    const output = lastFrame()!;
    expect(output).toContain('Turn 1');
    expect(output).toContain('walks forward');
  });

  test('renders first event of turn 2 without second event', () => {
    const { lastFrame } = render(<LogArea turns={turns} cursor={{ turn: 2, event: 0 }} />);
    const output = lastFrame()!;
    expect(output).toContain('Turn 1');
    expect(output).toContain('walks forward');
    expect(output).toContain('Turn 2');
    expect(output).toContain('attacks forward');
    expect(output).not.toContain('Sludge');
  });

  test('renders both events of turn 2 at second event', () => {
    const { lastFrame } = render(<LogArea turns={turns} cursor={{ turn: 2, event: 1 }} />);
    const output = lastFrame()!;
    expect(output).toContain('Turn 2');
    expect(output).toContain('attacks forward');
    expect(output).toContain('Sludge');
  });

  test('renders in chronological order (oldest first)', () => {
    const { lastFrame } = render(<LogArea turns={turns} cursor={{ turn: 2, event: 1 }} />);
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
