import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // `server-only` throws outside a Next server bundle; stub it for unit tests.
    alias: { 'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)) },
  },
  test: { include: ['tests/**/*.test.ts'] },
})
