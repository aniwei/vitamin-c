import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '../..')

export default defineConfig({
  resolve: {
    alias: {
      bindings: path.resolve(repoRoot, 'packages/bindings/src/index.ts'),
      geometry: path.resolve(repoRoot, 'packages/geometry/src/index.ts'),
      shared: path.resolve(repoRoot, 'packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
    fs: {
      allow: [repoRoot],
    },
  },
})
