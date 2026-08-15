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
import type { Context } from '@deepseek-ai/cordis'
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { WallpaperRow, type WallpaperRowInjected } from './WallpaperRow.tsx'
import { createWallpaperRowStore } from './settings-store.ts'
import { en, zh, type WallpaperKey } from './locales.ts'
import { WALLPAPER_SURFACE_CSS } from './wallpaper-css.ts'
import {
  WALLPAPER_FIELD, WALLPAPER_MAX_BYTES, WALLPAPER_SETTINGS_NAMESPACE, WALLPAPER_URL,
  type WallpaperSettings,
} from '../wallpaper-settings.ts'

export type { WallpaperRowComponentProps, WallpaperRowInjected } from './WallpaperRow.tsx'
export type { WallpaperRowState } from './settings-store.ts'
export type { WallpaperKey } from './locales.ts'
export type { WallpaperSettings } from '../wallpaper-settings.ts'

/** Namespace owning this feature's settings-row copy. */
export const SETTINGS_NS = 'settings.wallpaper'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The Wallpaper settings row's copy. */
    'settings.wallpaper': WallpaperKey
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    wallpaper: WallpaperRuntime
  }
  interface Events {
    /**
     * Wallpaper state changed (enabled flag toggled).
     * @param enabled - whether the wallpaper is now applied.
     * @param revision - monotonic change counter.
     * @mode emit
     */
    'wallpaper/change'(enabled: boolean, revision: number): void
  }
}

const STYLE_ID = 'dsh-ui-wallpaper:surface'

/** Inject the photo-surface treatment stylesheet once per document. */
function ensureWallpaperStyles(): void {
  if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = '@deepseek-ai/dsh-client-ui-wallpaper'
  tag.dataset.pluginCss = STYLE_ID
  tag.textContent = WALLPAPER_SURFACE_CSS
  document.head.appendChild(tag)
}

/**
 * Wallpaper flag owner and single DOM writer. Reads go through
 * {@link isEnabled}; writes only through {@link setEnabled}; continuous sync
 * only through the `wallpaper/change` event. The body background-image is the
 * only property this service ever touches, so it cannot fight the theme
 * presenter or foreign styles.
 */
export class WallpaperRuntime {
  private readonly ctx: Context
  private readonly host: SettingsScope<WallpaperSettings>
  private enabled = false
  private revision = 0

  /**
   * @param ctx - owning context (change events are emitted on it; the scope
   * listener is released through ctx.effect on dispose).
   * @param host - durable flag scope owned by the same plugin.
   */
  constructor(ctx: Context, host: SettingsScope<WallpaperSettings>) {
    this.ctx = ctx
    this.host = host
    ctx.effect(() => host.subscribe(() => { this.adopt() }), 'ui-wallpaper: settings scope adoption')
    this.adopt()
  }

  /** Whether the wallpaper is currently applied. */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Toggle the photo wallpaper. The on/off flag persists through the settings
   * scope; the photo bytes themselves live at the host wallpaper route.
   * @param enabled - whether to show the wallpaper.
   */
  setEnabled(enabled: boolean): void {
    void this.host.set(WALLPAPER_FIELD, enabled)
    this.applyEnabled(enabled)
  }

  /** Adopt the scope's accepted durable flag without writing it back. */
  private adopt(): void {
    const section = this.host.getSnapshot().value
    const enabled = section?.enabled === true
    if (enabled === this.enabled) return
    this.applyEnabled(enabled)
  }

  /** Apply the flag to the document and publish the change. */
  private applyEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (enabled) {
      document.body.style.backgroundImage = `url("${WALLPAPER_URL}")`
    } else {
      document.body.style.removeProperty('background-image')
    }
    this.revision += 1
    this.ctx.emit('wallpaper/change', enabled, this.revision)
  }
}

/** Required services: settings transport plus slots/locale for the Wallpaper row. */
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope']

/**
 * Client plugin body: inject the surface-treatment stylesheet, provide the
 * wallpaper service, and register the feature-owned Wallpaper settings row
 * into the General section's item slot.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  ensureWallpaperStyles()
  const host = ctx.settingsScope.bind<WallpaperSettings>({ namespace: WALLPAPER_SETTINGS_NAMESPACE })
  const wallpaper = new WallpaperRuntime(ctx, host)
  ctx.provide('wallpaper', wallpaper)

  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'ui-wallpaper: row dictionaries')

  const store = createWallpaperRowStore()
  let bound: BoundActions<typeof store> | undefined
  const sync = (enabled: boolean, revision: number): void => {
    bound?.sync(enabled, revision)
  }
  ctx.on('wallpaper/change', sync)
  const injected = (actions: BoundActions<typeof store>): WallpaperRowInjected => {
    bound = actions
    // Re-sync from the getter so no event is lost between registration and
    // first render (the store's revision guard drops stale duplicates).
    sync(wallpaper.isEnabled(), 0)
    return {
      pickWallpaper: async (file: File): Promise<void> => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`wallpaper: "${file.name}" is not an image file`)
        }
        if (file.size > WALLPAPER_MAX_BYTES) {
          throw new Error(`wallpaper: "${file.name}" exceeds ${WALLPAPER_MAX_BYTES} bytes`)
        }
        const response = await fetch(WALLPAPER_URL, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!response.ok) throw new Error(`wallpaper upload failed: HTTP ${response.status}`)
        // A SPA fallback answering a missing route returns the app shell with
        // 200 — a false success that would persist the flag with no photo
        // stored. Treat any HTML response as failure.
        if ((response.headers.get('content-type') ?? '').includes('text/html')) {
          throw new Error('wallpaper upload failed: server answered with the app shell (restart dsh web to load the wallpaper route)')
        }
        wallpaper.setEnabled(true)
      },
      removeWallpaper: async (): Promise<void> => {
        const response = await fetch(WALLPAPER_URL, { method: 'DELETE' })
        if (!response.ok) throw new Error(`wallpaper removal failed: HTTP ${response.status}`)
        wallpaper.setEnabled(false)
      },
    }
  }
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'wallpaper',
    order: 20,
    store,
    locale: SETTINGS_NS,
    inject: injected,
  }, WallpaperRow))
}
