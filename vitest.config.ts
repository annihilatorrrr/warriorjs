import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    include: ['libs/**/src/**/*.test.ts', 'apps/**/src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      include: ['libs/**/src/**/*.ts', 'apps/**/src/**/*.{ts,tsx}'],
      exclude: ['libs/warriorjs-tower-**/src/**', '**/*.test.{ts,tsx}'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
