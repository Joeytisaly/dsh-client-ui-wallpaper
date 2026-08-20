import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";
//#region lib/types/wallpaper-settings.js
/** Durable wallpaper settings owned by the wallpaper plugin. */
/** Settings namespace owned by the wallpaper plugin. */
const WALLPAPER_SETTINGS_NAMESPACE = "ui-wallpaper";
/** Field carrying the wallpaper on/off flag. */
const WALLPAPER_FIELD = "enabled";
/** Served wallpaper URL (host route; the photo is absent when unset). */
const WALLPAPER_URL = "/wallpaper";
/** Upload cap for wallpaper image bytes. */
const WALLPAPER_MAX_BYTES = 15728640;
/** Durable wallpaper schema; also the wire envelope the browser scope validates against. */
const WallpaperSettingsSchema = z.object({ [WALLPAPER_FIELD]: z.boolean().default(false) });
//#endregion
//#region lib/types/boot-wallpaper.js
/**
* Host-rendered wallpaper bootstrap for the browser's pre-plugin interval.
* When the durable wallpaper flag is enabled, each index response embeds an
* inline script that pins the body background to the wallpaper route before
* the shell mounts, so the first paint carries the photo instead of a blank
* translucent surface. The browser plugin re-applies the same write after the
* plugin tree activates (idempotent, no flicker).
*/
/** Build the inline script that applies the wallpaper pre-render. */
function bootWallpaperScript() {
	return `<script>(() => {
  document.body.style.backgroundImage = ${JSON.stringify(`url("${WALLPAPER_URL}")`)}
  document.body.style.backgroundSize = 'cover'
  document.body.style.backgroundPosition = 'center'
  document.body.style.backgroundAttachment = 'fixed'
  document.body.style.backgroundRepeat = 'no-repeat'
})()<\/script>`;
}
/**
* Insert the wallpaper bootstrap immediately after the opening body tag when
* the wallpaper is enabled; otherwise return the HTML untouched.
* @param html - Raw application index HTML.
* @param enabled - Whether the durable wallpaper flag is currently set.
* @returns HTML containing the wallpaper bootstrap when enabled.
*/
function injectBootWallpaper(html, enabled) {
	if (!enabled) return html;
	const script = bootWallpaperScript();
	const body = /<body(?:\s[^>]*)?>/i.exec(html);
	if (body === null) return `${html}${script}`;
	const at = body.index + body[0].length;
	return `${html.slice(0, at)}${script}${html.slice(at)}`;
}
//#endregion
//#region lib/types/index.js
/** Host registration for the wallpaper route, its durable flag, and the pre-plugin bootstrap. */
const WALLPAPER_NAMESPACE = settingsNamespace(WALLPAPER_SETTINGS_NAMESPACE);
/** Read the registered wallpaper flag or default to off without a settings provider. */
function readEnabled(ctx) {
	const settings = ctx.get("settings");
	if (settings === void 0) return false;
	return settings.get(WALLPAPER_NAMESPACE)?.enabled === true;
}
/** Sniff an image's media type from its magic bytes (JPEG/PNG/GIF/WebP). */
function sniffImageType(bytes) {
	if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
	if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) return "image/png";
	if (bytes.length >= 6 && bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 56 && (bytes[4] === 55 || bytes[4] === 57) && bytes[5] === 97) return "image/gif";
	if (bytes.length >= 12 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) return "image/webp";
	return null;
}
/** Collect a request body with a hard size cap. */
async function readBody(req, cap) {
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		total += buffer.length;
		if (total > cap) throw new Error(`wallpaper body exceeds ${cap} bytes`);
		chunks.push(buffer);
	}
	return Buffer.concat(chunks);
}
/** Serve the stored wallpaper with a sniffed content type; 404 when absent. */
async function handleWallpaperGet(_req, res, path) {
	try {
		const bytes = await readFile(path);
		const type = sniffImageType(bytes);
		if (type === null) {
			res.writeHead(415);
			res.end();
			return;
		}
		res.writeHead(200, {
			"Content-Type": type,
			"Cache-Control": "no-store"
		});
		res.end(bytes);
	} catch (error) {
		if (error.code === "ENOENT") {
			res.writeHead(404);
			res.end();
			return;
		}
		res.writeHead(500);
		res.end();
	}
}
/** Atomically store an uploaded wallpaper image; 413 over the cap, 415 for non-images. */
async function handleWallpaperPost(req, res, path) {
	try {
		const bytes = await readBody(req, WALLPAPER_MAX_BYTES);
		if (sniffImageType(bytes) === null) {
			res.writeHead(415);
			res.end();
			return;
		}
		await mkdir(dirname(path), { recursive: true });
		const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
		await writeFile(temporary, bytes);
		await rename(temporary, path);
		res.writeHead(204);
		res.end();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.writeHead(message.startsWith("wallpaper body exceeds") ? 413 : 500);
		res.end();
	}
}
/** Remove the stored wallpaper; 204 regardless of prior presence. */
async function handleWallpaperDelete(_req, res, path) {
	await rm(path, { force: true });
	res.writeHead(204);
	res.end();
}
/**
* Register the durable wallpaper section, the wallpaper route, and the
* pre-plugin bootstrap when their optional Host services are composed.
* @param ctx - Host context that may acquire settings and HTTP services.
*/
function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(WALLPAPER_NAMESPACE, WallpaperSettingsSchema);
	});
	ctx.inject(["webServer"], (httpCtx) => {
		httpCtx.effect(() => httpCtx.webServer.tapIndex((html) => injectBootWallpaper(html, readEnabled(ctx))), "client-ui-wallpaper: wallpaper bootstrap");
		const home = httpCtx.dshHomePath;
		if (home === void 0) {
			httpCtx.logger.warn("client-ui-wallpaper: dshHomePath is unavailable; wallpaper route not registered");
			return;
		}
		const wallpaperPath = () => home("wallpaper");
		const dispose = httpCtx.webServer.register({
			kind: "exact",
			path: WALLPAPER_URL,
			handler: async (req, res) => {
				const method = req.method ?? "GET";
				if (method === "GET") return handleWallpaperGet(req, res, wallpaperPath());
				if (method === "POST") return handleWallpaperPost(req, res, wallpaperPath());
				if (method === "DELETE") return handleWallpaperDelete(req, res, wallpaperPath());
				res.writeHead(405, { Allow: "GET, POST, DELETE" });
				res.end();
			}
		});
		httpCtx.effect(() => dispose, "client-ui-wallpaper: wallpaper route");
	});
}
//#endregion
export { WALLPAPER_FIELD, WALLPAPER_MAX_BYTES, WALLPAPER_SETTINGS_NAMESPACE, WALLPAPER_URL, apply };
