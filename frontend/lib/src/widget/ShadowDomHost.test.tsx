// @vitest-environment jsdom

// Colocated unit test for the ShadowDomHost component: shadow-root creation, portal rendering
// of children inside the shadow root, and stylesheet application. jsdom lacks constructable
// stylesheets, so these tests exercise the <style>-element fallback path; the adopted-stylesheet
// path is asserted tolerantly (whichever path the environment supports must carry the CSS).
// Kept out of the published tarball by the "!**/*.test.*" negation in package.json.ts's "files".

import '@testing-library/jest-dom/vitest';

import {
    cleanup,
    render
} from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import { ShadowDomHost } from './ShadowDomHost.tsx';

// Testing Library's automatic cleanup only registers itself when a global afterEach exists
// (vitest "globals" is off in this repo), so unmount explicitly between tests
afterEach(cleanup);

const getShadowRoot = function (container: HTMLElement): ShadowRoot {
    const host = container.firstElementChild;
    if (!host || !host.shadowRoot) {
        throw new Error('Expected the host element to carry a shadow root');
    }
    return host.shadowRoot;
};

// The applied CSS text, from whichever mechanism the environment supports
const getAppliedCssText = function (shadowRoot: ShadowRoot): string {
    const adopted = shadowRoot.adoptedStyleSheets;
    if (adopted && adopted.length > 0) {
        return adopted
            .map(function (sheet) {
                return Array.from(sheet.cssRules)
                    .map(function (rule) {
                        return rule.cssText;
                    })
                    .join('\n');
            })
            .join('\n');
    }
    const styleElement = shadowRoot.querySelector('style[data-shadow-dom-host-styles]');
    return styleElement?.textContent ?? '';
};

describe('ShadowDomHost (frontend/lib/src/widget/ShadowDomHost.tsx)', function () {
    it('should attach an open shadow root and render children inside it', function () {
        const { container } = render(
            <ShadowDomHost>
                <p>Inside the shadow</p>
            </ShadowDomHost>
        );
        const shadowRoot = getShadowRoot(container);
        expect(shadowRoot.textContent).toContain('Inside the shadow');
        // The children render inside the shadow root, not in the light DOM
        expect(container.textContent).not.toContain('Inside the shadow');
    });

    it('should apply the styleSheets CSS text inside the shadow root', function () {
        const styleSheets = ['.probe { color: red; }'];
        const { container } = render(
            <ShadowDomHost styleSheets={styleSheets}>
                <p className="probe">Styled</p>
            </ShadowDomHost>
        );
        expect(getAppliedCssText(getShadowRoot(container))).toContain('.probe');
    });

    it('should pass className through to the host element', function () {
        const { container } = render(
            <ShadowDomHost className="host-marker">
                <p>Inside</p>
            </ShadowDomHost>
        );
        expect(container.firstElementChild).toHaveClass('host-marker');
    });

    it('should survive unmount and a re-render into the same container', function () {
        const { container, rerender, unmount } = render(
            <ShadowDomHost>
                <p>First</p>
            </ShadowDomHost>
        );
        rerender(
            <ShadowDomHost>
                <p>Second</p>
            </ShadowDomHost>
        );
        expect(getShadowRoot(container).textContent).toContain('Second');
        expect(function () {
            unmount();
        }).not.toThrow();
    });
});
