import { Box, Text } from 'ink';
import type React from 'react';
import { useMemo } from 'react';

import { type PlaybackCursor } from '../../hooks/usePlayback.js';
import { type TurnEvent } from '../../types.js';

interface LogAreaProps {
  turns: TurnEvent[][];
  cursor: PlaybackCursor;
  mode: 'playback' | 'review';
  maxLines?: number;
}

interface LogLine {
  type: 'turn' | 'event';
  turnNumber: number;
  eventIndex?: number;
  event?: TurnEvent;
}

function buildUnitColorMap(turns: TurnEvent[][]): Map<string, string> {
  const map = new Map<string, string>();
  for (const turn of turns) {
    for (const event of turn) {
      if (event.unit) {
        map.set(event.unit.name, event.unit.color);
      }
    }
  }
  return map;
}

const STAT_RE = /\d+ damage|\d+ HP/;

function buildColorizeRegex(unitColors: Map<string, string>): RegExp {
  const unitNames = Array.from(unitColors.keys()).map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  const alternatives = [STAT_RE.source, ...unitNames];
  return new RegExp(`(${alternatives.join('|')})`);
}

function colorizeMessage(
  message: string,
  unitColors: Map<string, string>,
  regex: RegExp,
  boldStats = true,
): React.ReactNode[] {
  const parts = message.split(regex);

  return parts.map((part, i) => {
    const unitColor = unitColors.get(part);
    if (unitColor) {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: split parts are positional
        <Text key={i} color={unitColor}>
          {part}
        </Text>
      );
    }
    if (STAT_RE.test(part)) {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: split parts are positional
        <Text key={i} bold={boldStats}>
          {part}
        </Text>
      );
    }
    // biome-ignore lint/suspicious/noArrayIndexKey: split parts are positional
    return <Text key={i}>{part}</Text>;
  });
}

export default function LogArea({
  turns,
  cursor,
  mode,
  maxLines = 10,
}: LogAreaProps): React.ReactElement {
  const unitColors = useMemo(() => buildUnitColorMap(turns), [turns]);
  const colorizeRegex = useMemo(() => buildColorizeRegex(unitColors), [unitColors]);

  const isReview = mode === 'review';

  // Build a flat list of log lines and determine which are visible.
  const { visibleLines, focusedIndex } = useMemo(() => {
    const lines: LogLine[] = [];
    const lastTurn = isReview ? turns.length - 1 : cursor.turn;

    for (let t = 0; t <= lastTurn; t++) {
      const turnEvents = turns[t]!;
      const maxEvent = !isReview && t === cursor.turn ? cursor.event : turnEvents.length - 1;
      const eventsInRange: { event: TurnEvent; eventIndex: number }[] = [];

      for (let e = 0; e <= maxEvent; e++) {
        const event = turnEvents[e]!;
        if (event.message) {
          eventsInRange.push({ event, eventIndex: e });
        }
      }

      if (eventsInRange.length > 0) {
        lines.push({ type: 'turn', turnNumber: t });
        for (const { event, eventIndex } of eventsInRange) {
          lines.push({ type: 'event', turnNumber: t, eventIndex, event });
        }
      }
    }

    // In playback mode, the focused line is always the last one.
    // In review mode, find the line matching the cursor. If not found (e.g. turn 0
    // initial state with no message), focused stays -1 so nothing is highlighted.
    let focused = lines.length - 1;
    if (isReview) {
      focused = lines.findIndex(
        (l) => l.type === 'event' && l.turnNumber === cursor.turn && l.eventIndex === cursor.event,
      );
    }

    // Window the visible lines.
    let visible: LogLine[];
    if (lines.length <= maxLines) {
      visible = lines;
    } else if (isReview) {
      // Center the focused line in the window.
      const half = Math.floor(maxLines / 2);
      let start = focused - half;
      if (start < 0) start = 0;
      if (start + maxLines > lines.length) start = lines.length - maxLines;
      visible = lines.slice(start, start + maxLines);
      focused = focused - start;
    } else {
      // Playback: newest lines at the bottom, oldest scroll off.
      const start = lines.length - maxLines;
      visible = lines.slice(start);
      focused = focused - start;
    }

    return { visibleLines: visible, focusedIndex: focused };
  }, [turns, cursor, maxLines, isReview]);

  return (
    <Box flexDirection="column">
      {visibleLines.map((line, index) => {
        if (line.type === 'turn') {
          return (
            <Text key={`t${line.turnNumber}`} dimColor>
              {`Turn ${line.turnNumber}`}
            </Text>
          );
        }
        const event = line.event!;
        const text = event.unit ? `${event.unit.name} ${event.message}` : event.message;
        const isCurrent = index === focusedIndex;
        const dim = isReview && !isCurrent;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: unique with turnNumber
          <Box key={`e${line.turnNumber}-${index}`} gap={1}>
            <Text dimColor>{'>'}</Text>
            <Text bold={isReview && isCurrent} dimColor={dim}>
              {colorizeMessage(text, unitColors, colorizeRegex, !dim)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
