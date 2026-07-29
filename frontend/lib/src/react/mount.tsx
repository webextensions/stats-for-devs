// Imperative mount/unmount helpers for non-React host pages: attach the Greeting component to a
// plain DOM element without writing any React code. React-app consumers render <Greeting />
// directly instead. Idempotent per target element (a second mount() on the same element reuses
// its root and just re-renders with the new props).

import {
    createRoot,
    type Root
} from 'react-dom/client';

import {
    Greeting,
    type GreetingProps
} from './components/Greeting/Greeting.tsx';

const mountedRoots = new WeakMap<Element, Root>();

const mount = function (target: Element, props: GreetingProps = {}): void {
    let root = mountedRoots.get(target);
    if (!root) {
        root = createRoot(target);
        mountedRoots.set(target, root);
    }
    root.render(<Greeting {...props} />);
};

const unmount = function (target: Element): void {
    const root = mountedRoots.get(target);
    if (root) {
        root.unmount();
        mountedRoots.delete(target);
    }
};

export { mount, unmount };
