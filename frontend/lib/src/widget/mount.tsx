// Imperative shadow-DOM twin of react/mount.tsx's mount(): renders the stub Greeting wrapped in
// a ShadowDomHost, so the widget carries its styles inside the shadow root (no dist/style.css
// <link> needed for this path) and is isolated from host-page CSS. The shadow stylesheet is the
// same *.module.css file imported twice: normally (for the scoped class names) and as "?inline"
// (for the CSS text), with scopeCssModuleText() reconciling the two (see its header for why -
// @tsdown/css inlines the RAW text). Renders through react/mount.tsx's shared
// renderIntoTarget()/roots registry, so the package's single unmount() tears down shadow mounts
// too. Forks replace the Greeting composition here alongside the rest of the stub API.

import {
    button,
    greeting,
    title
} from '../react/components/Greeting/Greeting.module.css';
import greetingCssText from '../react/components/Greeting/Greeting.module.css?inline';
import {
    Greeting,
    type GreetingProps
} from '../react/components/Greeting/Greeting.tsx';
import { renderIntoTarget } from '../react/mount.tsx';
import { scopeCssModuleText } from './scopeCssModuleText.ts';
import shadowResetCssText from './shadow-reset.css?inline';
import { ShadowDomHost } from './ShadowDomHost.tsx';

// Module-level constant so ShadowDomHost applies the styles once per mount (see its styleSheets
// prop note); shadow-reset.css first so component styles can override the baseline. Exported so
// React-tree consumers can pair it with ShadowDomHost themselves:
// <ShadowDomHost styleSheets={widgetStyleSheets}><Greeting /></ShadowDomHost>
const widgetStyleSheets = [
    shadowResetCssText,
    scopeCssModuleText(greetingCssText, { button, greeting, title })
];

const mountInShadowDom = function (target: Element, props: GreetingProps = {}): void {
    renderIntoTarget(
        target,
        <ShadowDomHost styleSheets={widgetStyleSheets}>
            <Greeting {...props} />
        </ShadowDomHost>
    );
};

export { mountInShadowDom, widgetStyleSheets };
