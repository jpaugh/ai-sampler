import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.(js|ts|mjs|cjs|jsx|tsx)$/,
  use: {
    baseURL: 'http://localhost:5173/?embed=true',
    actionTimeout: 1500,
    navigationTimeout: 1500,
  },
  workers: 4,
  fullyParallel: true,
});
