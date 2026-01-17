import { describe, it, expect } from 'vitest'
import { readFile } from 'fs/promises'
import path from 'path'

describe('vite examples files', () => {
  it('includes main sections in index.html', async () => {
    const filePath = path.resolve(process.cwd(), 'examples/index.html')
    const html = await readFile(filePath, 'utf-8')

    expect(html).toContain('Surface + Canvas')
    expect(html).toContain('WebGL')
    expect(html).toContain('Paragraph')
    expect(html).toContain('Filters')
    expect(html).toContain('WebGPU')
    expect(html).toContain('script type="module"')
  })

  it('main entry loads wasm and font assets', async () => {
    const filePath = path.resolve(process.cwd(), 'examples/main.ts')
    const source = await readFile(filePath, 'utf-8')

    expect(source).toContain("loadCanvasKit")
    expect(source).toContain("canvaskit_cheap.wasm")
    expect(source).toContain('NotoMono-Regular.ttf')
  })
})
