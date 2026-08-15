/**
 * Host-rendered wallpaper bootstrap for the browser's pre-plugin interval.
 * When the durable wallpaper flag is enabled, each index response embeds an
 * inline script that pins the body background to the wallpaper route before
 * the shell mounts, so the first paint carries the photo instead of a blank
 * translucent surface. The browser plugin re-applies the same write after the
 * plugin tree activates (idempotent, no flicker).
 */

import { WALLPAPER_URL } from './wallpaper-settings.ts'

/** Build the inline script that applies the wallpaper pre-render. */
function bootWallpaperScript(): string {
  return `<script>(() => {
  document.body.style.backgroundImage = ${JSON.stringify(`url("${WALLPAPER_URL}")`)}
  document.body.style.backgroundSize = 'cover'
  document.body.style.backgroundPosition = 'center'
  document.body.style.backgroundAttachment = 'fixed'
  document.body.style.backgroundRepeat = 'no-repeat'
})()</script>`
}

/**
 * Insert the wallpaper bootstrap immediately after the opening body tag when
 * the wallpaper is enabled; otherwise return the HTML untouched.
 * @param html - Raw application index HTML.
 * @param enabled - Whether the durable wallpaper flag is currently set.
 * @returns HTML containing the wallpaper bootstrap when enabled.
 */
export function injectBootWallpaper(html: string, enabled: boolean): string {
  if (!enabled) return html
  const script = bootWallpaperScript()
  const body = /<body(?:\s[^>]*)?>/i.exec(html)
  if (body === null) return `${html}${script}`
  const at = body.index + body[0].length
  return `${html.slice(0, at)}${script}${html.slice(at)}`
}
