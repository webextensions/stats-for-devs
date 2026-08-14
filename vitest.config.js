import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
    // Transforms the JSX in colocated .tsx component tests (and their imports). Non-JSX test files
    // pass through untouched, so the plugin is safe for the whole suite.
    plugins: [react()],

    // BEGIN: PROJECT-CUSTOMIZATIONS
    css: {
        // The published widget's class names are hash-free documented API (".sfd-" + local name);
        // tests assert them, so vitest must compile the library's CSS Modules exactly like the
        // build pipelines do (frontend/lib/tsdown.config.ts and
        // frontend/build/build-config-generator.ts - keep the three in sync). Only library CSS is
        // processed (see test.css.include below), so the plain pattern is safe here.
        modules: {
            generateScopedName: 'sfd-[local]'
        }
    },
    // END: PROJECT-CUSTOMIZATIONS

    test: {
        // BEGIN: PROJECT-CUSTOMIZATIONS
        // Process ONLY the library's CSS (compiled class maps + "?inline" text with real sfd-*
        // names); everything else keeps vitest's default identity-proxy class names.
        // classNameStrategy 'scoped' makes vitest defer to Vite's CSS-modules pipeline (the
        // css.modules.generateScopedName above); the default 'stable' would impose vitest's own
        // "_<local>_<hash>" names instead.
        css: {
            include: [/frontend[\\/]lib[\\/]src[\\/].*\.css/],
            modules: {
                classNameStrategy: 'scoped'
            }
        },
        // END: PROJECT-CUSTOMIZATIONS

        // Tests live in two homes (see .claude/rules/testing.md): colocated next to the source
        // for simple, self-contained units, and under test/ when grouping fits better. This glob
        // discovers both; vitest's default excludes keep node_modules etc. out. The jsx/tsx
        // extensions cover the colocated frontend component tests (which opt into the DOM per
        // file via the "@vitest-environment jsdom" pragma - the default environment stays node).
        include: ['**/*.test.{js,jsx,ts,tsx}'],
        reporters: ['verbose']
    }
});
