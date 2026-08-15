import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Wallpaper preference row registered into the General section item slot
 * (below the Appearance row): current state, a photo picker, and a remove
 * control. Picking uploads the image bytes to the host `/wallpaper` route;
 * the wallpaper service persists the on/off flag through the settings scope
 * and projects the served URL onto the body background.
 */
import { useRef, useState } from 'react';
import css from './WallpaperRow.module.css';
/**
 * Render the Wallpaper row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function WallpaperRow({ t, pickWallpaper, removeWallpaper, useStore }) {
    const wallpaper = useStore(s => s.wallpaper);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const inputRef = useRef(null);
    const onFile = async (file) => {
        if (file === undefined)
            return;
        setBusy(true);
        setFailed(false);
        try {
            await pickWallpaper(file);
        }
        catch {
            setFailed(true);
        }
        finally {
            setBusy(false);
            if (inputRef.current !== null)
                inputRef.current.value = '';
        }
    };
    return (_jsxs("div", { className: css.group, children: [_jsx("div", { className: css.title, children: t('wallpaper.title') }), _jsxs("div", { className: css.row, children: [_jsx("span", { className: css.state, children: wallpaper ? t('wallpaper.set') : t('wallpaper.unset') }), _jsx("input", { ref: inputRef, type: "file", accept: "image/*", className: css.file, onChange: (event) => { void onFile(event.target.files?.[0]); } }), _jsx("button", { type: "button", className: css.button, disabled: busy, onClick: () => inputRef.current?.click(), children: t('wallpaper.pick') }), wallpaper && (_jsx("button", { type: "button", className: css.button, disabled: busy, onClick: () => { void removeWallpaper().catch(() => setFailed(true)); }, children: t('wallpaper.remove') }))] }), failed && _jsx("div", { className: css.error, children: t('wallpaper.failed') })] }));
}
//# sourceMappingURL=WallpaperRow.js.map