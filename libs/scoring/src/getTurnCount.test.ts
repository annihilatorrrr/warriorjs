import { expect, test } from 'vitest';
import getTurnCount from './getTurnCount.js';

test('returns the number of turns played', () => {
  const turns = [['turn1'], ['turn2'], ['turn3']];
  expect(getTurnCount(turns)).toBe(3);
});
