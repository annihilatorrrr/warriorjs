import { Box, Text } from 'ink';
import type React from 'react';
import { useMemo } from 'react';

import type { PlayEvent } from '../types.js';

interface LogAreaProps {
  events: PlayEvent[][];
  currentTurn: number;
  maxLines?: number;
}

interface LogLine {
  type: 'turn' | 'event';
  turnNumber: number;
  event?: PlayEvent;
}

function buildUnitColorMap(events: PlayEvent[][]): Map<string, string> {
  const map = new Map<string, string>();
  for (const turn of events) {
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
  events,
  currentTurn,
  maxLines = 10,
}: LogAreaProps): React.ReactElement {
  const unitColors = useMemo(() => buildUnitColorMap(events), [events]);
  const colorizeRegex = useMemo(() => buildColorizeRegex(unitColors), [unitColors]);

  // Build a flat list of lines (turn headers + events), newest first.
  const visibleLines = useMemo(() => {
    const lines: LogLine[] = [];
    const visibleTurns = events.slice(0, currentTurn + 1);

    for (let i = visibleTurns.length - 1; i >= 0; i--) {
      const turnEvents = visibleTurns[i]!;
      const hasMessages = turnEvents.some((e) => e.message);
      if (!hasMessages) continue;
      const turnNumber = i;
      lines.push({ type: 'turn', turnNumber });
      for (const event of turnEvents) {
        if (event.message) {
          lines.push({ type: 'event', turnNumber, event });
        }
      }
    }

    return lines.slice(0, maxLines);
  }, [events, currentTurn, maxLines]);

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
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: unique with turnNumber
          <Box key={`e${line.turnNumber}-${index}`} gap={1}>
            <Text dimColor>{'>'}</Text>
            <Text>{colorizeMessage(text, unitColors, colorizeRegex)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
