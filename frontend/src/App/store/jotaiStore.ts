import {
    atom,
    createStore
} from 'jotai';

// Explicit store instance (passed to <Provider store={jotaiStore}>) so non-React code can read /
// write atoms too - mirrors the web-app-template's frontend/src/App/store/jotaiStore.ts
const jotaiStore = createStore();

// Demo atom exercised by the placeholder App
const counterAtom = atom(0);

export {
    counterAtom,
    jotaiStore
};
