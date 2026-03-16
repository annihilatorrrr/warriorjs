import { describe, expect, test, vi } from 'vitest';

import parseArgs from './parseArgs.js';

test("doesn't fail when no args are supplied", () => {
  parseArgs([]);
});

describe('-d', () => {
  test('parses correctly', () => {
    expect(parseArgs(['-d', '/path/to/run']).d).toBe('/path/to/run');
  });

  test('has alias --directory', () => {
    expect(parseArgs(['--directory', '/path/to/run']).directory).toBe('/path/to/run');
  });

  test("defaults to '.'", () => {
    expect(parseArgs([]).d).toBe('.');
  });
});

describe('-l', () => {
  test('parses correctly', () => {
    expect(parseArgs(['-l', '4']).l).toBe(4);
  });

  test('has alias --level', () => {
    expect(parseArgs(['--level', '4']).level).toBe(4);
  });

  test('exits with error if not a number', () => {
    const originalExit = process.exit;
    const originalError = console.error;
    process.exit = vi.fn() as any;
    console.error = vi.fn();
    try {
      parseArgs(['-l', 'invalid']);
    } catch {
      // yargs may throw after calling process.exit in test environments
    }
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith('Invalid argument: level must be a number');
    process.exit = originalExit;
    console.error = originalError;
  });
});

test('exits with error on unknown option', () => {
  const originalExit = process.exit;
  const originalError = console.error;
  process.exit = vi.fn() as any;
  console.error = vi.fn();
  try {
    parseArgs(['--unknown']);
  } catch {
    // yargs may throw after calling process.exit in test environments
  }
  expect(process.exit).toHaveBeenCalledWith(1);
  expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Unknown'));
  process.exit = originalExit;
  console.error = originalError;
});

describe('-s', () => {
  test('parses correctly', () => {
    expect(parseArgs(['-s']).s).toBe(true);
  });

  test('has alias --silent', () => {
    expect(parseArgs(['--silent']).silent).toBe(true);
  });

  test('defaults to false', () => {
    expect(parseArgs([]).s).toBe(false);
  });
});
