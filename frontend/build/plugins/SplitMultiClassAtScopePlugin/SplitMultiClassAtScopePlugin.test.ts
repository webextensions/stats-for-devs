import {
    describe,
    expect,
    it
} from 'vitest';

import { splitMultiClassAtScopeRules } from './SplitMultiClassAtScopePlugin.ts';

describe('splitMultiClassAtScopeRules', function () {
    it('splits a multi-selector scope root into separate scope rules', function () {
        const css = `@scope (.themeA, .themeB) {
    :scope {
        color: red;
    }
}`;

        expect(splitMultiClassAtScopeRules(css)).toBe(`@scope (.themeA) {
    :scope {
        color: red;
    }
}
@scope (.themeB) {
    :scope {
        color: red;
    }
}`);
    });

    it('preserves the scope limit clause on every split rule', function () {
        const css = `@scope (.themeA, .themeB) to (.limitA, .limitB) {
    img {
        border: 0;
    }
}`;

        expect(splitMultiClassAtScopeRules(css)).toBe(`@scope (.themeA) to (.limitA, .limitB) {
    img {
        border: 0;
    }
}
@scope (.themeB) to (.limitA, .limitB) {
    img {
        border: 0;
    }
}`);
    });

    it('does not split commas inside nested selector syntax', function () {
        const css = `@scope (:is(.themeA, .themeB), .themeC) {
    :scope {
        color: red;
    }
}`;

        expect(splitMultiClassAtScopeRules(css)).toBe(`@scope (:is(.themeA, .themeB)) {
    :scope {
        color: red;
    }
}
@scope (.themeC) {
    :scope {
        color: red;
    }
}`);
    });

    it('does not split escaped commas inside selectors', function () {
        const css = String.raw`@scope (.themeA\,variant, .themeB) {
    :scope {
        color: red;
    }
}`;

        expect(splitMultiClassAtScopeRules(css)).toBe(String.raw`@scope (.themeA\,variant) {
    :scope {
        color: red;
    }
}
@scope (.themeB) {
    :scope {
        color: red;
    }
}`);
    });

    it('leaves single-selector scope roots unchanged', function () {
        const css = `@scope (.themeA) {
    :scope {
        color: red;
    }
}`;

        expect(splitMultiClassAtScopeRules(css)).toBe(css);
    });
});
