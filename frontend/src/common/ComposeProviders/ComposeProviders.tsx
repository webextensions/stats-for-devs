import {
    cloneElement,
    type ReactElement,
    type ReactNode
} from 'react';

// Folds a FLAT list of provider elements into the usual nested tree, so the list stays
// one-provider-per-line (append-only, merge-friendly across template branches). Order is
// semantic: index 0 is the OUTERMOST provider - do not alphabetize.
// Rationale: because/frontend-build/flat-provider-composition.md
const ComposeProviders = function ({
    providers,
    children
}: {
    providers: ReactElement[]; // outermost first; each must accept children
    children: ReactNode
}) {
    let tree: ReactNode = children;
    for (const provider of providers.toReversed()) {
        tree = cloneElement(provider, undefined, tree);
    }

    return <>{tree}</>;
};

export { ComposeProviders };
