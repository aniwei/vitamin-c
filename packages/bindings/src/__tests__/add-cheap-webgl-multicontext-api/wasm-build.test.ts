import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import * as path from 'node:path'
import { existsSync, statSync } from 'node:fs'

describe('cheap wasm build', () => {
  it('builds wasm into bindings/native', () => {
    const bindingsRoot = path.resolve(__dirname, '..', '..', '..')
    const buildResult = spawnSync('pnpm', ['build'], {
      cwd: bindingsRoot,
      stdio: 'inherit',
    })
    expect(buildResult.status).toBe(0)

    const result = spawnSync('pnpm', ['wasm:build'], {
      cwd: bindingsRoot,
      stdio: 'inherit',
    })

    expect(result.status).toBe(0)

    const wasmPath = path.resolve(bindingsRoot, 'native/canvaskit_cheap.wasm')
    expect(existsSync(wasmPath)).toBe(true)
    expect(statSync(wasmPath).size).toBeGreaterThan(0)
  }, 600_000)
})
