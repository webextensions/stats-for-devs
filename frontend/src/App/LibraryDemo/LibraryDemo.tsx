// Demos the publishable library (frontend/lib/) inside this dev/demo harness app, covering its
// three consumption modes - all via the public barrel, but through a relative SOURCE import (not
// the built dist/), so the dev build and HMR pick up library edits instantly without a rebuild:
//
// - Light DOM (React tree): renders the stub Greeting the way a React consumer's component tree
//   would; its CSS Modules come along with the import (published consumers import
//   '<package-name>' and its stylesheet via '<package-name>/style.css' instead).
// - Shadow DOM (React tree): the same Greeting isolated inside a ShadowDomHost - host-page CSS
//   does not reach it (note the widget's own baseline styling from widgetStyleSheets).
// - Imperative: mount()/mountInShadowDom()/unmount() driven by buttons against a plain target
//   element, the way a non-React host page (or the standalone script-tag artifact, which wraps
//   these same functions - see frontend/lib/src/widget/standalone.ts) would call them.
//
// Replace/remove together with the stub library API (see
// docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md).

import { useRef } from 'react';

import {
    Greeting,
    mount,
    mountInShadowDom,
    ShadowDomHost,
    unmount,
    widgetStyleSheets
} from '../../../lib/src/index.ts';

const LibraryDemo = function () {
    const imperativeTargetRef = useRef<HTMLDivElement>(null);

    const handleMountClick = function () {
        if (imperativeTargetRef.current) {
            mount(imperativeTargetRef.current, { name: 'Imperative' });
        }
    };
    const handleMountInShadowDomClick = function () {
        if (imperativeTargetRef.current) {
            mountInShadowDom(imperativeTargetRef.current, { name: 'Imperative shadow' });
        }
    };
    const handleUnmountClick = function () {
        if (imperativeTargetRef.current) {
            unmount(imperativeTargetRef.current);
        }
    };

    return (
        <div>
            <h2>Library demo - light DOM</h2>
            <Greeting name="Ada" />

            <h2>Library demo - shadow DOM</h2>
            <ShadowDomHost styleSheets={widgetStyleSheets}>
                <Greeting name="Grace" />
            </ShadowDomHost>

            <h2>Library demo - imperative mount</h2>
            <p>
                <button type="button" onClick={handleMountClick}>Mount</button>
                {' '}
                <button type="button" onClick={handleMountInShadowDomClick}>Mount in shadow DOM</button>
                {' '}
                <button type="button" onClick={handleUnmountClick}>Unmount</button>
            </p>
            <div ref={imperativeTargetRef} />
        </div>
    );
};

export { LibraryDemo };
