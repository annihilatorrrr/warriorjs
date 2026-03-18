import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, test } from 'vitest';

import { type TurnEvent } from '../../types.js';
import LevelLayout from './LevelLayout.js';

function makeEvent(overrides: Partial<TurnEvent> = {}): TurnEvent {
  return {
    message: 'test',
    unit: null,
    floorMap: [[{ character: '║' }, { character: '@' }, { character: '║' }]],
    warriorStatus: { health: 20, score: 0 },
    ...overrides,
  };
}

describe('LevelLayout', () => {
  test('renders header, floor map, divider, and children', () => {
    const turns = [[makeEvent()]];
    const { lastFrame } = render(
      <LevelLayout
        turns={turns}
        warriorName="Olric"
        towerName="The Narrow Path"
        levelNumber={3}
        totalScore={42}
      >
        <Text>child content</Text>
      </LevelLayout>,
    );
    const output = lastFrame()!;
    expect(output).toContain('Olric');
    expect(output).toContain('The Narrow Path');
    expect(output).toContain('3');
    expect(output).toContain('@');
    expect(output).toContain('child content');
    expect(output).toContain('─');
  });

  test('renders without floor map when turns are empty', () => {
    const { lastFrame } = render(
      <LevelLayout
        turns={[]}
        warriorName="Olric"
        towerName="The Narrow Path"
        levelNumber={1}
        totalScore={0}
      >
        <Text>content</Text>
      </LevelLayout>,
    );
    const output = lastFrame()!;
    expect(output).toContain('content');
    expect(output).not.toContain('@');
  });
});
