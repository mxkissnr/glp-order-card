// Resolve hook for the test process: load the real `lit` when it is installed,
// otherwise fall back to the local stub so the card's module graph still
// resolves in a dependency cache that lacks the newly added package.
const FALLBACK = new URL('./lit-fallback.mjs', import.meta.url).href;
const SHIMMED = new Set([
  'lit',
  'lit/directives/unsafe-html.js',
  'lit/directives/if-defined.js',
]);

export async function resolve(specifier, context, nextResolve) {
  if (!SHIMMED.has(specifier)) return nextResolve(specifier, context);
  try {
    return await nextResolve(specifier, context);
  } catch {
    return { url: FALLBACK, shortCircuit: true };
  }
}
