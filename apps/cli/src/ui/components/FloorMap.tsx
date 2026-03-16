import { Box, Text } from 'ink';
import type React from 'react';

interface FloorSpace {
  character: string;
  unit?: { color: string };
}

interface FloorMapProps {
  floorMap: FloorSpace[][];
}

const STAIR_CHAR = '>';

function getSpaceColor(space: FloorSpace): string | undefined {
  if (space.unit) return space.unit.color;
  if (space.character === STAIR_CHAR) return 'yellow';
  if (space.character !== ' ') return 'gray';
  return undefined;
}

export default function FloorMap({ floorMap }: FloorMapProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginX={1} marginY={1}>
      {floorMap.map((row, rowIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static grid
        <Box key={rowIndex}>
          {row.map((space, colIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static grid
            <Text key={colIndex} color={getSpaceColor(space)}>
              {space.character}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}
