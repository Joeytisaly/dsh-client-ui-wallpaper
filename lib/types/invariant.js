/**
 * Package-owned invariant companion for `@joeytisaly/dsh-client-ui-wallpaper`.
 * @module @joeytisaly/dsh-client-ui-wallpaper/invariant
 */
const PACKAGE_NAME = '@joeytisaly/dsh-client-ui-wallpaper';
/** Cordis companion plugin name. */
export const name = 'client-ui-wallpaper-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: the settings scope validates and publishes the durable
 * wallpaper flag, and the browser service owns the single DOM write (the body
 * background-image). Route/settings agreement is covered directly by this
 * package's Host, scope, and service behavior specs.
 */
const install = () => { };
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map