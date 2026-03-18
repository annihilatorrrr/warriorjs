import { render } from 'ink-testing-library';
import { describe, expect, test } from 'vitest';

import FloorMap from './FloorMap.js';

describe('FloorMap', () => {
  test('renders floor map characters', () => {
    const floorMap = [
      [{ character: '╔' }, { character: '═' }, { character: '╗' }],
      [{ character: '║' }, { character: '@', unit: { color: '#00ff00' } }, { character: '║' }],
      [{ character: '╚' }, { character: '═' }, { character: '╝' }],
    ];
    const { lastFrame } = render(<FloorMap floorMap={floorMap} />);
    const output = lastFrame()!;
    expect(output).toContain('╔');
    expect(output).toContain('@');
    expect(output).toContain('╝');
  });

  test('renders empty spaces without unit styling', () => {
    const floorMap = [[{ character: ' ' }, { character: '>' }]];
    const { lastFrame } = render(<FloorMap floorMap={floorMap} />);
    const output = lastFrame()!;
    expect(output).toContain('>');
  });
});
