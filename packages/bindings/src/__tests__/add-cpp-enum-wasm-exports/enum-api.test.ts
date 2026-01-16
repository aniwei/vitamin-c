import { describe, it, expect } from 'vitest'
import { EnumApi } from '../../EnumApi'

describe('EnumApi', () => {
  it('throws when ready() is missing uri/path', async () => {
    await expect(EnumApi.ready({} as any)).rejects.toThrow('Expected options.uri or options.path')
  })

  it('throws when invoke() is called before ready()', () => {
    expect(() => EnumApi.invoke('SkPathFillType_Winding')).toThrow('EnumApi not initialized')
  })

  it('throws when hasExport() is called before ready()', () => {
    expect(() => EnumApi.hasExport('SkPathFillType_Winding')).toThrow('EnumApi not initialized')
  })
})
