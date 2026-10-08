// Stand-in for `lit`, used only when the real package is absent from the test
// dependency cache. That cache (the release pipeline's) provisions just the
// base devDependencies, so a newly added package can be missing even though
// the lockfile pins it. The source-importing unit tests exercise the card's
// non-render logic and none of them call html()/render(), so this stub only has
// to satisfy the module graph. Rendering is covered for real by
// test/render-escaping.test.js (the committed bundle, in Chromium) and by the
// e2e smoke test. When the real package is installed the resolve hook in
// lit-resolve-hook.mjs prefers it, so CI loads the true implementation.
export const nothing = Symbol.for('lit-nothing');
export const html = () => ({});
export const render = () => {};
export const unsafeHTML = (value) => value;
export const ifDefined = (value) => value;
