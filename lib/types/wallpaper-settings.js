/** Durable wallpaper settings owned by the wallpaper plugin. */
import z from '@deepseek-ai/schemastery';
/** Settings namespace owned by the wallpaper plugin. */
export const WALLPAPER_SETTINGS_NAMESPACE = 'ui-wallpaper';
/** Field carrying the wallpaper on/off flag. */
export const WALLPAPER_FIELD = 'enabled';
/** Served wallpaper URL (host route; the photo is absent when unset). */
export const WALLPAPER_URL = '/wallpaper';
/** Upload cap for wallpaper image bytes. */
export const WALLPAPER_MAX_BYTES = 15 * 1024 * 1024;
/** Durable wallpaper schema; also the wire envelope the browser scope validates against. */
export const WallpaperSettingsSchema = z.object({
    [WALLPAPER_FIELD]: z.boolean().default(false),
});
//# sourceMappingURL=wallpaper-settings.js.map