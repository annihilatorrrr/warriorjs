import { type GameAction } from '@warriorjs/core';

interface UnitRef {
  type: 'unit';
  name: string;
}

function isUnitRef(value: unknown): value is UnitRef {
  return typeof value === 'object' && value !== null && (value as UnitRef).type === 'unit';
}

function interpolateAction(action: GameAction): string {
  return action.description.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = action.params[key];
    if (value === undefined) return match;
    if (isUnitRef(value)) return value.name;
    return String(value);
  });
}

export default interpolateAction;
