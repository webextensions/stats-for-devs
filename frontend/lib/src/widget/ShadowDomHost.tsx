// Reusable shadow-DOM host: renders any React subtree inside its own shadow root so the widget
// is isolated from host-page CSS (and vice versa). The subtree stays in the React tree via
// createPortal, so context, events and state keep working as usual. Styles are passed in as
// compiled CSS text (import '<file>.css?inline') because host-page stylesheets do not reach a
// shadow root: they are applied via constructable stylesheets (adoptedStyleSheets) where
// supported, with a <style>-element fallback (older browsers, jsdom). This component is a
// generic utility - forks keep it as-is and only swap what they render inside it (see
// frontend/lib/src/widget/mount.tsx for the composition with the stub Greeting).

import {
    type ReactNode,
    useLayoutEffect,
    useRef,
    useState
} from 'react';
import { createPortal } from 'react-dom';

interface ShadowDomHostProps {
    children?: ReactNode;
    className?: string;

    // Compiled CSS text entries, applied inside the shadow root (re-applied when the array's
    // identity changes - pass a module-level constant to apply once)
    styleSheets?: string[]
}

const supportsAdoptedStyleSheets = function (shadowRoot: ShadowRoot): boolean {
    return (
        'adoptedStyleSheets' in shadowRoot &&
        typeof CSSStyleSheet === 'function' &&
        'replaceSync' in CSSStyleSheet.prototype
    );
};

// Idempotent on both paths: the adopted path replaces the whole adoptedStyleSheets array, the
// fallback path reuses a single marked <style> element instead of appending duplicates.
const applyStyleSheets = function (shadowRoot: ShadowRoot, styleSheets: string[]): void {
    const cssText = styleSheets.join('\n');

    if (supportsAdoptedStyleSheets(shadowRoot)) {
        try {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(cssText);
            shadowRoot.adoptedStyleSheets = [sheet];
            return;
        } catch {
            // Constructable stylesheets advertised but not usable - degrade to the fallback below
        }
    }

    let styleElement = shadowRoot.querySelector<HTMLStyleElement>('style[data-shadow-dom-host-styles]');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.dataset.shadowDomHostStyles = '';
        shadowRoot.prepend(styleElement);
    }
    styleElement.textContent = cssText;
};

const ShadowDomHost = function ({ children, className, styleSheets }: ShadowDomHostProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

    useLayoutEffect(function () {
        const host = hostRef.current;
        if (!host) {
            return;
        }

        // attachShadow throws on a host that already has one (e.g. React StrictMode re-running
        // effects), so reuse the existing root
        const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
        applyStyleSheets(root, styleSheets ?? []);
        setShadowRoot(root);
    }, [styleSheets]);

    return (
        <div ref={hostRef} className={className}>
            {shadowRoot ? createPortal(children, shadowRoot) : null}
        </div>
    );
};

export type { ShadowDomHostProps };
export { ShadowDomHost };
