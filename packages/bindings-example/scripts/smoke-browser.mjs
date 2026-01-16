import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function contentType(p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8'
  if (p.endsWith('.js') || p.endsWith('.mjs')) return 'text/javascript; charset=utf-8'
  if (p.endsWith('.css')) return 'text/css; charset=utf-8'
  if (p.endsWith('.wasm')) return 'application/wasm'
  if (p.endsWith('.json')) return 'application/json; charset=utf-8'
  if (p.endsWith('.png')) return 'image/png'
  if (p.endsWith('.svg')) return 'image/svg+xml; charset=utf-8'
  return 'application/octet-stream'
}

function findChromeExecutable() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ]
  return candidates.find((p) => fs.existsSync(p)) ?? null
}

async function main() {
  const distDir = path.resolve(__dirname, '../dist')
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist not found: ${distDir} (run pnpm -C packages/bindings-example build)`)
  }

  const repoRoot = path.resolve(__dirname, '../../..')
  const require = createRequire(path.resolve(repoRoot, 'packages/bindings/package.json'))
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const puppeteer = require('puppeteer')

  const server = http.createServer((req, res) => {
    try {
      const u = new URL(req.url ?? '/', 'http://127.0.0.1')
      let rel = decodeURIComponent(u.pathname)
      if (rel === '/') rel = '/index.html'

      const abs = path.resolve(distDir, '.' + rel)
      if (!abs.startsWith(distDir)) {
        res.writeHead(403)
        res.end('forbidden')
        return
      }

      if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        res.writeHead(404)
        res.end('not found')
        return
      }

      res.writeHead(200, { 'content-type': contentType(abs) })
      fs.createReadStream(abs).pipe(res)
    } catch (e) {
      res.writeHead(500)
      res.end(String(e))
    }
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  const base = `http://127.0.0.1:${port}`

  const chrome = findChromeExecutable()
  const browser = await puppeteer.launch({
    headless: 'new',
    ...(chrome ? { executablePath: chrome } : null),
  })
  const page = await browser.newPage()

  page.on('console', (msg) => {
    // eslint-disable-next-line no-console
    console.log('[console]', msg.type(), msg.text())
  })

  page.on('pageerror', (err) => {
    // eslint-disable-next-line no-console
    console.log('[pageerror]', String(err))
  })

  page.on('requestfailed', (req) => {
    // eslint-disable-next-line no-console
    console.log('[requestfailed]', req.url(), req.failure()?.errorText)
  })

  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60_000 })
  await new Promise((r) => setTimeout(r, 1500))

  const status = await page.$eval('#status', (el) => el.textContent ?? '')
  // eslint-disable-next-line no-console
  console.log('---STATUS---\n' + status + '\n---/STATUS---')

  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
