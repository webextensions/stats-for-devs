import classNames from 'classnames';
import { useAtom } from 'jotai';

// Named imports from CSS Modules (not `import styles from ...`) so a typo in a class name fails
// the build via the MISSING_EXPORT guard in frontend/build/build-config-generator.ts
import {
    app,
    centeredColumn,
    title
} from './App.module.css';
import { AppProviders } from './AppProviders.tsx';
import { LibraryDemo } from './LibraryDemo/LibraryDemo.tsx';
import { counterAtom } from './store/jotaiStore.ts';
import {
    clickCount_select,
    incrementClickCount_select,
    useZustandStore
} from './store/zustandStore.ts';

// PLACEHOLDER APP: A minimal demo which intentionally exercises this template's frontend stack
// (React, CSS Modules, classnames, jotai, zustand). Replace it with your application (see
// docs/init/CUSTOMIZE/CUSTOMIZE-frontend-build.md).

const DemoContent = function () {
    // jotai for UI state (see store/jotaiStore.ts)
    const [count, setCount] = useAtom(counterAtom);

    // zustand for app/domain state (see store/zustandStore.ts)
    const clickCount = useZustandStore(clickCount_select);
    const incrementClickCount = useZustandStore(incrementClickCount_select);

    return (
        <div className={classNames(app, centeredColumn)}>
            <h1 className={title}>Stats for Devs</h1>

            <p>Replace this demo with your application.</p>

            {/* The publishable library's stub component (see LibraryDemo/LibraryDemo.tsx) */}
            <LibraryDemo />

            <button
                onClick={function () {
                    setCount(count + 1);
                }}
            >
                Increment ({count})
            </button>

            <button
                onClick={function () {
                    incrementClickCount();
                }}
            >
                Clicks recorded ({clickCount})
            </button>
        </div>
    );
};

const App = function () {
    return (
        <AppProviders>
            <DemoContent />
        </AppProviders>
    );
};

export { App };
