import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createWallpaperRowStore } from './settings-store.ts';
/** Injected business face: the upload/remove writes over the host route. */
export interface WallpaperRowInjected {
    /** Upload the picked image and enable the wallpaper. */
    pickWallpaper: (file: File) => Promise<void>;
    /** Remove the wallpaper file and disable it. */
    removeWallpaper: () => Promise<void>;
}
/** Full component props: runtime share + store share + locale seat + injected face. */
export type WallpaperRowComponentProps = PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createWallpaperRowStore>> & PropsLocale<'settings.wallpaper'> & WallpaperRowInjected;
/**
 * Render the Wallpaper row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export declare function WallpaperRow({ t, pickWallpaper, removeWallpaper, useStore }: WallpaperRowComponentProps): import("react").JSX.Element;
//# sourceMappingURL=WallpaperRow.d.ts.map