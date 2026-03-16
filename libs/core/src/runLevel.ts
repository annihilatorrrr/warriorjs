import type { LogEvent } from './Logger.js';
import loadLevel from './loadLevel.js';
import type { LevelConfig } from './types.js';

function runLevel(
  levelConfig: LevelConfig,
  playerCode: string,
  language: 'javascript' | 'typescript' = 'javascript',
): { passed: boolean; events: LogEvent[][]; initialState: LogEvent | null } {
  const level = loadLevel(levelConfig, playerCode, language);
  return level.play();
}

export default runLevel;
