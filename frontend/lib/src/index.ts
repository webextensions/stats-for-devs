// Library entry point - the package's public API. tsdown bundles this into dist/index.js (the
// "." export in package.json.ts) with bundled type declarations (dist/index.d.ts); react /
// react-dom stay external and resolve from the consuming project (see "peerDependencies" in
// package.json.ts). Named exports only - no default export.
//
// The React-specific code lives under ./react/ (components/, hooks/, mount.tsx); the widget
// layer lives under ./widget/ (ShadowDomHost, mountInShadowDom, plus the standalone script-tag
// entry standalone.ts, which is its own tsdown entry and deliberately NOT re-exported here);
// future areas can join as ./<area>/ siblings and be re-exported from this same barrel. Widen
// the re-exports as you add modules; forks replace the stub API (Greeting / useCounter / mount)
// with their package's real one (see docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md).

export type { GreetingProps } from './react/components/Greeting/Greeting.tsx';
export { Greeting } from './react/components/Greeting/Greeting.tsx';
export type { UseCounterOptions } from './react/hooks/useCounter/useCounter.ts';
export { useCounter } from './react/hooks/useCounter/useCounter.ts';
export { mount, unmount } from './react/mount.tsx';
export { mountInShadowDom, widgetStyleSheets } from './widget/mount.tsx';
export type { ShadowDomHostProps } from './widget/ShadowDomHost.tsx';
export { ShadowDomHost } from './widget/ShadowDomHost.tsx';
