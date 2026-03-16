import type Floor from './Floor.js';
import type Unit from './Unit.js';

export interface LogEvent {
  message: string;
  unit: { name: string; color: string } | null;
  floorMap: { character: string; unit?: { color: string } }[][];
  warriorStatus: { health: number; score: number } | undefined;
}

const Logger: {
  floor: Floor | null;
  events: LogEvent[][];
  lastTurn: LogEvent[] | null;
  initialState: LogEvent | null;
  play(floor: Floor): void;
  turn(): void;
  unit(unit: Unit, message: string): void;
} = {
  floor: null,
  events: [],
  lastTurn: null,
  initialState: null,

  play(floor: Floor) {
    Logger.floor = floor;
    Logger.events = [];
    Logger.lastTurn = null;
    Logger.initialState = {
      message: '',
      unit: null,
      floorMap: JSON.parse(JSON.stringify(floor.getMap())),
      warriorStatus: floor.warrior?.getStatus(),
    };
  },

  turn() {
    Logger.lastTurn = [];
    Logger.events.push(Logger.lastTurn);
  },

  unit(unit: Unit, message: string) {
    Logger.lastTurn?.push({
      message,
      unit: JSON.parse(JSON.stringify(unit)),
      floorMap: JSON.parse(JSON.stringify(Logger.floor?.getMap())),
      warriorStatus: Logger.floor?.warrior?.getStatus(),
    });
  },
};

export default Logger;
