// A stub React component - the "React component(s)" half of this template's example API. It
// mirrors the family's hello-world stub semantics (templateJavascriptProject('Ada') on the
// exports branch) and composes the useCounter stub hook, so the template demonstrates a
// component and a hook working together. Replace alongside the rest of the stub API with your
// package's real components (see docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md).

import { useCounter } from '../../hooks/useCounter/useCounter.ts';
import {
    button,
    greeting,
    title
} from './Greeting.module.css';

interface GreetingProps {
    name?: string
}

const Greeting = function ({ name = 'world' }: GreetingProps) {
    const { count, increment } = useCounter();

    return (
        <div className={greeting}>
            <p className={title}>Hello, {name}!</p>
            <button type="button" className={button} onClick={increment}>
                Count: {count}
            </button>
        </div>
    );
};

export type { GreetingProps };
export { Greeting };
