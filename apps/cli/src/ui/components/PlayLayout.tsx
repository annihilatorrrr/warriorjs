import { Box } from 'ink';
import type React from 'react';

import { type TurnEvent } from '../types.js';
import Divider from './Divider.js';
import FloorMap from './FloorMap.js';
import Header from './Header.js';

interface PlayLayoutProps {
  turns: TurnEvent[][];
  warriorName: string;
  towerName: string;
  levelNumber: number;
  totalScore: number;
  children: React.ReactNode;
}

export default function PlayLayout({
  turns,
  warriorName,
  towerName,
  levelNumber,
  totalScore,
  children,
}: PlayLayoutProps): React.ReactElement {
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
