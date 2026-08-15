/** Host registration for the wallpaper route, its durable flag, and the pre-plugin bootstrap. */
import type { Context } from '@deepseek-ai/cordis';
export { WALLPAPER_FIELD, WALLPAPER_MAX_BYTES, WALLPAPER_SETTINGS_NAMESPACE, WALLPAPER_URL, type WallpaperSettings, } from './wallpaper-settings.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** Resolve a path under the harness home (provided by dsh-app-boot). */
        dshHomePath?: (...segments: string[]) => string;
    }
}
/**
 * Register the durable wallpaper section, the wallpaper route, and the
 * pre-plugin bootstrap when their optional Host services are composed.
 * @param ctx - Host context that may acquire settings and HTTP services.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map