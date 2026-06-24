import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Scope coverage to the pure calculation unit under test.
      include: ['src/utils/calculations.ts'],
      reporter: ['text', 'html'],
      // These are pure functions — full coverage is the expectation, not aspirational.
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});