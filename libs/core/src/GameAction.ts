export interface UnitRef {
  type: 'unit';
  name: string;
}

export interface GameAction {
  type: string;
  description: string;
  params: Record<string, unknown>;
}
