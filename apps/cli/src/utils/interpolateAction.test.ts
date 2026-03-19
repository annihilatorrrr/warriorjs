import { describe, expect, test } from 'vitest';

import interpolateAction from './interpolateAction.js';

describe('interpolateAction', () => {
  test('returns description as-is when no placeholders', () => {
    expect(interpolateAction({ type: 'walk', description: 'walks forward', params: {} })).toBe(
      'walks forward',
    );
  });

  test('interpolates string param', () => {
    expect(
      interpolateAction({
        type: 'walk',
        description: 'walks {direction}',
        params: { direction: 'backward' },
      }),
    ).toBe('walks backward');
  });

  test('interpolates numeric param', () => {
    expect(
      interpolateAction({
        type: 'attack',
        description: 'takes {amount} damage',
        params: { amount: 5 },
      }),
    ).toBe('takes 5 damage');
  });

  test('interpolates unit ref param by name', () => {
    expect(
      interpolateAction({
        type: 'attack',
        description: 'attacks {target}',
        params: { target: { type: 'unit', name: 'Sludge' } },
      }),
    ).toBe('attacks Sludge');
  });

  test('leaves placeholder when param is missing', () => {
    expect(
      interpolateAction({
        type: 'attack',
        description: 'attacks {target}',
        params: {},
      }),
    ).toBe('attacks {target}');
  });

  test('interpolates multiple placeholders', () => {
    expect(
      interpolateAction({
        type: 'attack',
        description: 'attacks {target} for {amount} damage',
        params: { target: { type: 'unit', name: 'Archer' }, amount: 3 },
      }),
    ).toBe('attacks Archer for 3 damage');
  });
});
