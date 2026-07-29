// Imperative mount/unmount helpers for non-React host pages: attach the Greeting component to a
// plain DOM element without writing any React code. React-app consumers render <Greeting />
// directly instead. Idempotent per target element (a second mount() on the same element reuses
// its root and just re-renders with the new props). The widget area's mountInShadowDom()
// (frontend/lib/src/widget/mount.tsx) renders through the same renderIntoTarget() helper and
// roots registry, so the single unmount() below tears down either kind of mount.

import { type ReactElement } from 'react';
import {
    createRoot,
    type Root
} from 'react-dom/client';

import {
    Greeting,
    type GreetingProps
} from './components/Greeting/Greeting.tsx';

const mountedRoots = new WeakMap<Element, Root>();

// Not part of the public barrel - imported by the sibling widget area only
const renderIntoTarget = function (target: Element, element: ReactElement): void {
    let root = mountedRoots.get(target);
    if (!root) {
        root = createRoot(target);
        mountedRoots.set(target, root);
    }
    root.render(element);
};

const mount = function (target: Element, props: GreetingProps = {}): void {
    renderIntoTarget(target, <Greeting {...props} />);
};

const unmount = function (target: Element): void {
    const root = mountedRoots.get(target);
    if (root) {
        root.unmount();
        mountedRoots.delete(target);
    }
};

export { mount, renderIntoTarget, unmount };
