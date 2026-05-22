import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    dir: 'src',
    globals: true,
    coverage: {
      all: false,
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          dir: 'src',
          include: ['**/*.spec.ts'],
          exclude: ['**/*.e2e.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          dir: 'src',
          include: ['**/*.e2e.spec.ts'],
          environment: './prisma/vitest-environment-prisma/vitest-environment-prisma.ts',
          setupFiles: ['./src/test/setup-e2e.ts'],
          forks: {
            singleFork: true,
          },
        },
      },
    ],
  },
})
