import { Box } from 'ink';
import type React from 'react';
import { useMemo } from 'react';

import Divider from '../../components/Divider/index.js';
import FloorMap from '../../components/FloorMap/index.js';
import Header from '../../components/Header/index.js';
import LogArea from '../../components/LogArea/index.js';
import Scrubber from '../../components/Scrubber/index.js';
import WarriorStatus from '../../components/WarriorStatus/index.js';
import { usePlayback } from '../../hooks/usePlayback.js';
import { type TurnEvent } from '../../types.js';

interface PlayScreenProps {
  turns: TurnEvent[][];
  initialState: TurnEvent;
  warriorName: string;
  towerName: string;
  levelNumber: number;
  totalScore: number;
  maxHealth: number;
  reviewMode?: boolean;
  onPlaybackComplete: () => void;
}

export default function PlayScreen({
  turns,
  initialState,
  warriorName,
  towerName,
  levelNumber,
  totalScore,
  maxHealth,
  reviewMode,
  onPlaybackComplete,
}: PlayScreenProps): React.ReactElement {
  const turnsWithInitial = useMemo(() => [[initialState], ...turns], [initialState, turns]);
  const { state } = usePlayback(turnsWithInitial.length, onPlaybackComplete, reviewMode);
  const currentTurnEvents = turnsWithInitial[state.currentTurn];
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
        <LogArea turns={turnsWithInitial} currentTurn={state.currentTurn} />
      </Box>
      <Divider />
      <Scrubber
        currentTurn={state.currentTurn}
        totalTurns={turnsWithInitial.length}
        speed={state.speed}
        mode={state.mode}
        isPlaying={state.isPlaying}
      />
    </Box>
  );
}
