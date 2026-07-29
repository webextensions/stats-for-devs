import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
    // Transforms the JSX in colocated .tsx component tests (and their imports). Non-JSX test files
    // pass through untouched, so the plugin is safe for the whole suite.
    plugins: [react()],

    test: {
        // Tests live in two homes (see .claude/rules/testing.md): colocated next to the source
        // for simple, self-contained units, and under test/ when grouping fits better. This glob
        // discovers both; vitest's default excludes keep node_modules etc. out. The jsx/tsx
        // extensions cover the colocated frontend component tests (which opt into the DOM per
        // file via the "@vitest-environment jsdom" pragma - the default environment stays node).
        include: ['**/*.test.{js,jsx,ts,tsx}'],
        reporters: ['verbose']
    }
});
