# @joeytisaly/dsh-client-ui-wallpaper

English | [中文](README.zh.md)

Wallpaper plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web: a photo behind the web surface, set from **General settings → Wallpaper**. The Host half owns the `/wallpaper` route (GET serves the stored photo, POST atomically stores an upload capped at 15 MB, DELETE removes it) with the file rooted at `$DSH_HOME/wallpaper`, registers the durable `ui-wallpaper.enabled` flag through the Host settings document, and injects a pre-plugin bootstrap so the first paint already carries the photo. The browser half reads the flag through the settings scope, projects the served URL onto `document.body` as the background-image (the only DOM write this feature owns), and registers the Wallpaper row into the General section's item slot. It also injects one stylesheet that makes the `--dsw-alias-*` surfaces translucent so the photo shows through, over whatever palette the theme plugin resolved — the theme registry and token sheets are never touched.

The route is method-dispatched on one exact `/wallpaper` path: GET answers with the sniffed content type (`Cache-Control: no-store`), 404 when absent; POST accepts JPEG/PNG/GIF/WebP magic bytes only (413 over the cap, 415 otherwise) and writes atomically (temp file + rename); DELETE always answers 204. A client upload that receives the SPA shell (a missing route answered by the fallback with 200 HTML) is treated as a failure so the flag can never persist without a photo.

Built and tested against the published `0.1.0-rc.6` dependency generation (`tsc` clean, host-face suite green in a clean-room install).

## Model Experience

None, as the plugin manages a browser preference; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Installation

### From npm

```sh
npm i @joeytisaly/dsh-client-ui-wallpaper
```

For a dsh web deployment, register the browser roster row in your web-app composition (next to `ui-theme`):

```yaml
# browser roster (e.g. packages/bundle/web-app/cordis.patch.yml)
- id: ui-wallpaper
  name: '@joeytisaly/dsh-client-ui-wallpaper'
```

Rebuild the client bundles, restart `dsh web`, and hard-refresh the page. The `dsh.client` manifest in this package's `package.json` is what makes the plugin manager and roster scan recognize it as a browser plugin.

### From source

Clone this repository, add it as a workspace package (e.g. under `packages/client/`), add the roster row above, then `tsc -b` + `tsdown` and restart.

## Usage

**Settings → General → Wallpaper**: `选择照片` uploads any image (≤ 15 MB, JPEG/PNG/WebP/GIF) and applies it immediately; `移除` restores the plain translucent theme. The flag persists in `$DSH_HOME/settings.yaml` under `ui-wallpaper.enabled` and the photo at `$DSH_HOME/wallpaper`, so both survive restarts. A dark photo pairs best with the dark palette.

## Compatibility note

The settings row's writability depends on whether the host's api-proxy exposes the `ui-wallpaper` settings namespace (its `WEB_SETTINGS_NAMESPACES` allowlist). The wallpaper itself — the `/wallpaper` route, upload/remove, and the durable `enabled` flag read — works on any host; the **settings row stays disabled** on hosts whose `dsh-host-apiproxy` has not added `ui-wallpaper` to the allowlist. Until a release containing that allowlist change, adjust `$DSH_HOME/settings.yaml` directly (e.g. `ui-wallpaper: { enabled: true }`).

## Known Limitations and Deferred Work

- **Photo readability is scheme-dependent** — a dark photo reads best in the dark palette (light text over dark surfaces); the translucent surfaces it injects are tuned for that pairing. A light-mode readability treatment (frosted glass, per-surface scrims) is deferred.
- **The surface stylesheet is fixed** — translucency values are baked into the injected style; there is no per-user adjustment yet.
- **15 MB upload cap** — a larger photo is rejected with a 413-equivalent client error; raising the cap means changing `WALLPAPER_MAX_BYTES`.
- **Whole-page background only** — no per-column or per-surface image placement; `background-position` is centered (`cover`).
