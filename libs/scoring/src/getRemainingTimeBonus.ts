import getTurnCount from './getTurnCount.js';

/**
 * Returns the remaining time bonus.
 *
 * @param turns The turns that happened during the play.
 * @param timeBonus The initial time bonus.
 * @returns The time bonus.
 */
function getRemainingTimeBonus(turns: unknown[][], timeBonus: number): number {
  const turnCount = getTurnCount(turns);
  const remainingTimeBonus = timeBonus - turnCount;
  return Math.max(remainingTimeBonus, 0);
}

export default getRemainingTimeBonus;
