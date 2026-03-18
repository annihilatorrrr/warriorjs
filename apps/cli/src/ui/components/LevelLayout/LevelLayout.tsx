import { Box } from 'ink';
import type React from 'react';

import { type TurnEvent } from '../../types.js';
import Divider from '../Divider/index.js';
import FloorMap from '../FloorMap/index.js';
import Header from '../Header/index.js';

interface LevelLayoutProps {
  turns: TurnEvent[][];
  warriorName: string;
  towerName: string;
  levelNumber: number;
  totalScore: number;
  children: React.ReactNode;
}

export default function LevelLayout({
  turns,
  warriorName,
  towerName,
  levelNumber,
  totalScore,
  children,
}: LevelLayoutProps): React.ReactElement {
  const lastTurnEvents = turns[turns.length - 1];
  const lastEvent = lastTurnEvents?.[lastTurnEvents.length - 1];

  return (
    <Box flexDirection="column" width="100%">
      <Header
        warriorName={warriorName}
        towerName={towerName}
        levelNumber={levelNumber}
        score={totalScore}
      />
      <Box flexDirection="column">{lastEvent && <FloorMap floorMap={lastEvent.floorMap} />}</Box>
      <Divider />
      {children}
    </Box>
  );
}
