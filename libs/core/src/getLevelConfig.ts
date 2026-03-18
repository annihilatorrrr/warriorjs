import { type LevelConfig, type TowerDefinition } from './types.js';

/**
 * Returns the config for the level with the given number.
 *
 * @param tower The tower.
 * @param levelNumber The number of the level.
 * @param warriorName The name of the warrior.
 * @param epic Whether the level is to be used in epic mode or not.
 *
 * @returns The level config.
 */
function getLevelConfig(
  tower: TowerDefinition,
  levelNumber: number,
  warriorName: string,
  epic: boolean,
): LevelConfig | null {
  const level = tower.levels[levelNumber - 1];
  if (!level) {
    return null;
  }

  const levels = epic ? tower.levels : tower.levels.slice(0, levelNumber);
  const warriorAbilities = Object.assign(
    {},
    ...levels.map(
      ({
        floor: {
          warrior: { abilities },
        },
      }) => abilities || {},
    ),
  );

  return {
    number: levelNumber,
    description: level.description,
    tip: level.tip,
    clue: level.clue ?? '',
    timeBonus: level.timeBonus,
    aceScore: level.aceScore,
    floor: {
      size: structuredClone(level.floor.size),
      stairs: structuredClone(level.floor.stairs),
      warrior: {
        ...structuredClone(tower.warrior),
        ...structuredClone(level.floor.warrior),
        name: warriorName,
        abilities: warriorAbilities,
      },
      units: level.floor.units ? structuredClone(level.floor.units) : undefined,
    },
  };
}

export default getLevelConfig;
