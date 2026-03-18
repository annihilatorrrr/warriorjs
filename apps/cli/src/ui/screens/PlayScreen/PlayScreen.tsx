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
import { type LevelContext, type LevelReplay } from '../../types.js';

interface PlayScreenProps {
  replay: LevelReplay;
  context: LevelContext;
  reviewMode?: boolean;
  onPlaybackComplete: () => void;
}

export default function PlayScreen({
  replay,
  context,
  reviewMode,
  onPlaybackComplete,
}: PlayScreenProps): React.ReactElement {
  const turnsWithInitial = useMemo(
    () => [[replay.initialState], ...replay.turns],
    [replay.initialState, replay.turns],
  );
  const { state } = usePlayback(turnsWithInitial.length, onPlaybackComplete, reviewMode);
  const currentTurnEvents = turnsWithInitial[state.currentTurn];
  const lastEvent = currentTurnEvents?.[currentTurnEvents.length - 1];

  return (
    <Box flexDirection="column" width="100%">
      <Header
        warriorName={context.warriorName}
        towerName={context.towerName}
        levelNumber={context.levelNumber}
        score={context.totalScore}
      />
      <Box flexDirection="column">
        {lastEvent && (
          <>
            <FloorMap floorMap={lastEvent.floorMap} />
            {lastEvent.warriorStatus && (
              <WarriorStatus
                health={lastEvent.warriorStatus.health}
                maxHealth={context.maxHealth}
                score={lastEvent.warriorStatus.score}
              />
            )}
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
