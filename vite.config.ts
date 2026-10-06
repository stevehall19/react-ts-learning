/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /<repo-name>/, so the deploy workflow sets
  // GITHUB_PAGES=true to build with that base path. Locally the app stays at /.
  base: process.env.GITHUB_PAGES ? '/react-ts-learning/' : '/',

  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': 'http://localhost:8080' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    restoreMocks: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
