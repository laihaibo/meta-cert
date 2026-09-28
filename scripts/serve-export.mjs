/**
 * 本地预览静态导出产物（模拟 GitHub Pages 子路径部署）：
 * /meta-cert/* → out/*，其余路径 301 到 /meta-cert/。
 * 用法: node scripts/serve-export.mjs [port]   默认 4173
 */
import { createServer } from 'node:http'
import { statSync, createReadStream, existsSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.argv[2] || 4173)
const BASE = '/meta-cert'
const OUT = join(fileURLToPath(new URL('../out', import.meta.url)))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  let path = decodeURIComponent(url.pathname)

  if (!path.startsWith(BASE)) {
    res.writeHead(301, { Location: BASE + (path === '/' ? '/' : path) })
    res.end()
    return
  }

  path = path.slice(BASE.length) || '/'
  let file = join(OUT, normalize(path).replace(/^([.][.][/\\])+/, ''))
  if (!file.startsWith(OUT)) {
    res.writeHead(403)
    res.end()
    return
  }

  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html')
  } catch {
    // 无扩展名的干净路径 → 尝试目录/index.html，再退回 404 页
    if (existsSync(join(OUT, path, 'index.html'))) {
      file = join(OUT, path, 'index.html')
    } else if (existsSync(join(OUT, '404.html'))) {
      file = join(OUT, '404.html')
    }
  }

  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
    return
  }

  const type = MIME[extname(file)] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  createReadStream(file).pipe(res)
}).listen(PORT, () => {
  console.log(`✓ 预览: http://localhost:${PORT}${BASE}/`)
})
