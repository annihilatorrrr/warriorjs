import getLastEvent from './getLastEvent.js';

/**
 * Returns the score of the warrior.
 *
 * @param turns The turns that happened during the play.
 * @returns The score of the warrior.
 */
function getWarriorScore(turns: unknown[][]): number {
  const lastEvent = getLastEvent(turns);
  return (lastEvent as { warriorStatus: { score: number } }).warriorStatus.score;
}

export default getWarriorScore;
