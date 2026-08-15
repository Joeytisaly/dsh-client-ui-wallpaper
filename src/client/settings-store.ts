/**
 * Wallpaper row slot store: a mirror of the wallpaper service state. The
 * plugin's apply-world change listener is the only writer; the row component
 * reads via props.useStore.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'

/** Store state mirrored from the wallpaper service. */
export interface WallpaperRowState {
  /** Whether a photo wallpaper is currently applied. */
  wallpaper: boolean
  /** Service revision; -1 until first sync so revision 0 lands as a change. */
  revision: number
}

/** Declared action shape giving the exported factory a stable return type. */
type WallpaperRowActions = {
  sync: (draft: WallpaperRowState, wallpaper: boolean, revision: number) => void
}

/**
 * Declares the Wallpaper row state and write surface.
 * @returns the store handle.
 */
export function createWallpaperRowStore(): EngineStoreHandle<WallpaperRowState, WallpaperRowActions> {
  return defineStore({
    init: (): WallpaperRowState => ({ wallpaper: false, revision: -1 }),
    actions: {
      sync: (d, wallpaper: boolean, revision: number) => {
        if (revision <= d.revision) return
        d.wallpaper = wallpaper
        d.revision = revision
      },
    },
  })
}
