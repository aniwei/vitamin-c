import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'

const enumApiModule = '../../../src/EnumApi'
const getEnumsModule = '../../../scripts/getEnums'

const enumApiMock = {
  ready: vi.fn(),
  invoke: vi.fn(),
  hasExport: vi.fn(() => true),
}

const writeFileMock = vi.fn()

const originalEnv = { ...process.env }

function nextTick() {
  return new Promise((resolve) => setImmediate(resolve))
}

describe('getEnums script', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    enumApiMock.ready.mockReset()
    enumApiMock.invoke.mockReset()
    enumApiMock.hasExport.mockReset().mockReturnValue(true)
    writeFileMock.mockReset()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('uses default enum-export wasm path when env is not set', async () => {
    delete process.env.ENUM_EXPORT_WASM
    delete process.env.ENUM_WASM

    enumApiMock.ready.mockResolvedValue({})
    enumApiMock.invoke.mockReturnValue(1)
    writeFileMock.mockResolvedValue(undefined)

    vi.doMock(enumApiModule, () => ({
      EnumApi: enumApiMock,
    }))
    vi.doMock('fs/promises', () => ({ writeFile: writeFileMock }))

    await import(getEnumsModule)
    await nextTick()

    const expected = path.resolve(process.cwd(), 'native/enum-exports.wasm')
    expect(enumApiMock.ready).toHaveBeenCalledWith({ path: expected })
    expect(writeFileMock).toHaveBeenCalled()
  })

  it('prefers ENUM_EXPORT_WASM when provided', async () => {
    process.env.ENUM_EXPORT_WASM = '/tmp/enum-exports.wasm'
    delete process.env.ENUM_WASM

    enumApiMock.ready.mockResolvedValue({})
    enumApiMock.invoke.mockReturnValue(1)
    writeFileMock.mockResolvedValue(undefined)

    vi.doMock(enumApiModule, () => ({
      EnumApi: enumApiMock,
    }))
    vi.doMock('fs/promises', () => ({ writeFile: writeFileMock }))

    await import(getEnumsModule)
    await nextTick()

    expect(enumApiMock.ready).toHaveBeenCalledWith({ path: '/tmp/enum-exports.wasm' })
  })

  it('warns and skips write when enum wasm fails to load', async () => {
    delete process.env.ENUM_EXPORT_WASM
    delete process.env.ENUM_WASM

    enumApiMock.ready.mockRejectedValue(new Error('boom'))
    enumApiMock.invoke.mockReturnValue(1)
    writeFileMock.mockResolvedValue(undefined)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.doMock(enumApiModule, () => ({
      EnumApi: enumApiMock,
    }))
    vi.doMock('fs/promises', () => ({ writeFile: writeFileMock }))

    await import(getEnumsModule)
    await nextTick()

    expect(warnSpy).toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
