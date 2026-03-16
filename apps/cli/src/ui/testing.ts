import type { LevelReport, LevelRun } from './types.js';

export const waitForRender = () => new Promise((resolve) => setTimeout(resolve, 50));

/** Returns the last non-empty frame (exit() can write an empty frame after unmount). */
export function getLastContentFrame(frames: string[]): string {
  for (let i = frames.length - 1; i >= 0; i--) {
    if (frames[i]!.trim()) return frames[i]!;
  }
  return '';
}

export function makeLevelRun(overrides: Partial<LevelRun> = {}): LevelRun {
  return {
    turns: [
      [
        {
          message: 'test',
          unit: null,
          floorMap: [[{ character: '@' }]],
          warriorStatus: { health: 20, score: 0 },
        },
      ],
    ],
    initialState: {
      message: '',
      unit: null,
      floorMap: [[{ character: '@' }]],
      warriorStatus: { health: 20, score: 0 },
    },
    warriorName: 'Olric',
    towerName: 'The Narrow Path',
    levelNumber: 1,
    totalScore: 10,
    maxHealth: 20,
    ...overrides,
  };
}

export function makeLevelReport(overrides: Partial<LevelReport> = {}): LevelReport {
  return {
    passed: true,
    levelNumber: 1,
    hasNextLevel: true,
    scoreParts: { warrior: 10, timeBonus: 5, clearBonus: 0 },
    totalScore: 15,
    grade: 0.75,
    isEpic: false,
    previousScore: 0,
    hasClue: false,
    isShowingClue: false,
    ...overrides,
  };
}
