/**
 * Wallpaper preference row registered into the General section item slot
 * (below the Appearance row): current state, a photo picker, and a remove
 * control. Picking uploads the image bytes to the host `/wallpaper` route;
 * the wallpaper service persists the on/off flag through the settings scope
 * and projects the served URL onto the body background.
 */
import { useRef, useState } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { createWallpaperRowStore } from './settings-store.ts'
import css from './WallpaperRow.module.css'

/** Injected business face: the upload/remove writes over the host route. */
export interface WallpaperRowInjected {
  /** Upload the picked image and enable the wallpaper. */
  pickWallpaper: (file: File) => Promise<void>
  /** Remove the wallpaper file and disable it. */
  removeWallpaper: () => Promise<void>
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type WallpaperRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createWallpaperRowStore>>
  & PropsLocale<'settings.wallpaper'> & WallpaperRowInjected

/**
 * Render the Wallpaper row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function WallpaperRow({ t, pickWallpaper, removeWallpaper, useStore }: WallpaperRowComponentProps) {
  const wallpaper = useStore(s => s.wallpaper)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) return
    setBusy(true)
    setFailed(false)
    try {
      await pickWallpaper(file)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
      if (inputRef.current !== null) inputRef.current.value = ''
    }
  }

  return (
    <div className={css.group}>
      <div className={css.title}>{t('wallpaper.title')}</div>
      <div className={css.row}>
        <span className={css.state}>{wallpaper ? t('wallpaper.set') : t('wallpaper.unset')}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={css.file}
          onChange={(event) => { void onFile(event.target.files?.[0]) }}
        />
        <button
          type="button"
          className={css.button}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {t('wallpaper.pick')}
        </button>
        {wallpaper && (
          <button
            type="button"
            className={css.button}
            disabled={busy}
            onClick={() => { void removeWallpaper().catch(() => setFailed(true)) }}
          >
            {t('wallpaper.remove')}
          </button>
        )}
      </div>
      {failed && <div className={css.error}>{t('wallpaper.failed')}</div>}
    </div>
  )
}
