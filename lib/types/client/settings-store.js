/**
 * Wallpaper row slot store: a mirror of the wallpaper service state. The
 * plugin's apply-world change listener is the only writer; the row component
 * reads via props.useStore.
 */
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Declares the Wallpaper row state and write surface.
 * @returns the store handle.
 */
export function createWallpaperRowStore() {
    return defineStore({
        init: () => ({ wallpaper: false, revision: -1 }),
        actions: {
            sync: (d, wallpaper, revision) => {
                if (revision <= d.revision)
                    return;
                d.wallpaper = wallpaper;
                d.revision = revision;
            },
        },
    });
}
//# sourceMappingURL=settings-store.js.map