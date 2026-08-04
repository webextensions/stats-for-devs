// @vitest-environment jsdom
// The visibility store reads localStorage and the URL param once, at module scope, so every case here gets a
// fresh copy of the module via `vi.resetModules()` + a dynamic import. That is deliberate: it is exactly the
// "first page load" path being asserted.

import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

const STORAGE_KEY = 'statsForDevs.shown';

const loadStoreAsync = async function () {
    vi.resetModules();
    return await import('./visibility.ts');
};

const setSearch = function (search: string) {
    window.history.replaceState({}, '', `/${search}`);
};

describe('visibility store', function () {
    beforeEach(function () {
        localStorage.clear();
        setSearch('');
    });

    it('should default to hidden when nothing is persisted', async function () {
        const { getShown } = await loadStoreAsync();
        expect(getShown()).toBe(false);
    });

    it('should read the persisted value on load', async function () {
        localStorage.setItem(STORAGE_KEY, 'yes');
        const { getShown } = await loadStoreAsync();
        expect(getShown()).toBe(true);
    });

    it('setShown should persist "yes" / "no"', async function () {
        const { setShown } = await loadStoreAsync();

        setShown(true);
        expect(localStorage.getItem(STORAGE_KEY)).toBe('yes');

        setShown(false);
        expect(localStorage.getItem(STORAGE_KEY)).toBe('no');
    });

    it('toggleShown should flip the current value', async function () {
        const { getShown, toggleShown } = await loadStoreAsync();

        toggleShown();
        expect(getShown()).toBe(true);

        toggleShown();
        expect(getShown()).toBe(false);
    });

    it('subscribe should notify listeners and stop after the returned disposer runs', async function () {
        const { setShown, subscribe } = await loadStoreAsync();
        const listener = vi.fn();

        const unsubscribe = subscribe(listener);
        setShown(true);
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();
        setShown(false);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('setShown should not notify listeners when the value is unchanged', async function () {
        // Guards the `next === shown` early-out. Without it, `useSyncExternalStore` consumers would re-render
        // on every no-op set.
        const { setShown, subscribe } = await loadStoreAsync();
        const listener = vi.fn();

        subscribe(listener);
        setShown(false);
        expect(listener).not.toHaveBeenCalled();

        setShown(true);
        setShown(true);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('?statsForDevs=yes should force the overlay shown, overriding a persisted "no"', async function () {
        localStorage.setItem(STORAGE_KEY, 'no');
        setSearch('?statsForDevs=yes');

        const { getShown } = await loadStoreAsync();
        expect(getShown()).toBe(true);
    });

    it('should ignore the URL param when it is not exactly "yes"', async function () {
        setSearch('?statsForDevs=1');
        const { getShown } = await loadStoreAsync();
        expect(getShown()).toBe(false);
    });
});
