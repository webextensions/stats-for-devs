// Small DOM helpers shared across the overlay (metric readers, event trackers, scrollbar styling).

// A short, human-readable selector for an element: `tag#id.firstClass` (e.g. `button#save.primary`).
const describeElement = function (el: Element | null): string {
    if (!el || !(el instanceof Element)) {
        return '(none)';
    }
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const firstClass = (typeof el.className === 'string' && el.className.trim()) ?
        `.${el.className.trim().split(/\s+/, 1)[0]}` :
        '';
    return `${tag}${id}${firstClass}`;
};

// Whether the browser/OS uses persistent (space-occupying / "classic") scrollbars - e.g. Chrome/Edge/
// Firefox on Windows - as opposed to overlay (auto-hiding, zero-width) scrollbars (Chrome on Android,
// default macOS). Measured once via a hidden probe and cached, since it is stable for a session.
let cachedPersistentScrollbar: boolean | null = null;

const hasPersistentScrollbar = function (): boolean {
    if (cachedPersistentScrollbar !== null) {
        return cachedPersistentScrollbar;
    }
    if (typeof document === 'undefined') {
        return false;
    }

    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.top = '-9999px';
    probe.style.width = '100px';
    probe.style.height = '100px';
    probe.style.overflow = 'scroll';
    document.body.append(probe);

    cachedPersistentScrollbar = probe.offsetWidth > probe.clientWidth;
    probe.remove();

    return cachedPersistentScrollbar;
};

export {
    describeElement,
    hasPersistentScrollbar
};
