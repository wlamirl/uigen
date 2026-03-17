import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/lib/__tests__/auth.test.ts'],
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          environment: 'node',
          include: ['src/lib/__tests__/auth.test.ts'],
        },
      },
    ],
  },
})
