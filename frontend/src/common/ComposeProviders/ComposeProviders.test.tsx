// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import {
    cleanup,
    render,
    screen
} from '@testing-library/react';
import {
    createContext,
    use
} from 'react';
import {
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import { ComposeProviders } from './ComposeProviders.tsx';

// Testing Library's automatic cleanup only registers itself when a global afterEach exists
// (vitest "globals" is off in this repo), so unmount explicitly between tests
afterEach(cleanup);

const MessageContext = createContext('default');

const MessageConsumer = function () {
    const message = use(MessageContext);
    return <p>Message: {message}</p>;
};

describe('ComposeProviders', function () {
    it('should render children directly for an empty providers list', function () {
        render(
            <ComposeProviders providers={[]}>
                <p>Bare content</p>
            </ComposeProviders>
        );

        expect(screen.getByText('Bare content')).toBeInTheDocument();
    });

    it('should nest providers in array order (index 0 outermost) and keep their props', function () {
        // Two providers of the same context: the consumer must read the LAST entry's value,
        // proving earlier entries wrap later ones
        render(
            <ComposeProviders
                providers={[
                    <MessageContext key="outer" value="outer" />,
                    <MessageContext key="inner" value="inner" />
                ]}
            >
                <MessageConsumer />
            </ComposeProviders>
        );

        expect(screen.getByText('Message: inner')).toBeInTheDocument();
    });
});
