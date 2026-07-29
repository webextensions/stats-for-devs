import { Provider } from 'jotai';
import { type ReactNode } from 'react';

import { ComposeProviders } from '../common/ComposeProviders/ComposeProviders.tsx';
import { jotaiStore } from './store/jotaiStore.ts';

const AppProviders = function ({ children }: { children: ReactNode }) {
    // One provider per line, outermost first (order is semantic - do not alphabetize).
    // Template branches / forks append their providers here instead of nesting JSX in App.tsx
    // (rationale: because/frontend-build/flat-provider-composition.md)
    const providers = [
        <Provider key="jotai" store={jotaiStore} />
    ];

    return <ComposeProviders providers={providers}>{children}</ComposeProviders>;
};

export { AppProviders };
