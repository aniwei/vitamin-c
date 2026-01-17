import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import * as path from 'node:path'

import { WebGLApi } from '../../WebGLApi'
import { CanvasKitApi } from '../../CanvasKitApi'

const bindingsRoot = path.resolve(__dirname, '..', '..', '..')
const wasmPath = path.resolve(bindingsRoot, 'native/canvaskit_cheap.wasm')

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

async function ensureWasm(): Promise<void> {
  if (existsSync(wasmPath)) return

  const result = spawnSync('pnpm', ['wasm:build'], {
    cwd: bindingsRoot,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error(`pnpm wasm:build failed with status ${result.status}`)
  }
}

function ensureCanvas(): string {
  if (!isBrowser) return '#canvas'
  const id = 'ck-test-canvas'
  let canvas = document.getElementById(id) as HTMLCanvasElement | null
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.id = id
    canvas.width = 300
    canvas.height = 200
    document.body.appendChild(canvas)
  }
  return `#${id}`
}

describe('WebGLApi (multi-context)', () => {
  let api: WebGLApi

  beforeAll(async () => {
    await ensureWasm()
    await CanvasKitApi.ready({ path: wasmPath })
    api = new WebGLApi()
  }, 600_000)

  it('exposes WebGL exports from cheap wasm', () => {
    expect(CanvasKitApi.WebGL.hasWebGL()).toBe(true)
  })

  it('creates and tracks contexts with real wasm', () => {
    const selector = ensureCanvas()
    if (!isBrowser) {
      expect(() => api.createContext({ selector, width: 300, height: 200 })).toThrow('WebGL_CreateContext returned 0')
      return
    }

    const id = api.createContext({ selector, width: 300, height: 200 })
    const ctx = api.getContext(id)

    expect(ctx).not.toBeNull()
    expect(ctx?.handle).toBeTruthy()
    expect(ctx?.surface).toBeTruthy()
    expect(ctx?.grContext).toBeTruthy()
  })

  it('resizes surface per context with real wasm', () => {
    const selector = ensureCanvas()
    if (!isBrowser) {
      expect(() => api.createContext({ selector, width: 100, height: 100 })).toThrow('WebGL_CreateContext returned 0')
      return
    }

    const id = api.createContext({ selector, width: 100, height: 100 })
    const surface = api.resizeSurface(id, 640, 480)
    const ctx = api.getContext(id)

    expect(surface).toBeTruthy()
    expect(ctx?.width).toBe(640)
    expect(ctx?.height).toBe(480)
  })

  it('destroys contexts and releases resources with real wasm', () => {
    const selector = ensureCanvas()
    if (!isBrowser) {
      expect(() => api.createContext({ selector, width: 320, height: 240 })).toThrow('WebGL_CreateContext returned 0')
      return
    }

    const id = api.createContext({ selector, width: 320, height: 240 })
    api.destroyContext(id)

    expect(api.getContext(id)).toBeNull()
  })
})
