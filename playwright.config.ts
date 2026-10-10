import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',

  use: { baseURL: 'http://localhost:5173' },

  projects: [
    // Signs in through Keycloak once; the tests start from the saved state.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/alice.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
