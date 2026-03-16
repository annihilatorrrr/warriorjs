/**
 * Returns the last event of the play.
 *
 * @param turns The turns that happened during the play.
 * @returns The last event.
 */
function getLastEvent(turns: unknown[][]): Record<string, unknown> {
  const lastTurnEvents = turns.at(-1)!;
  return lastTurnEvents.at(-1) as Record<string, unknown>;
}

export default getLastEvent;
