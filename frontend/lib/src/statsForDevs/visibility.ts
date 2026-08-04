// Visibility ("is the overlay shown?") store. A plain-JS observable with localStorage persistence and a
// `?statsForDevs=yes` URL-param override, plus a React adapter hook.
//
// This store deliberately owns the show/hide state (rather than taking it from the host page), and it depends
// on nothing but React's `useSyncExternalStore`. That is what lets `windowApi.ts` install the
// `window.statsForDevs` console controls eagerly, before the overlay's lazy-loaded chunk exists.
//
// Top-level access to `window` / `localStorage` is guarded so importing this module is safe under a
// non-browser (SSR / node test) environment.

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'statsForDevs.shown';
const URL_PARAM = 'statsForDevs';

const flagBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readInitialShown = function (): boolean {
    if (!flagBrowser) {
        return false;
    }
    if ((new URLSearchParams(window.location.search)).get(URL_PARAM) === 'yes') {
        return true;
    }
    return localStorage.getItem(STORAGE_KEY) === 'yes';
};

let shown = readInitialShown();
const listeners = new Set<VoidFunction>();

const getShown = function (): boolean {
    return shown;
};

const setShown = function (next: boolean) {
    if (next === shown) {
        return;
    }
    shown = next;
    if (flagBrowser) {
        localStorage.setItem(STORAGE_KEY, next ? 'yes' : 'no');
    }
    for (const listener of listeners) {
        listener();
    }
};

const toggleShown = function () {
    setShown(!shown);
};

const subscribe = function (listener: VoidFunction): VoidFunction {
    listeners.add(listener);
    return function () {
        listeners.delete(listener);
    };
};

const useStatsForDevsShown = function (): boolean {
    return useSyncExternalStore(subscribe, getShown, getShown);
};

export {
    getShown,
    setShown,
    subscribe,
    toggleShown,
    useStatsForDevsShown
};
