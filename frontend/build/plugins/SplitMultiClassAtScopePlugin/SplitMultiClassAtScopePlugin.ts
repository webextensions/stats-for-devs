import postcss, {
    type AtRule,
    type Root
} from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';
import type { Plugin } from 'vite';

/*
    REVISIT:
        This entire plugin is a workaround for upstream bugs in the CSS pipeline. Once the
        relevant upstream fixes are released and adopted, delete this plugin (and its
        registration in `build-config-generator.ts`, plus the explicit CSS parser entries in
        `package.json.ts` if no other code starts using them).

        The bugs:
            * Vite's CSS Modules processor (postcss-modules) wraps class names in `:local(...)`
              markers and resolves them to scoped names in a later stage. That resolution stage
              fails when the prelude of an `@scope (...)` rule contains a comma-separated
              selector list - the `:local(.foo)` markers leak into the final CSS output instead
              of being substituted. Tracking issues:
                  * https://github.com/css-modules/postcss-modules-scope/issues/68
                  * https://github.com/css-modules/postcss-modules-local-by-default/issues/90
            * Vite's other CSS transformer (lightningcss) has its own bug with the same
              multi-class `@scope` syntax - see https://github.com/vitejs/vite/issues/21911.

        This plugin works around both by splitting an `@scope (.a, .b, .c) { ... }` rule into
        separate `@scope (.a) { ... }`, `@scope (.b) { ... }`, `@scope (.c) { ... }` rules
        before the CSS Modules processor sees the source. The result is semantically equivalent
        (an element matching any of the listed scope-roots gets the same scoped rules).
*/

type ParsedAtScopeParams = {
    preludeContent: string;
    rest: string
};

const splitSelectorList = function (selectorList: string): string[] {
    const root = selectorParser().astSync(selectorList);
    return root.nodes.map((selector) => selector.toString());
};

// Parse an `@scope` params string into the scope-root prelude and the optional ` to (...)`
// limit clause. Returns null if the params don't start with a parenthesized root selector.
const parseAtScopeParams = function (params: string): ParsedAtScopeParams | null {
    const parsedParams = valueParser(params);
    const preludeIndex = parsedParams.nodes.findIndex((node) => {
        return node.type !== 'space';
    });
    if (preludeIndex === -1) {
        return null;
    }

    const preludeNode = parsedParams.nodes[preludeIndex];
    if (preludeNode.type !== 'function' || preludeNode.value !== '') {
        return null;
    }

    return {
        preludeContent: valueParser.stringify(preludeNode.nodes),
        rest: valueParser.stringify(parsedParams.nodes.slice(preludeIndex + 1))
    };
};

const splitAtScopeRule = function (atRule: AtRule): void {
    const parsed = parseAtScopeParams(atRule.params);
    if (!parsed) {
        return;
    }
    const selectors = splitSelectorList(parsed.preludeContent);
    if (selectors.length <= 1) {
        return;
    }

    // Insert each split rule after the original (in reverse so source order is preserved
    // once the original is removed).
    for (const selector of [...selectors].reverse()) {
        const clone = atRule.clone({ params: `(${selector.trim()})${parsed.rest}` });
        clone.raws.before = atRule.raws.before || '\n';
        atRule.after(clone);
    }
    atRule.remove();
};

const splitMultiClassAtScopePostcssPlugin = {
    postcssPlugin: 'split-multi-class-at-scope-rules',
    Once(root: Root) {
        root.walkAtRules('scope', splitAtScopeRule);
    }
};

const splitMultiClassAtScopeRules = function (css: string): string {
    const root = postcss.parse(css);
    root.walkAtRules('scope', splitAtScopeRule);
    return root.toString();
};

const SplitMultiClassAtScopePlugin = function (): Plugin {
    return {
        name: 'split-multi-class-at-scope',
        enforce: 'pre' as const,

        transform(code: string, id: string) {
            // Strip any query string (e.g. ?used, ?inline, dev-server ?t=...) so those module
            // variants are not silently skipped
            const queryIndex = id.indexOf('?');
            const cleanId = queryIndex === -1 ? id : id.slice(0, queryIndex);
            if (!cleanId.endsWith('.module.css')) {
                return null;
            }
            const result = postcss([splitMultiClassAtScopePostcssPlugin]).process(code, {
                from: id,
                map: { annotation: false, inline: false }
            });
            if (result.css === code) {
                return null;
            }
            return {
                code: result.css,
                map: result.map?.toString() ?? null
            };
        }
    };
};

export {
    SplitMultiClassAtScopePlugin,
    splitMultiClassAtScopeRules
};
