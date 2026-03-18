import { expect, test } from 'vitest';

import getLastEvent from './getLastEvent.js';

test('returns the last event of the play', () => {
  const turns = [['turn1'], ['turn2'], ['event1', 'event2', 'event3']];
  expect(getLastEvent(turns)).toBe('event3');
});
