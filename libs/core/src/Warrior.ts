import { type AbilitySpec } from './Ability.js';
import Action from './Action.js';
import Unit from './Unit.js';

class Warrior extends Unit {
  constructor(name: string, character: string, color: string, maxHealth: number) {
    super(name, character, color, maxHealth, null, false);
  }

  performTurn(): void {
    super.performTurn();
    if (!this.turn?.action || this.isBound()) {
      this.log('does nothing');
    }
  }

  earnPoints(points: number): void {
    super.earnPoints(points);
    this.log(`earns ${points} points`);
  }

  losePoints(points: number): void {
    super.losePoints(points);
    this.log(`loses ${points} points`);
  }

  getAbilities(): AbilitySpec[] {
    return [...this.abilities]
      .map(([name, ability]) => ({
        name,
        description: ability.description,
        meta: ability.meta,
        isAction: ability instanceof Action,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getStatus(): { health: number; score: number } {
    return {
      health: this.health,
      score: this.score,
    };
  }
}

export default Warrior;
