// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import {
    cleanup,
    render,
    screen
} from '@testing-library/react';
import {
    afterEach,
    describe,
    expect,
    it
} from 'vitest';

import { App } from './App.tsx';

// Testing Library's automatic cleanup only registers itself when a global afterEach exists
// (vitest "globals" is off in this repo), so unmount explicitly between tests
afterEach(cleanup);

describe('App', function () {
    it('should render the placeholder demo', function () {
        render(<App />);

        expect(screen.getByRole('heading', { name: 'Stats for Devs' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Increment/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Clicks recorded/ })).toBeInTheDocument();
    });
});
