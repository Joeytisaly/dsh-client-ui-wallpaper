/**
 * Browser wallpaper plugin: owns the photo behind the web surface. The service
 * reads the durable `ui-wallpaper.enabled` flag through the settings scope,
 * projects the host-served `/wallpaper` URL onto the body background (the sole
 * DOM write this feature owns), and registers the Wallpaper settings row with
 * its localized copy. It never touches the theme registry or token sheets —
 * the surface-treatment stylesheet it injects makes the alias surfaces
 * translucent so the photo shows through, over whatever palette the theme
 * plugin resolved.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import { type WallpaperKey } from './locales.ts';
import { type WallpaperSettings } from '../wallpaper-settings.ts';
export type { WallpaperRowComponentProps, WallpaperRowInjected } from './WallpaperRow.tsx';
export type { WallpaperRowState } from './settings-store.ts';
export type { WallpaperKey } from './locales.ts';
export type { WallpaperSettings } from '../wallpaper-settings.ts';
/** Namespace owning this feature's settings-row copy. */
export declare const SETTINGS_NS = "settings.wallpaper";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The Wallpaper settings row's copy. */
        'settings.wallpaper': WallpaperKey;
    }
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        wallpaper: WallpaperRuntime;
    }
    interface Events {
        /**
         * Wallpaper state changed (enabled flag toggled).
         * @param enabled - whether the wallpaper is now applied.
         * @param revision - monotonic change counter.
         * @mode emit
         */
        'wallpaper/change'(enabled: boolean, revision: number): void;
    }
}
/**
 * Wallpaper flag owner and single DOM writer. Reads go through
 * {@link isEnabled}; writes only through {@link setEnabled}; continuous sync
 * only through the `wallpaper/change` event. The body background-image is the
 * only property this service ever touches, so it cannot fight the theme
 * presenter or foreign styles.
 */
export declare class WallpaperRuntime {
    private readonly ctx;
    private readonly host;
    private enabled;
    private revision;
    /**
     * @param ctx - owning context (change events are emitted on it; the scope
     * listener is released through ctx.effect on dispose).
     * @param host - durable flag scope owned by the same plugin.
     */
    constructor(ctx: Context, host: SettingsScope<WallpaperSettings>);
    /** Whether the wallpaper is currently applied. */
    isEnabled(): boolean;
    /**
     * Toggle the photo wallpaper. The on/off flag persists through the settings
     * scope; the photo bytes themselves live at the host wallpaper route.
     * @param enabled - whether to show the wallpaper.
     */
    setEnabled(enabled: boolean): void;
    /** Adopt the scope's accepted durable flag without writing it back. */
    private adopt;
    /** Apply the flag to the document and publish the change. */
    private applyEnabled;
}
/** Required services: settings transport plus slots/locale for the Wallpaper row. */
export declare const inject: string[];
/**
 * Client plugin body: inject the surface-treatment stylesheet, provide the
 * wallpaper service, and register the feature-owned Wallpaper settings row
 * into the General section's item slot.
 * @param ctx - client cordis context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map