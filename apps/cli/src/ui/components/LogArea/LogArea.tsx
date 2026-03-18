import { Box, Text } from 'ink';
import type React from 'react';
import { useMemo } from 'react';

import { type PlaybackCursor } from '../../hooks/usePlayback.js';
import { type TurnEvent } from '../../types.js';

interface LogAreaProps {
  turns: TurnEvent[][];
  cursor: PlaybackCursor;
  maxLines?: number;
}

interface LogLine {
  type: 'turn' | 'event';
  turnNumber: number;
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
        <Text key={i} bold>
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
  maxLines = 10,
}: LogAreaProps): React.ReactElement {
  const unitColors = useMemo(() => buildUnitColorMap(turns), [turns]);
  const colorizeRegex = useMemo(() => buildColorizeRegex(unitColors), [unitColors]);

  // Build a flat list of lines in chronological order, up to the cursor position.
  const visibleLines = useMemo(() => {
    const lines: LogLine[] = [];

    for (let t = 0; t <= cursor.turn; t++) {
      const turnEvents = turns[t]!;
      const maxEvent = t === cursor.turn ? cursor.event : turnEvents.length - 1;
      const eventsInRange: TurnEvent[] = [];

      for (let e = 0; e <= maxEvent; e++) {
        const event = turnEvents[e]!;
        if (event.message) {
          eventsInRange.push(event);
        }
      }

      if (eventsInRange.length > 0) {
        lines.push({ type: 'turn', turnNumber: t });
        for (const event of eventsInRange) {
          lines.push({ type: 'event', turnNumber: t, event });
        }
      }
    }

    // Truncate from the top (oldest lines scroll off).
    return lines.length > maxLines ? lines.slice(lines.length - maxLines) : lines;
  }, [turns, cursor, maxLines]);

  const lastIndex = visibleLines.length - 1;

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
        const isCurrent = index === lastIndex;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: unique with turnNumber
          <Box key={`e${line.turnNumber}-${index}`} gap={1}>
            <Text dimColor={!isCurrent}>{'>'}</Text>
            <Text bold={isCurrent} dimColor={!isCurrent}>
              {isCurrent ? colorizeMessage(text, unitColors, colorizeRegex) : text}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
