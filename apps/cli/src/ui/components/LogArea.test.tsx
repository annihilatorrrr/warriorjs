import { render } from 'ink-testing-library';
import { describe, expect, test } from 'vitest';

import LogArea from './LogArea.js';

describe('LogArea', () => {
  const events = [
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

  test('renders log messages up to current turn', () => {
    const { lastFrame } = render(<LogArea events={events} currentTurn={2} />);
    const output = lastFrame()!;
    expect(output).toContain('Turn 2');
    expect(output).toContain('attacks forward');
    expect(output).toContain('Sludge');
    expect(output).toContain('Turn 1');
    expect(output).toContain('walks forward');
  });

  test('truncates to maxLines', () => {
    const { lastFrame } = render(<LogArea events={events} currentTurn={2} maxLines={3} />);
    const output = lastFrame()!;
    expect(output).toContain('Turn 2');
    expect(output).toContain('attacks forward');
    expect(output).toContain('Sludge');
    expect(output).not.toContain('Turn 1');
  });

  test('shows nothing on turn zero', () => {
    const { lastFrame } = render(<LogArea events={events} currentTurn={0} />);
    const output = lastFrame()!;
    expect(output).not.toContain('Turn');
  });

  test('shows only turns up to currentTurn', () => {
    const { lastFrame } = render(<LogArea events={events} currentTurn={1} />);
    const output = lastFrame()!;
    expect(output).toContain('Turn 1');
    expect(output).toContain('walks forward');
    expect(output).not.toContain('Turn 2');
  });
});
