import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { getLevelConfig } from '@warriorjs/core';
import { globbySync } from 'globby';

import GameError from './GameError.js';
import loadTowers from './loadTowers.js';
import Profile from './Profile.js';
import ProfileGenerator from './ProfileGenerator.js';
import type Tower from './Tower.js';

const require = createRequire(import.meta.url);
const { version: cliVersion } = require('../package.json');

const gameDirectory = 'warriorjs';

export interface GameContext {
  version: string;
  runDirectoryPath: string;
  practiceLevel: number | undefined;
  silencePlay: boolean;
  towers: Tower[];
  profile: Profile | null;
  profiles: Profile[];
  needsProfileSetup: boolean;
  error?: string;
  onCreateProfile: (
    warriorName: string,
    language: 'javascript' | 'typescript',
    tower: Tower,
  ) => Profile;
  onIsExistingProfile: (profile: Profile) => boolean;
  onPrepareNextLevel: () => void;
  onPrepareEpicMode: () => void;
  onGenerateProfileFiles: () => void;
  onProfileSelected: (profile: Profile) => void;
}

class Game {
  runDirectoryPath: string;
  practiceLevel: number | undefined;
  silencePlay: boolean;
  gameDirectoryPath: string;
  towers: Tower[] = [];
  profile: Profile | null = null;

  constructor(runDirectoryPath: string, practiceLevel: number | undefined, silencePlay: boolean) {
    this.runDirectoryPath = runDirectoryPath;
    this.practiceLevel = practiceLevel;
    this.silencePlay = silencePlay;
    this.gameDirectoryPath = path.join(this.runDirectoryPath, gameDirectory);
  }

  buildContext(): GameContext {
    let error: string | undefined;

    try {
      this.towers = loadTowers();
    } catch (err: any) {
      error =
        err instanceof GameError || err.code === 'InvalidPlayerCode' ? err.message : String(err);
    }

    let profiles: Profile[] = [];
    let needsProfileSetup = false;

    if (!error) {
      this.profile = Profile.load(this.runDirectoryPath, this.towers);
      if (!this.profile) {
        try {
          profiles = this.getProfiles();
          needsProfileSetup = true;
        } catch (err: any) {
          error = err instanceof GameError ? err.message : String(err);
        }
      }
    }

    return {
      version: `v${cliVersion}`,
      runDirectoryPath: this.runDirectoryPath,
      practiceLevel: this.practiceLevel,
      silencePlay: this.silencePlay,
      towers: this.towers,
      profile: this.profile,
      profiles,
      needsProfileSetup,
      error,
      onCreateProfile: (warriorName, language, tower) =>
        this.createProfile(warriorName, language, tower),
      onIsExistingProfile: (profile) => this.isExistingProfile(profile),
      onPrepareNextLevel: () => this.prepareNextLevel(),
      onPrepareEpicMode: () => this.prepareEpicMode(),
      onGenerateProfileFiles: () => this.generateProfileFiles(),
      onProfileSelected: (profile) => {
        this.profile = profile;
      },
    };
  }

  createProfile(warriorName: string, language: 'javascript' | 'typescript', tower: Tower): Profile {
    const profileDirectoryPath = path.join(
      this.gameDirectoryPath,
      `${warriorName}-${tower.id}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    );
    return new Profile(warriorName, tower, profileDirectoryPath, language);
  }

  isExistingProfile(profile: Profile): boolean {
    const profileDirectoriesPaths = this.getProfileDirectoriesPaths();
    return profileDirectoriesPaths.some(
      (profileDirectoryPath) => profileDirectoryPath === profile.directoryPath,
    );
  }

  getProfiles(): Profile[] {
    const profileDirectoriesPaths = this.getProfileDirectoriesPaths();
    return profileDirectoriesPaths
      .map((profileDirectoryPath) => Profile.load(profileDirectoryPath, this.towers))
      .filter((p): p is Profile => p !== null);
  }

  getProfileDirectoriesPaths(): string[] {
    this.ensureGameDirectory();
    const profileDirectoryPattern = path.join(this.gameDirectoryPath, '*');
    return globbySync(profileDirectoryPattern, { onlyDirectories: true });
  }

  ensureGameDirectory(): void {
    try {
      if (!fs.statSync(this.gameDirectoryPath).isDirectory()) {
        throw new GameError(
          'A file named warriorjs exists at this location. Please change the directory under which you are running warriorjs.',
        );
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }

      fs.mkdirSync(this.gameDirectoryPath);
    }
  }

  prepareNextLevel(): void {
    this.profile!.goToNextLevel();
    this.generateProfileFiles();
  }

  generateProfileFiles(): void {
    const { tower, levelNumber, warriorName, epic } = this.profile!;
    const levelConfig = getLevelConfig(tower, levelNumber, warriorName, epic);
    new ProfileGenerator(this.profile!, levelConfig!).generate();
  }

  prepareEpicMode(): void {
    this.profile!.enableEpicMode();
  }
}

export default Game;
