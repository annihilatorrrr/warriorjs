import type Profile from '../Profile.js';

// UI-specific narrowings of @warriorjs/core types.
// These pick only the fields the UI layer needs, keeping a clean boundary
// between core engine types and rendering concerns.

export interface LevelConfig {
  clue?: string;
  timeBonus?: number;
  aceScore?: number;
  floor: { warrior: { maxHealth: number } };
}

export interface PlayEvent {
  message: string;
  unit: { name: string; color: string } | null;
  floorMap: { character: string; unit?: { color: string } }[][];
  warriorStatus: { health: number; score: number };
}

export interface LevelResult {
  passed: boolean;
  events: PlayEvent[][];
  initialState: PlayEvent;
}

export interface LevelRun {
  events: PlayEvent[][];
  initialState: PlayEvent;
  warriorName: string;
  towerName: string;
  levelNumber: number;
  totalScore: number;
  maxHealth: number;
}

export interface LevelReport {
  passed: boolean;
  levelNumber: number;
  hasNextLevel: boolean;
  scoreParts: { warrior: number; timeBonus: number; clearBonus: number };
  totalScore: number;
  grade: number;
  isEpic: boolean;
  previousScore: number;
  hasClue: boolean;
  isShowingClue: boolean;
}

export interface LevelEvaluation {
  profile: Profile;
  levelNumber: number;
  levelResult: LevelResult;
  levelConfig: LevelConfig;
  levelRun: LevelRun;
}

export type LevelCompleteChoice =
  | 'review'
  | 'stay'
  | 'next-level'
  | 'epic-mode'
  | 'clue'
  | 'try-again';

export type LevelCompleteAction =
  | { type: 'prompt' }
  | { type: 'stay' }
  | { type: 'next-level'; readmePath: string }
  | { type: 'epic-mode' }
  | { type: 'clue'; readmePath: string };

export type PlaySessionState =
  | { type: 'playing'; levelRun: LevelRun; reviewMode?: boolean }
  | {
      type: 'levelComplete';
      levelReport: LevelReport;
      levelRun: LevelRun;
      action: LevelCompleteAction;
    }
  | { type: 'towerComplete' }
  | { type: 'error'; message: string };

export type GameMenuStep =
  | { type: 'start' }
  | { type: 'wizard'; initialStep: 'new' | 'choose-profile' };
