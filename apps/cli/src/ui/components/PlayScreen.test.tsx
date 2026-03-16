import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'vitest';

import PlayScreen from './PlayScreen.js';

describe('PlayScreen', () => {
  const initialState = {
    message: '',
    unit: null,
    floorMap: [
      [{ character: '╔' }, { character: '═' }, { character: '╗' }],
      [{ character: '║' }, { character: '@', unit: { color: '#ffffff' } }, { character: '║' }],
      [{ character: '╚' }, { character: '═' }, { character: '╝' }],
    ],
    warriorStatus: { health: 20, score: 0 },
  };

  const events = [
    [
      {
        message: 'walks forward',
        unit: { name: 'Warrior', color: '#ffffff' },
        floorMap: [
          [{ character: '╔' }, { character: '═' }, { character: '╗' }],
          [{ character: '║' }, { character: ' ' }, { character: '║' }],
          [{ character: '╚' }, { character: '═' }, { character: '╝' }],
        ],
        warriorStatus: { health: 20, score: 0 },
      },
    ],
  ];

  test('renders initial state on turn zero', () => {
    const { lastFrame } = render(
      <PlayScreen
        events={events}
        initialState={initialState}
        warriorName="Olric"
        towerName="The Narrow Path"
        levelNumber={1}
        totalScore={0}
        maxHealth={20}
        onPlaybackComplete={vi.fn()}
      />,
    );
    const output = lastFrame()!;
    expect(output).toContain('WarriorJS');
    expect(output).toContain('Olric');
    expect(output).toContain('@');
    expect(output).toContain('❤');
    expect(output).toContain('Turn 0/1');
  });
});
