import getClearBonus from './getClearBonus.js';
import getRemainingTimeBonus from './getRemainingTimeBonus.js';
import getWarriorScore from './getWarriorScore.js';

interface LevelResult {
  passed: boolean;
  turns: unknown[][];
}

interface LevelConfig {
  timeBonus: number;
}

interface LevelScore {
  clearBonus: number;
  timeBonus: number;
  warrior: number;
}

/**
 * Returns the score for the given level.
 *
 * @param result The level result.
 * @param levelConfig The level config.
 * @returns The score of the level, broken down into its components.
 */
function getLevelScore(
  { passed, turns }: LevelResult,
  { timeBonus }: LevelConfig,
): LevelScore | null {
  if (!passed) {
    return null;
  }

  const warriorScore = getWarriorScore(turns);
  const remainingTimeBonus = getRemainingTimeBonus(turns, timeBonus);
  const clearBonus = getClearBonus(turns, warriorScore, remainingTimeBonus);
  return {
    clearBonus,
    timeBonus: remainingTimeBonus,
    warrior: warriorScore,
  };
}

export default getLevelScore;
