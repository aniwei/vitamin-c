import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// scripts/ -> package -> packages/ -> repo root
const repoRoot = path.resolve(__dirname, '../../..')

const candidates = [
  path.resolve(repoRoot, 'packages/third-party/skia/out/canvaskit_wasm_cheap_no_glue/canvaskit.wasm'),
  path.resolve(repoRoot, 'packages/third-party/skia/out/canvaskit_cheap/canvaskit.wasm'),
  path.resolve(repoRoot, 'packages/workstation/public/cheap/canvaskit.wasm'),
  path.resolve(repoRoot, 'packages/perf-web/public/cheap/canvaskit.wasm'),
]

const src = candidates.find((p) => fs.existsSync(p))
if (!src) {
  console.error('No canvaskit.wasm found. Run `pnpm -C packages/bindings wasm:build` first.')
  process.exit(1)
}

const dstDir = path.resolve(__dirname, '../public')
fs.mkdirSync(dstDir, { recursive: true })

const dst = path.resolve(dstDir, 'canvaskit.wasm')
fs.copyFileSync(src, dst)
console.log(`Copied wasm: ${src} -> ${dst}`)
