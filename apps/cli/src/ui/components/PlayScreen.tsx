import { Box } from 'ink';
import type React from 'react';
import { useMemo } from 'react';

import { usePlayback } from '../hooks/usePlayback.js';
import type { PlayEvent } from '../types.js';
import Divider from './Divider.js';
import FloorMap from './FloorMap.js';
import Header from './Header.js';
import LogArea from './LogArea.js';
import Scrubber from './Scrubber.js';
import WarriorStatus from './WarriorStatus.js';

interface PlayScreenProps {
  events: PlayEvent[][];
  initialState: PlayEvent;
  warriorName: string;
  towerName: string;
  levelNumber: number;
  totalScore: number;
  maxHealth: number;
  reviewMode?: boolean;
  onPlaybackComplete: () => void;
}

export default function PlayScreen({
  events,
  initialState,
  warriorName,
  towerName,
  levelNumber,
  totalScore,
  maxHealth,
  reviewMode,
  onPlaybackComplete,
}: PlayScreenProps): React.ReactElement {
  const eventsWithInitial = useMemo(() => [[initialState], ...events], [initialState, events]);
  const { state } = usePlayback(eventsWithInitial.length, onPlaybackComplete, reviewMode);
  const currentTurnEvents = eventsWithInitial[state.currentTurn];
  const lastEvent = currentTurnEvents?.[currentTurnEvents.length - 1];

  return (
    <Box flexDirection="column" width="100%">
      <Header
        warriorName={warriorName}
        towerName={towerName}
        levelNumber={levelNumber}
        score={totalScore}
      />
      <Box flexDirection="column">
        {lastEvent && (
          <>
            <FloorMap floorMap={lastEvent.floorMap} />
            <WarriorStatus
              health={lastEvent.warriorStatus.health}
              maxHealth={maxHealth}
              score={lastEvent.warriorStatus.score}
            />
          </>
        )}
      </Box>
      <Divider />
      <Box flexDirection="column" height={10}>
        <LogArea events={eventsWithInitial} currentTurn={state.currentTurn} />
      </Box>
      <Divider />
      <Scrubber
        currentTurn={state.currentTurn}
        totalTurns={eventsWithInitial.length}
        speed={state.speed}
        mode={state.mode}
        isPlaying={state.isPlaying}
      />
    </Box>
  );
}
