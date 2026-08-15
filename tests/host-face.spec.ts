// Cleanroom gate: the plugin must load and behave against the PUBLISHED
// 0.1.0-rc.6 dependencies. This suite covers the plain-ESM faces (host apply,
// schema declaration, boot injection). The client DOM runtime is covered by
// the real app; its bundle imports loader-artifact packages that need the
// browser module system, which a bare vitest run cannot provide.
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { apply as nodeApply, WALLPAPER_URL } from '@joeytisaly/dsh-client-ui-wallpaper'
import { WallpaperSettingsSchema } from '@joeytisaly/dsh-client-ui-wallpaper/src/wallpaper-settings.ts'
import { injectBootWallpaper } from '@joeytisaly/dsh-client-ui-wallpaper/src/boot-wallpaper.ts'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'

describe('wallpaper plugin against published deps', () => {
  it('host apply waits for optional Host services without throwing', () => {
    nodeApply(new Context())
    expect(true).toBe(true)
  })

  it('schema and constants are exported for the Host registration', () => {
    // schemastery schemas validate inside the settings service; consumers
    // assert the declared shape and the wire constants here.
    expect(WallpaperSettingsSchema).toBeDefined()
    expect(WALLPAPER_URL).toBe('/wallpaper')
  })

  it('boot injection embeds the wallpaper only when enabled', () => {
    const html = '<html><head></head><body><div id="root"></div></body></html>'
    const injected = injectBootWallpaper(html, true)
    expect(injected).toContain(WALLPAPER_URL)
    expect(injected).toContain('<body>')
    expect(injected).toContain('backgroundSize')
    expect(injectBootWallpaper(html, false)).toBe(html)
  })

  it('host apply registers the settings namespace and the wallpaper route when services are composed', async () => {
    const ctx = new Context()
    const registered: Array<[string, unknown]> = []
    const routes: Array<{ path: string; kind: string }> = []
    ctx.provide('settings', {
      register: (namespace: string, schema: unknown) => { registered.push([namespace, schema]) },
    } as never)
    ctx.provide('webServer', {
      tapIndex: () => () => {},
      register: (route: { path: string; kind: string }) => { routes.push(route); return () => {} },
    } as never)
    ctx.provide('dshHomePath', (...segments: string[]) => ['C:\\home', ...segments].join('\\'))
    nodeApply(ctx)
    // cordis inject callbacks settle after the current tick once services exist.
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(registered.some(([ns]) => ns === settingsNamespace('ui-wallpaper'))).toBe(true)
    expect(routes.some(route => route.path === WALLPAPER_URL)).toBe(true)
  })
})
