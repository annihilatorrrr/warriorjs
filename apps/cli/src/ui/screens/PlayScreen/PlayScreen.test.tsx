import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'vitest';

import PlayScreen from './PlayScreen.js';

describe('PlayScreen', () => {
  const replay = {
    initialState: {
      message: '',
      unit: null,
      floorMap: [
        [{ character: '╔' }, { character: '═' }, { character: '╗' }],
        [{ character: '║' }, { character: '@', unit: { color: '#ffffff' } }, { character: '║' }],
        [{ character: '╚' }, { character: '═' }, { character: '╝' }],
      ],
      warriorStatus: { health: 20, score: 0 },
    },
    turns: [
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
    ],
  };

  const context = {
    warriorName: 'Olric',
    towerName: 'The Narrow Path',
    levelNumber: 1,
    totalScore: 0,
    maxHealth: 20,
  };

  test('renders initial state on turn zero', () => {
    const { lastFrame } = render(
      <PlayScreen replay={replay} context={context} onPlaybackComplete={vi.fn()} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('WarriorJS');
    expect(output).toContain('Olric');
    expect(output).toContain('@');
    expect(output).toContain('❤');
    expect(output).toContain('Turn 0/1');
  });

  test('passes turn event counts to usePlayback', () => {
    const multiEventReplay = {
      initialState: replay.initialState,
      turns: [
        [
          {
            message: 'attacks forward',
            unit: { name: 'Warrior', color: '#ffffff' },
            floorMap: [
              [{ character: '╔' }, { character: '═' }, { character: '╗' }],
              [
                { character: '║' },
                { character: '@', unit: { color: '#ffffff' } },
                { character: '║' },
              ],
              [{ character: '╚' }, { character: '═' }, { character: '╝' }],
            ],
            warriorStatus: { health: 20, score: 5 },
          },
          {
            message: 'takes 3 damage',
            unit: { name: 'Sludge', color: '#00ff00' },
            floorMap: [
              [{ character: '╔' }, { character: '═' }, { character: '╗' }],
              [
                { character: '║' },
                { character: '@', unit: { color: '#ffffff' } },
                { character: '║' },
              ],
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
    expect(output).toContain('@');
    expect(output).toContain('Turn 0/1');
  });
});
