/**
 * Photo wallpaper surface treatment, injected as one `<style data-plugin-css>`
 * tag by the browser plugin. The photo is applied to `body` by the runtime as
 * an inline background-image; these rules size it and make the alias surfaces
 * translucent so the photo shows through them. Text tokens are left untouched,
 * so contrast stays token-driven (the same treatment the shell stylesheet
 * applied before this feature was extracted into its own plugin).
 */
export const WALLPAPER_SURFACE_CSS = `body {
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  /* light-palette translucent surfaces (high transparency — the photo shows
     through; only popover/dialog overlays stay nearly opaque for readability) */
  --dsw-alias-bg-base: rgba(255, 255, 255, 0.08);
  --dsw-alias-bg-layer-1: rgba(255, 255, 255, 0.15);
  --dsw-alias-bg-layer-2: rgba(255, 255, 255, 0.12);
  --dsw-alias-bg-layer-3: rgba(255, 255, 255, 0.1);
  --dsw-alias-bg-overlay: rgba(255, 255, 255, 0.85);
  --dsw-specific-sidebar-fill: rgba(255, 255, 255, 0.1);
  --dsw-specific-bubble: rgba(255, 255, 255, 0.18);
  --dsw-specific-bubble-highlight: rgba(255, 255, 255, 0.14);
  --dsw-specific-input-major: rgba(255, 255, 255, 0.15);
  --dsw-alias-markdown-code-block: rgba(255, 255, 255, 0.22);
}

body[data-ds-dark-theme] {
  /* dark-palette translucent surfaces */
  --dsw-alias-bg-base: rgba(15, 17, 21, 0.12);
  --dsw-alias-bg-layer-1: rgba(27, 27, 28, 0.18);
  --dsw-alias-bg-layer-2: rgba(35, 35, 36, 0.15);
  --dsw-alias-bg-layer-3: rgba(44, 44, 46, 0.13);
  --dsw-alias-bg-overlay: rgba(27, 27, 28, 0.88);
  --dsw-specific-sidebar-fill: rgba(27, 27, 28, 0.12);
  --dsw-specific-bubble: rgba(27, 27, 28, 0.2);
  --dsw-specific-bubble-highlight: rgba(44, 44, 46, 0.16);
  --dsw-specific-input-major: rgba(35, 35, 36, 0.18);
  --dsw-alias-markdown-code-block: rgba(21, 21, 23, 0.25);
}`;
//# sourceMappingURL=wallpaper-css.js.map