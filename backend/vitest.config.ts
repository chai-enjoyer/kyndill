import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: '../reports/backend-unit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: '../coverage/backend',
      exclude: ['dist/**', 'tests/**', 'db/**', 'src/server.ts'],
    },
  },
});
