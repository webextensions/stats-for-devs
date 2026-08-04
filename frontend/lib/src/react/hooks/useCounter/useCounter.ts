// A stub stateful hook - the "React hook(s)" half of this template's example API. Composed by the
// Greeting stub component and also exported on its own via frontend/lib/src/index.ts. Replace
// alongside the rest of the stub API with your package's real hooks (see
// docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md).

import {
    useCallback,
    useState
} from 'react';

interface UseCounterOptions {
    initialCount?: number
}

const useCounter = function ({ initialCount = 0 }: UseCounterOptions = {}) {
    const [count, setCount] = useState(initialCount);

    const increment = useCallback(function () {
        setCount(function (previousCount) {
            return previousCount + 1;
        });
    }, []);

    const reset = useCallback(function () {
        setCount(initialCount);
    }, [initialCount]);

    return { count, increment, reset };
};

export type { UseCounterOptions };
export { useCounter };
