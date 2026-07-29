// Colocated unit test for scopeCssModuleText() - the helper that rewrites raw CSS-module text to
// use the compiled (scoped) class names for the shadow-DOM path (see its header comment for why
// it exists). Kept out of the published tarball by the "!**/*.test.*" negation in
// package.json.ts's "files".

import {
    describe,
    expect,
    it
} from 'vitest';

import { scopeCssModuleText } from './scopeCssModuleText.ts';

describe('scopeCssModuleText (frontend/lib/src/widget/scopeCssModuleText.ts)', function () {
    it('should rewrite mapped class selectors to their scoped names', function () {
        const result = scopeCssModuleText(
            '.greeting { color: red; }\n.title { margin: 0; }',
            { greeting: 'A1_greeting', title: 'A1_title' }
        );
        expect(result).toBe('.A1_greeting { color: red; }\n.A1_title { margin: 0; }');
    });

    it('should leave unmapped selectors and non-class tokens untouched', function () {
        const css = ':host { all: initial; }\n.unmapped:hover { top: 0.5em; }';
        expect(scopeCssModuleText(css, { greeting: 'A1_greeting' })).toBe(css);
    });

    it('should not rewrite a selector whose name merely starts with a mapped name', function () {
        const result = scopeCssModuleText(
            '.title { margin: 0; }\n.titlebar { margin: 1px; }',
            { title: 'A1_title' }
        );
        expect(result).toBe('.A1_title { margin: 0; }\n.titlebar { margin: 1px; }');
    });

    it('should be a no-op on already-compiled text (scoped selectors match no map key)', function () {
        const compiled = '.A1_greeting { color: red; }';
        expect(scopeCssModuleText(compiled, { greeting: 'A1_greeting' })).toBe(compiled);
    });
});
