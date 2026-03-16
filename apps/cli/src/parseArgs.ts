import yargs from 'yargs';

interface ParsedArgs {
  directory: string;
  level: number | undefined;
  silent: boolean;
  d: string;
  l: number | undefined;
  s: boolean;
  [key: string]: unknown;
}

function parseArgs(args: string[]): ParsedArgs {
  return yargs(args)
    .usage('Usage: $0 [options]')
    .options({
      d: {
        alias: 'directory',
        default: '.',
        describe: 'Run under given directory',
        type: 'string' as const,
      },
      l: {
        alias: 'level',
        coerce: (arg: string) => {
          const parsed = Number.parseInt(arg, 10);
          if (Number.isNaN(parsed)) {
            throw new Error('Invalid argument: level must be a number');
          }

          return parsed;
        },
        describe: 'Practice level (epic mode only)',
        type: 'number' as const,
      },
      s: {
        alias: 'silent',
        default: false,
        describe: 'Suppress play log',
        type: 'boolean' as const,
      },
    })
    .version()
    .help()
    .strict()
    .fail((msg: string, err: Error | undefined) => {
      if (err) {
        console.error(err.message);
      } else if (msg) {
        console.error(msg);
      }
      process.exit(1);
    })
    .parseSync() as unknown as ParsedArgs;
}

export default parseArgs;
