import { beforeEach, describe, expect, test, vi } from 'vitest';

import getClearBonus from './getClearBonus.js';
import getLevelScore from './getLevelScore.js';
import getRemainingTimeBonus from './getRemainingTimeBonus.js';
import getWarriorScore from './getWarriorScore.js';

vi.mock('./getClearBonus.js');
vi.mock('./getRemainingTimeBonus.js');
vi.mock('./getWarriorScore.js');

const levelConfig = { timeBonus: 16 };

test('returns null when level failed', () => {
  expect(getLevelScore({ passed: false, turns: [] }, levelConfig)).toBeNull();
});

describe('level passed', () => {
  let levelResult: { passed: boolean; turns: unknown[][] };

  beforeEach(() => {
    levelResult = {
      passed: true,
      turns: [['turn-events']] as unknown[][],
    };
  });

  test('has warrior score part', () => {
    vi.mocked(getWarriorScore).mockReturnValue(8);
    expect(getLevelScore(levelResult, levelConfig)?.warrior).toBe(8);
  });

  test('has time bonus part', () => {
    vi.mocked(getRemainingTimeBonus).mockReturnValue(10);
    expect(getLevelScore(levelResult, levelConfig)?.timeBonus).toBe(10);
    expect(getRemainingTimeBonus).toHaveBeenCalledWith([['turn-events']], 16);
  });

  test('has clear bonus part', () => {
    vi.mocked(getWarriorScore).mockReturnValue(8);
    vi.mocked(getRemainingTimeBonus).mockReturnValue(12);
    vi.mocked(getClearBonus).mockReturnValue(4);
    expect(getLevelScore(levelResult, levelConfig)?.clearBonus).toBe(4);
    expect(getClearBonus).toHaveBeenCalledWith([['turn-events']], 8, 12);
  });
});
