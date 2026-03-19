import fs from 'node:fs';
import path from 'node:path';
import { getLevelConfig } from '@warriorjs/core';
import mock from 'mock-fs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Game from './Game.js';
import GameError from './GameError.js';
import loadTowers from './loadTowers.js';
import Profile from './Profile.js';
import ProfileGenerator from './ProfileGenerator.js';

vi.mock('@warriorjs/core');
vi.mock('./ProfileGenerator.js', () => {
  const MockProfileGenerator = vi.fn(function (this: any) {});
  return { default: MockProfileGenerator, __esModule: true };
});
vi.mock('./loadTowers.js', () => ({
  default: vi.fn(() => [{ id: 'tower1', name: 'Tower 1' }]),
}));

describe('Game', () => {
  let game: any;

  beforeEach(() => {
    game = new Game('/path/to/game', undefined, false);
  });

  test('has a run directory path', () => {
    expect(game.runDirectoryPath).toBe('/path/to/game');
  });

  test('has a game directory path', () => {
    expect(game.gameDirectoryPath).toBe(path.normalize('/path/to/game/warriorjs'));
  });

  describe('buildContext', () => {
    beforeEach(() => {
      vi.spyOn(Profile, 'load').mockReturnValue(null);
      game.getProfiles = vi.fn().mockReturnValue([]);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('loads towers', () => {
      const context = game.buildContext();
      expect(context.towers).toEqual([{ id: 'tower1', name: 'Tower 1' }]);
    });

    test('sets needsProfileSetup when no profile found', () => {
      const context = game.buildContext();
      expect(context.needsProfileSetup).toBe(true);
      expect(context.profile).toBeNull();
    });

    test('sets profile when found', () => {
      const mockProfile = { isEpic: () => false };
      vi.spyOn(Profile, 'load').mockReturnValue(mockProfile as any);
      const context = game.buildContext();
      expect(context.needsProfileSetup).toBe(false);
      expect(context.profile).toBe(mockProfile);
    });

    test('sets error when tower loading fails', () => {
      vi.mocked(loadTowers).mockImplementationOnce(() => {
        throw new GameError('Tower load failed');
      });
      const context = game.buildContext();
      expect(context.error).toBe('Tower load failed');
    });

    test('provides callbacks', () => {
      const context = game.buildContext();
      expect(typeof context.onCreateProfile).toBe('function');
      expect(typeof context.onIsExistingProfile).toBe('function');
      expect(typeof context.onPrepareNextLevel).toBe('function');
      expect(typeof context.onPrepareEpicMode).toBe('function');
      expect(typeof context.onGenerateProfileFiles).toBe('function');
      expect(typeof context.onProfileSelected).toBe('function');
    });
  });

  describe('createProfile', () => {
    test('creates a profile with the correct directory path', () => {
      const tower = { id: 'the-narrow-path' };
      const profile = game.createProfile('Aldric', 'typescript', tower);
      expect(profile).toBeInstanceOf(Profile);
      expect(profile.warriorName).toBe('Aldric');
      expect(profile.language).toBe('typescript');
      expect(profile.directoryPath).toBe(
        path.normalize('/path/to/game/warriorjs/aldric-the-narrow-path'),
      );
    });
  });

  test('returns profiles', () => {
    const originalLoad = Profile.load;
    game.towers = ['tower1', 'tower2'];
    game.getProfileDirectoriesPaths = () => [
      '/path/to/game/warriorjs/profile1',
      '/path/to/game/warriorjs/profile2',
    ];
    Profile.load = vi.fn() as any;
    game.getProfiles();
    expect(Profile.load).toHaveBeenCalledWith('/path/to/game/warriorjs/profile1', [
      'tower1',
      'tower2',
    ]);
    expect(Profile.load).toHaveBeenCalledWith('/path/to/game/warriorjs/profile2', [
      'tower1',
      'tower2',
    ]);
    Profile.load = originalLoad;
  });

  test('knows if profile exists', () => {
    const nonExistingProfile = {
      directoryPath: '/path/to/nonexisting-profile',
    };
    const existentProfile = { directoryPath: '/path/to/profile' };
    game.getProfileDirectoriesPaths = () => ['/path/to/profile'];
    expect(game.isExistingProfile(nonExistingProfile)).toBe(false);
    expect(game.isExistingProfile(existentProfile)).toBe(true);
  });

  test('returns paths to profile directories', async () => {
    game.ensureGameDirectory = vi.fn();
    mock({
      '/path/to/game/warriorjs': {
        profile1: {},
        profile2: {},
        'other-file': '',
      },
    });
    const profileDirectoriesPaths = await game.getProfileDirectoriesPaths();
    mock.restore();
    expect(profileDirectoriesPaths).toEqual([
      '/path/to/game/warriorjs/profile1',
      '/path/to/game/warriorjs/profile2',
    ]);
    expect(game.ensureGameDirectory).toHaveBeenCalled();
  });

  describe('ensuring game directory', () => {
    test("creates directory if it doesn't exist", () => {
      mock({ '/path/to/game': {} });
      game.ensureGameDirectory();
      expect(fs.statSync('/path/to/game/warriorjs').isDirectory()).toBe(true);
      mock.restore();
    });

    test('does nothing if directory already exists', () => {
      mock({ '/path/to/game/warriorjs': {} });
      expect(fs.statSync('/path/to/game/warriorjs').isDirectory()).toBe(true);
      game.ensureGameDirectory();
      expect(fs.statSync('/path/to/game/warriorjs').isDirectory()).toBe(true);
      mock.restore();
    });

    test('throws if a warriorjs file exists', () => {
      mock({ '/path/to/game/warriorjs': '' });
      expect(() => {
        game.ensureGameDirectory();
      }).toThrow(
        new GameError(
          'A file named warriorjs exists at this location. Please change the directory under which you are running warriorjs.',
        ),
      );
      mock.restore();
    });
  });

  test('prepares next level', () => {
    game.profile = { goToNextLevel: vi.fn() };
    game.generateProfileFiles = vi.fn();
    game.prepareNextLevel();
    expect(game.profile.goToNextLevel).toHaveBeenCalled();
    expect(game.generateProfileFiles).toHaveBeenCalled();
  });

  test('generates player', () => {
    game.profile = {
      tower: 'tower',
      levelNumber: 1,
      warriorName: 'Aldric',
      epic: false,
      getReadmeFilePath: () => '/path/to/profile/readme',
    };
    (getLevelConfig as any).mockReturnValue('config');
    const mockGenerate = vi.fn();
    (ProfileGenerator as any).mockImplementation(function (this: any) {
      this.generate = mockGenerate;
    });
    game.generateProfileFiles();
    expect(getLevelConfig).toHaveBeenCalledWith('tower', 1, 'Aldric', false);
    expect(ProfileGenerator).toHaveBeenCalledWith(game.profile, 'config');
    expect(mockGenerate).toHaveBeenCalled();
  });

  test('prepares epic mode', () => {
    game.profile = { enableEpicMode: vi.fn() };
    game.prepareEpicMode();
    expect(game.profile.enableEpicMode).toHaveBeenCalled();
  });
});
