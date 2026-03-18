import path from 'node:path';
import { Text } from 'ink';
import Link from 'ink-link';
import type React from 'react';
import { useMemo } from 'react';

import {
  type LevelCompleteAction,
  type LevelCompleteChoice,
  type LevelReport,
  type LevelRun,
} from '../types.js';
import Divider from './Divider.js';
import PlayLayout from './PlayLayout.js';
import ResultScreen from './ResultScreen.js';
import SelectPrompt from './SelectPrompt.js';

function buildMenuItems(levelReport: LevelReport): { label: string; value: LevelCompleteChoice }[] {
  if (levelReport.passed) {
    return [
      levelReport.hasNextLevel
        ? { label: 'Next level', value: 'next-level' }
        : { label: 'Enter epic mode', value: 'epic-mode' },
      { label: 'Review turns', value: 'review' },
      { label: 'Stay and hone', value: 'stay' },
    ];
  }

  return [
    { label: 'Try again', value: 'try-again' },
    { label: 'Review turns', value: 'review' },
    ...(levelReport.hasClue && !levelReport.isShowingClue
      ? [{ label: 'Reveal clues', value: 'clue' as const }]
      : []),
  ];
}

interface LevelCompleteScreenProps {
  levelReport: LevelReport;
  levelRun: LevelRun;
  action: LevelCompleteAction;
  onSelect: (value: LevelCompleteChoice) => void;
}

export default function LevelCompleteScreen({
  levelReport,
  levelRun,
  action,
  onSelect,
}: LevelCompleteScreenProps): React.ReactElement {
  const menuItems = useMemo(() => buildMenuItems(levelReport), [levelReport]);

  return (
    <PlayLayout
      turns={levelRun.turns}
      warriorName={levelRun.warriorName}
      towerName={levelRun.towerName}
      levelNumber={levelRun.levelNumber}
      totalScore={levelRun.totalScore}
    >
      <ResultScreen {...levelReport} />
      <Divider />
      {action.type === 'prompt' && (
        <SelectPrompt message="" items={menuItems} onSelect={onSelect} />
      )}
      {action.type === 'next-level' && (
        <Text bold>
          {'See '}
          <Link url={`file://${path.resolve(action.readmePath)}`} fallback={false}>
            {action.readmePath}
          </Link>
          {' for instructions.'}
        </Text>
      )}
      {action.type === 'clue' && (
        <Text bold>
          {'See '}
          <Link url={`file://${path.resolve(action.readmePath)}`} fallback={false}>
            {action.readmePath}
          </Link>
          {' for the clues.'}
        </Text>
      )}
      {action.type === 'stay' && (
        <Text bold>You stayed on the current level. Aim for more points next time.</Text>
      )}
      {action.type === 'epic-mode' && <Text bold>Run warriorjs again to play epic mode.</Text>}
    </PlayLayout>
  );
}
