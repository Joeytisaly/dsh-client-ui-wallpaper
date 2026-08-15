/** Durable wallpaper settings owned by the wallpaper plugin. */
import z from '@deepseek-ai/schemastery';
/** Settings namespace owned by the wallpaper plugin. */
export declare const WALLPAPER_SETTINGS_NAMESPACE = "ui-wallpaper";
/** Field carrying the wallpaper on/off flag. */
export declare const WALLPAPER_FIELD = "enabled";
/** Served wallpaper URL (host route; the photo is absent when unset). */
export declare const WALLPAPER_URL = "/wallpaper";
/** Upload cap for wallpaper image bytes. */
export declare const WALLPAPER_MAX_BYTES: number;
/** Durable wallpaper section shared by the Host schema and the browser scope. */
export interface WallpaperSettings {
    /** Whether the photo wallpaper is enabled (served at {@link WALLPAPER_URL}). */
    enabled: boolean;
}
/** Durable wallpaper schema; also the wire envelope the browser scope validates against. */
export declare const WallpaperSettingsSchema: z<WallpaperSettings>;
//# sourceMappingURL=wallpaper-settings.d.ts.map