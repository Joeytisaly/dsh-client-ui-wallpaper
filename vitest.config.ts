import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = (rel: string): string => fileURLToPath(new URL(rel, import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@joeytisaly\/dsh-client-ui-wallpaper\/client$/, replacement: here('./src/client/index.ts') },
      { find: /^@joeytisaly\/dsh-client-ui-wallpaper\/invariant$/, replacement: here('./src/invariant.ts') },
      { find: /^@joeytisaly\/dsh-client-ui-wallpaper\/src\/(.+)$/, replacement: here('./src/$1') },
      { find: /^@joeytisaly\/dsh-client-ui-wallpaper$/, replacement: here('./src/index.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
  },
})
