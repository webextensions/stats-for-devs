// @vitest-environment jsdom

// Colocated unit test for the Greeting stub component (rendered with @testing-library/react; the
// pragma above opts this file into jsdom - the suite's default environment stays node). Replace
// alongside the stub (conventions: .claude/rules/testing.md). Kept out of the published tarball
// by the "!**/*.test.*" negation in package.json.ts's "files".

import '@testing-library/jest-dom/vitest';

import {
    cleanup,
    fireEvent,
    render,
    screen
} from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import { Greeting } from './Greeting.tsx';

// Testing Library's automatic cleanup only registers itself when a global afterEach exists
// (vitest "globals" is off in this repo), so unmount explicitly between tests
afterEach(cleanup);

describe('Greeting (frontend/lib/src/react/components/Greeting/Greeting.tsx)', function () {
    it('should default to greeting the world', function () {
        render(<Greeting />);
        expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('should greet the provided name', function () {
        render(<Greeting name="Ada" />);
        expect(screen.getByText('Hello, Ada!')).toBeInTheDocument();
    });

    it('should increment the counter via the composed useCounter hook', function () {
        render(<Greeting />);
        const counterButton = screen.getByRole('button', { name: 'Count: 0' });
        fireEvent.click(counterButton);
        expect(counterButton).toHaveTextContent('Count: 1');
    });
});
