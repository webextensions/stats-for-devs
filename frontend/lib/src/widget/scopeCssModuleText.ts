// Rewrites raw CSS-module text so its class selectors use the compiled (scoped) class names.
//
// Why this exists: the shadow-DOM path needs a *.module.css file's compiled text (to apply it
// inside the shadow root), and gets the text via an "?inline" import. Vite inlines the COMPILED
// text (scoped names already applied), but @tsdown/css - which builds the published artifacts -
// deliberately skips CSS-module compilation for "?inline" imports and returns the RAW text
// (its transform treats inline ids as non-modules), so the selectors would not match the scoped
// class names the component renders. This helper bridges that: given the raw text and the
// class-name map (the module's ordinary import), it swaps ".local" selectors for ".scoped".
// Under Vite the already-compiled selectors match no map key, so the rewrite is a no-op - safe
// in both environments. Revisit if @tsdown/css learns to compile modules for "?inline" (see
// docs/because/widget-standalone-build.md and docs/specs/todo/TODO-for-template-widget.md).
//
// Scope note: this rewrites class SELECTORS only (".name" tokens). Class names appearing inside
// strings or url() values would be rewritten too if they collide with a map key - keep such
// content out of widget CSS modules.

const scopeCssModuleText = function (
    rawCssText: string,
    classNameMap: Record<string, string>
): string {
    return rawCssText.replaceAll(
        /\.([A-Za-z_][\w-]*)/g,
        function (match, localName: string) {
            const scopedName = Object.hasOwn(classNameMap, localName) && classNameMap[localName];
            return scopedName ? '.' + scopedName : match;
        }
    );
};

export { scopeCssModuleText };
