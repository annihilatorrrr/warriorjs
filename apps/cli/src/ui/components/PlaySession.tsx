import { useApp } from 'ink';
import type React from 'react';
import { useEffect } from 'react';

import { type GameContext } from '../../Game.js';
import type Profile from '../../Profile.js';
import { usePlaySession } from '../hooks/usePlaySession.js';
import ErrorMessage from './ErrorMessage.js';
import LevelCompleteScreen from './LevelCompleteScreen.js';
import PlayScreen from './PlayScreen.js';
import TowerCompleteScreen from './TowerCompleteScreen.js';

interface PlaySessionProps {
  context: GameContext;
  profile: Profile;
  initialLevel: number;
}

export default function PlaySession({
  context,
  profile,
  initialLevel,
}: PlaySessionProps): React.ReactElement | null {
  const { exit } = useApp();
  const { state, handlePlayComplete, handleLevelCompleteChoice } = usePlaySession({
    context,
    profile,
    initialLevel,
    exit,
  });

  // Exit when a terminal level-complete action is selected.
  useEffect(() => {
    if (state?.type === 'levelComplete' && state.action.type !== 'prompt') {
      exit();
    }
  }, [state, exit]);

  if (!state) return null;

  switch (state.type) {
    case 'playing':
      return (
        <PlayScreen
          {...state.levelRun}
          reviewMode={state.reviewMode}
          onPlaybackComplete={handlePlayComplete}
        />
      );
    case 'levelComplete':
      return (
        <LevelCompleteScreen
          levelReport={state.levelReport}
          levelRun={state.levelRun}
          action={state.action}
          onSelect={handleLevelCompleteChoice}
        />
      );
    case 'towerComplete':
      return (
        <TowerCompleteScreen
          averageGrade={profile.calculateAverageGrade() ?? 0}
          levelGrades={profile.currentEpicGrades as Record<string, number>}
        />
      );
    case 'error':
      return <ErrorMessage message={state.message} />;
  }
}
