import path from 'node:path';

import {
    addMapping,
    GenMapping,
    setSourceContent,
    toEncodedMap
} from '@jridgewell/gen-mapping';
import {
    eachMapping,
    TraceMap
} from '@jridgewell/trace-mapping';
import type { Plugin } from 'vite';

/*
    REVISIT:
        This plugin works around Vite's build pipeline not attaching combined CSS sourcemaps to
        extracted `.css` assets (JS maps from `build.sourcemap` still work). When
        `css.devSourcemap` is enabled, transforms carry maps internally, but the emitted CSS asset
        often lacks a usable sibling `.map` / inline annotation.

        When upstream emits CSS asset sourcemaps end-to-end, delete this plugin and its
        registration in `build-config-generator.ts`.

    Approach:
        * `transform` (default order - after `vite:css`, before `vite:css-post` in Vite's
          resolved plugin list) stores the post-`vite:css` CSS string plus `getCombinedSourcemap()`
          per module id. That string is what `vite:css-post` concatenates, so generated positions
          stay aligned with the final asset.
        * `generateBundle` walks each emitted `.css` asset, resolves contributing module ids from
          chunk `viteMetadata.importedCss` and module order, merges per-file maps with
          `@jridgewell/trace-mapping` + `@jridgewell/gen-mapping`, shifting generated lines by the
          cumulative newline count of preceding segments.
*/

type CssSourcemapConfig = 'hidden' | 'inline' | 'source-map' | false | undefined;

type CapturedCssTransform = {
    code: string;
    map: ReturnType<TransformPluginContextLike['getCombinedSourcemap']> | null
};

// Subset of Rollup's transform context used here.
type TransformPluginContextLike = {
    getCombinedSourcemap: () => {
        file?: string;
        mappings: string;
        names: string[];
        sourceRoot?: string;
        sources: (string | null)[];
        sourcesContent?: (string | null)[];
        version: number
    }
};

const stripQuery = function (id: string): string {
    const queryIndex = id.indexOf('?');
    return queryIndex === -1 ? id : id.slice(0, queryIndex);
};

const isCssId = function (id: string): boolean {
    return /\.css$/.test(stripQuery(id));
};

const countLines = function (text: string): number {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        if (text.codePointAt(i) === 10) {
            count++;
        }
    }
    return count;
};

const CssBuildSourcemapsPlugin = function ({ cssSourcemap }: { cssSourcemap: CssSourcemapConfig }): Plugin {
    const cssFileTransforms = new Map<string, CapturedCssTransform>();

    return {
        name: 'css-build-sourcemap',

        transform(code: string, id: string) {
            if (!isCssId(id)) {
                return null;
            }
            let map: CapturedCssTransform['map'];
            try {
                // eslint-disable-next-line unicorn/no-this-outside-of-class -- rollup invokes plugin hooks with the plugin context as `this`
                map = (this as unknown as TransformPluginContextLike).getCombinedSourcemap();
            } catch {
                map = null;
            }
            cssFileTransforms.set(stripQuery(id), { code, map });
            return null;
        },

        generateBundle(_opts, bundle) {
            if (!cssSourcemap) {
                return;
            }

            const cssAssetToSourceIds = new Map<string, string[]>();

            for (const chunkOrAsset of Object.values(bundle)) {
                if (chunkOrAsset.type !== 'chunk') {
                    continue;
                }
                const importedCss = chunkOrAsset.viteMetadata?.importedCss;
                if (!importedCss || importedCss.size === 0) {
                    continue;
                }

                const cssIdsForChunk: string[] = [];
                const chunkModules = chunkOrAsset.modules ?? {};
                for (const moduleId of Object.keys(chunkModules)) {
                    const cleanId = stripQuery(moduleId);
                    if (cssFileTransforms.has(cleanId)) {
                        cssIdsForChunk.push(cleanId);
                    }
                }
                if (cssIdsForChunk.length === 0) {
                    continue;
                }

                for (const cssAssetName of importedCss) {
                    const existing = cssAssetToSourceIds.get(cssAssetName);
                    cssAssetToSourceIds.set(
                        cssAssetName,
                        existing ? [...existing, ...cssIdsForChunk] : cssIdsForChunk
                    );
                }
            }

            for (const [fileName, asset] of Object.entries(bundle)) {
                if (asset.type !== 'asset' || !fileName.endsWith('.css')) {
                    continue;
                }
                const sourceIds = cssAssetToSourceIds.get(fileName);
                if (!sourceIds || sourceIds.length === 0) {
                    continue;
                }

                const assetSource = typeof asset.source === 'string' ?
                    asset.source :
                    new TextDecoder().decode(asset.source);

                const cssAssetDir = path.posix.dirname(fileName);
                const gen = new GenMapping({ file: path.basename(fileName) });

                let lineOffset = 0;
                for (const sourceId of sourceIds) {
                    const captured = cssFileTransforms.get(sourceId);
                    if (!captured) {
                        continue;
                    }
                    const { code: transformedCode, map: chainedMap } = captured;

                    if (chainedMap && chainedMap.mappings) {
                        const tracedInput = {
                            ...chainedMap,
                            sources: chainedMap.sources.map((src) => {
                                if (!src) {
                                    return src;
                                }
                                if (path.isAbsolute(src)) {
                                    return path.posix.relative(cssAssetDir, src);
                                }
                                return src;
                            })
                        };
                        const tracer = new TraceMap(tracedInput as unknown as ConstructorParameters<typeof TraceMap>[0]);
                        eachMapping(tracer, (m) => {
                            if (m.source === null || m.originalLine === null) {
                                addMapping(gen, {
                                    generated: {
                                        line: m.generatedLine + lineOffset,
                                        column: m.generatedColumn
                                    }
                                });
                                return;
                            }
                            addMapping(gen, {
                                generated: {
                                    line: m.generatedLine + lineOffset,
                                    column: m.generatedColumn
                                },
                                source: m.source,
                                original: {
                                    line: m.originalLine,
                                    column: m.originalColumn ?? 0
                                },
                                ...(m.name !== null && m.name !== undefined && { name: m.name })
                            });
                        });
                        if (chainedMap.sourcesContent) {
                            for (let i = 0; i < chainedMap.sources.length; i++) {
                                const original = chainedMap.sources[i];
                                const content = chainedMap.sourcesContent[i];
                                if (!original || content === null || content === undefined) {
                                    continue;
                                }
                                const relative = path.isAbsolute(original) ?
                                    path.posix.relative(cssAssetDir, original) :
                                    original;
                                setSourceContent(gen, relative, content);
                            }
                        }
                    }

                    lineOffset += countLines(transformedCode);
                }

                const map = toEncodedMap(gen);

                if (cssSourcemap === 'inline') {
                    const dataUrl =
                        'data:application/json;charset=utf-8;base64,' + Buffer.from(JSON.stringify(map)).toString('base64');
                    asset.source = `${assetSource}\n/*# sourceMappingURL=${dataUrl} */`;
                } else {
                    const mapFileName = `${fileName}.map`;
                    if (cssSourcemap !== 'hidden') {
                        asset.source = `${assetSource}\n/*# sourceMappingURL=${path.basename(mapFileName)} */`;
                    }
                    // eslint-disable-next-line unicorn/no-this-outside-of-class -- rollup invokes plugin hooks with the plugin context as `this`
                    this.emitFile({
                        fileName: mapFileName,
                        source: JSON.stringify(map),
                        type: 'asset'
                    });
                }
            }
        }
    };
};

export { CssBuildSourcemapsPlugin };
