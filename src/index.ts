/** Host registration for the wallpaper route, its durable flag, and the pre-plugin bootstrap. */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { injectBootWallpaper } from './boot-wallpaper.ts'
import {
  WALLPAPER_MAX_BYTES, WALLPAPER_SETTINGS_NAMESPACE, WALLPAPER_URL,
  WallpaperSettingsSchema,
  type WallpaperSettings,
} from './wallpaper-settings.ts'

export {
  WALLPAPER_FIELD, WALLPAPER_MAX_BYTES, WALLPAPER_SETTINGS_NAMESPACE, WALLPAPER_URL,
  type WallpaperSettings,
} from './wallpaper-settings.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Resolve a path under the harness home (provided by dsh-app-boot). */
    dshHomePath?: (...segments: string[]) => string
  }
}

const WALLPAPER_NAMESPACE = settingsNamespace(WALLPAPER_SETTINGS_NAMESPACE)

/** Read the registered wallpaper flag or default to off without a settings provider. */
function readEnabled(ctx: Context): boolean {
  const settings = ctx.get('settings')
  if (settings === undefined) return false
  const section = settings.get(WALLPAPER_NAMESPACE) as WallpaperSettings | undefined
  return section?.enabled === true
}

/** Sniff an image's media type from its magic bytes (JPEG/PNG/GIF/WebP). */
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png'
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
    && bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) return 'image/gif'
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp'
  return null
}

/** Collect a request body with a hard size cap. */
async function readBody(req: IncomingMessage, cap: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > cap) throw new Error(`wallpaper body exceeds ${cap} bytes`)
    chunks.push(buffer)
  }
  return Buffer.concat(chunks)
}

/** Serve the stored wallpaper with a sniffed content type; 404 when absent. */
async function handleWallpaperGet(_req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  try {
    const bytes = await readFile(path)
    const type = sniffImageType(bytes)
    if (type === null) {
      res.writeHead(415)
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' })
    res.end(bytes)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(500)
    res.end()
  }
}

/** Atomically store an uploaded wallpaper image; 413 over the cap, 415 for non-images. */
async function handleWallpaperPost(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  try {
    const bytes = await readBody(req, WALLPAPER_MAX_BYTES)
    if (sniffImageType(bytes) === null) {
      res.writeHead(415)
      res.end()
      return
    }
    await mkdir(dirname(path), { recursive: true })
    const temporary = `${path}.tmp-${process.pid}-${Date.now()}`
    await writeFile(temporary, bytes)
    await rename(temporary, path)
    res.writeHead(204)
    res.end()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.writeHead(message.startsWith('wallpaper body exceeds') ? 413 : 500)
    res.end()
  }
}

/** Remove the stored wallpaper; 204 regardless of prior presence. */
async function handleWallpaperDelete(_req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  await rm(path, { force: true })
  res.writeHead(204)
  res.end()
}

/**
 * Register the durable wallpaper section, the wallpaper route, and the
 * pre-plugin bootstrap when their optional Host services are composed.
 * @param ctx - Host context that may acquire settings and HTTP services.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(WALLPAPER_NAMESPACE, WallpaperSettingsSchema)
  })
  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(
      () => httpCtx.webServer.tapIndex(html => injectBootWallpaper(html, readEnabled(ctx))),
      'client-ui-wallpaper: wallpaper bootstrap',
    )
    const home = httpCtx.dshHomePath
    if (home === undefined) {
      httpCtx.logger.warn('client-ui-wallpaper: dshHomePath is unavailable; wallpaper route not registered')
      return
    }
    const wallpaperPath = (): string => home('wallpaper')
    const dispose = httpCtx.webServer.register({
      kind: 'exact',
      path: WALLPAPER_URL,
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        const method = req.method ?? 'GET'
        if (method === 'GET') return handleWallpaperGet(req, res, wallpaperPath())
        if (method === 'POST') return handleWallpaperPost(req, res, wallpaperPath())
        if (method === 'DELETE') return handleWallpaperDelete(req, res, wallpaperPath())
        res.writeHead(405, { Allow: 'GET, POST, DELETE' })
        res.end()
      },
    })
    httpCtx.effect(() => dispose, 'client-ui-wallpaper: wallpaper route')
  })
}
