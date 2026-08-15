/**
 * Host-rendered wallpaper bootstrap for the browser's pre-plugin interval.
 * When the durable wallpaper flag is enabled, each index response embeds an
 * inline script that pins the body background to the wallpaper route before
 * the shell mounts, so the first paint carries the photo instead of a blank
 * translucent surface. The browser plugin re-applies the same write after the
 * plugin tree activates (idempotent, no flicker).
 */
/**
 * Insert the wallpaper bootstrap immediately after the opening body tag when
 * the wallpaper is enabled; otherwise return the HTML untouched.
 * @param html - Raw application index HTML.
 * @param enabled - Whether the durable wallpaper flag is currently set.
 * @returns HTML containing the wallpaper bootstrap when enabled.
 */
export declare function injectBootWallpaper(html: string, enabled: boolean): string;
//# sourceMappingURL=boot-wallpaper.d.ts.map