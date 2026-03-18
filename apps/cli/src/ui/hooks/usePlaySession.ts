import { getLevelConfig, runLevel } from '@warriorjs/core';
import { useCallback, useRef, useState } from 'react';

import { type GameContext } from '../../Game.js';
import type Profile from '../../Profile.js';
import {
  type LevelCompleteChoice,
  type LevelConfig,
  type LevelEvaluation,
  type LevelReport,
  type LevelResult,
  type LevelRun,
  type PlaySessionState,
} from '../types.js';
import { buildLevelReport } from '../utils/buildLevelReport.js';

interface UsePlaySessionParams {
  context: GameContext;
  profile: Profile;
  initialLevel: number;
  exit: () => void;
}

interface UsePlaySessionReturn {
  state: PlaySessionState;
  handlePlayComplete: () => void;
  handleLevelCompleteChoice: (value: LevelCompleteChoice) => void;
}

interface LevelOutcome {
  state: PlaySessionState;
  evaluation: LevelEvaluation | null;
  currentReport: { levelReport: LevelReport; levelRun: LevelRun } | null;
}

function executeLevel(profile: Profile, levelNumber: number, context: GameContext): LevelOutcome {
  try {
    const { tower, warriorName, epic } = profile;
    const levelConfig = getLevelConfig(tower, levelNumber, warriorName, epic);
    if (!levelConfig) {
      return {
        state: { type: 'error', message: `Level ${levelNumber} not found.` },
        evaluation: null,
        currentReport: null,
      };
    }
    const playerCode = profile.readPlayerCode();
    if (!playerCode) {
      return {
        state: { type: 'error', message: 'No player code found. Check your profile directory.' },
        evaluation: null,
        currentReport: null,
      };
    }
    const language = profile.language || 'javascript';
    const rawResult = runLevel(levelConfig, playerCode, language);
    if (!rawResult.initialState) {
      return {
        state: { type: 'error', message: 'Level produced no initial state.' },
        evaluation: null,
        currentReport: null,
      };
    }
    const levelResult: LevelResult = {
      passed: rawResult.passed,
      turns: rawResult.turns as LevelResult['turns'],
      initialState: rawResult.initialState as LevelResult['initialState'],
    };

    const levelRun: LevelRun = {
      turns: levelResult.turns,
      initialState: levelResult.initialState,
      warriorName,
      towerName: tower.name,
      levelNumber,
      totalScore: profile.isEpic() ? profile.currentEpicScore : profile.score,
      maxHealth: levelConfig.floor.warrior.maxHealth,
    };

    if (context.silencePlay) {
      return evaluateLevel(profile, levelNumber, levelResult, levelConfig, levelRun, context);
    }

    return {
      state: { type: 'playing', levelRun },
      evaluation: { profile, levelNumber, levelResult, levelConfig, levelRun },
      currentReport: null,
    };
  } catch (err: unknown) {
    return {
      state: { type: 'error', message: err instanceof Error ? err.message : String(err) },
      evaluation: null,
      currentReport: null,
    };
  }
}

function evaluateLevel(
  profile: Profile,
  levelNumber: number,
  levelResult: LevelResult,
  levelConfig: LevelConfig,
  levelRun: LevelRun,
  context: GameContext,
): LevelOutcome {
  const levelReport = buildLevelReport({
    levelResult,
    levelConfig,
    levelNumber,
    hasNextLevel: profile.tower.hasLevel(levelNumber + 1),
    isEpic: profile.isEpic(),
    currentScore: profile.isEpic() ? profile.currentEpicScore : profile.score,
    isShowingClue: levelResult.passed ? false : profile.isShowingClue(),
  });

  if (levelReport.passed) {
    profile.tallyPoints(levelNumber, levelReport.totalScore, levelReport.grade);
  }

  // Epic auto-advance: skip result screen and play next level.
  if (
    levelReport.passed &&
    levelReport.isEpic &&
    levelReport.hasNextLevel &&
    !context.practiceLevel
  ) {
    return executeLevel(profile, levelNumber + 1, context);
  }

  // Epic tower complete: update score and show tower-complete screen.
  if (
    levelReport.passed &&
    levelReport.isEpic &&
    !levelReport.hasNextLevel &&
    !context.practiceLevel
  ) {
    profile.updateEpicScore();
    return {
      state: { type: 'towerComplete' },
      evaluation: null,
      currentReport: null,
    };
  }

  return {
    state: { type: 'levelComplete', levelRun, levelReport, action: { type: 'prompt' } },
    evaluation: null,
    currentReport: { levelReport, levelRun },
  };
}

export function usePlaySession({
  context,
  profile,
  initialLevel,
  exit,
}: UsePlaySessionParams): UsePlaySessionReturn {
  const evaluationRef = useRef<LevelEvaluation | null>(null);
  const reviewReturnRef = useRef<{ levelReport: LevelReport; levelRun: LevelRun } | null>(null);
  const currentReportRef = useRef<{ levelReport: LevelReport; levelRun: LevelRun } | null>(null);

  const [state, setState] = useState<PlaySessionState>(() => {
    const outcome = executeLevel(profile, initialLevel, context);
    evaluationRef.current = outcome.evaluation;
    if (outcome.currentReport) {
      currentReportRef.current = outcome.currentReport;
    }
    return outcome.state;
  });

  const playLevel = useCallback(
    (levelNumber: number) => {
      const outcome = executeLevel(profile, levelNumber, context);
      evaluationRef.current = outcome.evaluation;
      if (outcome.currentReport) {
        currentReportRef.current = outcome.currentReport;
      }
      setState(outcome.state);
    },
    [profile, context],
  );

  const handlePlayComplete = useCallback(() => {
    const pending = evaluationRef.current;
    if (pending) {
      const outcome = evaluateLevel(
        profile,
        pending.levelNumber,
        pending.levelResult,
        pending.levelConfig,
        pending.levelRun,
        context,
      );
      evaluationRef.current = outcome.evaluation;
      if (outcome.currentReport) {
        currentReportRef.current = outcome.currentReport;
      }
      setState(outcome.state);
    } else if (reviewReturnRef.current) {
      const { levelReport, levelRun } = reviewReturnRef.current;
      reviewReturnRef.current = null;
      setState({ type: 'levelComplete', levelReport, levelRun, action: { type: 'prompt' } });
    } else {
      exit();
    }
  }, [profile, context, exit]);

  const handleLevelCompleteChoice = useCallback(
    (value: LevelCompleteChoice) => {
      const current = currentReportRef.current;
      if (!current) {
        return;
      }

      const { levelReport, levelRun } = current;

      switch (value) {
        case 'review':
          reviewReturnRef.current = { levelReport, levelRun };
          setState({ type: 'playing', levelRun, reviewMode: true });
          evaluationRef.current = null;
          break;
        case 'stay':
          setState({
            type: 'levelComplete',
            levelReport,
            levelRun,
            action: { type: 'stay' },
          });
          break;
        case 'next-level':
          context.onPrepareNextLevel();
          setState({
            type: 'levelComplete',
            levelReport,
            levelRun,
            action: {
              type: 'next-level',
              readmePath: profile.getReadmeFilePath(),
            },
          });
          break;
        case 'epic-mode':
          context.onPrepareEpicMode();
          setState({
            type: 'levelComplete',
            levelReport,
            levelRun,
            action: { type: 'epic-mode' },
          });
          break;
        case 'clue':
          profile.requestClue();
          context.onGenerateProfileFiles();
          setState({
            type: 'levelComplete',
            levelReport,
            levelRun,
            action: {
              type: 'clue',
              readmePath: profile.getReadmeFilePath(),
            },
          });
          break;
        case 'try-again':
          playLevel(levelReport.levelNumber);
          break;
      }
    },
    [profile, context, playLevel],
  );

  return { state, handlePlayComplete, handleLevelCompleteChoice };
}
