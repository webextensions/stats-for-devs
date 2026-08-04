const colorVariablesBlockList = [
    'colorExample'
];

const stylelintConfig = {
    extends: [ // Also, look into 'stylelint-config-standard'
        'stylelint-config-recommended',
        'stylelint-config-css-modules'
    ],

    plugins: [
        '@stylistic/stylelint-plugin'
    ],

    rules: {
        '@stylistic/at-rule-name-case': ['lower'],
        '@stylistic/at-rule-name-space-after': ['always-single-line'],
        '@stylistic/at-rule-semicolon-newline-after': ['always'],
        '@stylistic/block-closing-brace-empty-line-before': ['never'],
        '@stylistic/block-closing-brace-newline-after': ['always'],
        '@stylistic/block-closing-brace-newline-before': ['always-multi-line'],
        '@stylistic/block-opening-brace-newline-after': ['always-multi-line'],
        '@stylistic/block-opening-brace-space-before': ['always'],
        '@stylistic/color-hex-case': ['lower'],
        '@stylistic/declaration-bang-space-after': ['never'],
        '@stylistic/declaration-bang-space-before': ['always'],
        '@stylistic/declaration-block-semicolon-newline-after': ['always-multi-line'],
        '@stylistic/declaration-block-semicolon-space-after': ['always-single-line'],
        '@stylistic/declaration-block-semicolon-space-before': ['never'],
        '@stylistic/declaration-block-trailing-semicolon': ['always'],
        '@stylistic/declaration-colon-space-after': ['always-single-line'],
        '@stylistic/declaration-colon-space-before': ['never'],
        '@stylistic/function-comma-space-after': ['always'],
        '@stylistic/function-comma-space-before': ['never'],
        '@stylistic/function-max-empty-lines': [0],
        '@stylistic/function-parentheses-space-inside': ['never'],
        '@stylistic/function-whitespace-after': ['always'],
        '@stylistic/indentation': [4],
        '@stylistic/max-empty-lines': [1],
        '@stylistic/media-feature-colon-space-before': ['never'],
        '@stylistic/media-feature-parentheses-space-inside': ['never'],
        '@stylistic/media-query-list-comma-space-after': ['always'],
        '@stylistic/media-query-list-comma-space-before': ['never'],
        '@stylistic/no-empty-first-line': [true],
        '@stylistic/no-eol-whitespace': [true],
        '@stylistic/no-extra-semicolons': [true],
        '@stylistic/no-missing-end-of-source-newline': [true],
        '@stylistic/number-leading-zero': ['always'],
        '@stylistic/number-no-trailing-zeros': [true],
        '@stylistic/selector-attribute-brackets-space-inside': ['never'],
        '@stylistic/selector-attribute-operator-space-after': ['never'],
        '@stylistic/selector-attribute-operator-space-before': ['never'],
        '@stylistic/selector-combinator-space-after': ['always'],
        '@stylistic/selector-combinator-space-before': ['always'],
        '@stylistic/selector-list-comma-newline-after': ['always'],
        '@stylistic/string-quotes': ['double'],
        '@stylistic/unit-case': ['lower'],
        '@stylistic/value-list-comma-space-after': ['always'],
        '@stylistic/value-list-comma-space-before': ['never'],
        '@stylistic/value-list-max-empty-lines': [0],
        'alpha-value-notation': ['number'],
        'annotation-no-unknown': [true],
        'at-rule-empty-line-before': null,
        'at-rule-no-unknown': [true],
        'at-rule-prelude-no-invalid': [true],
        'block-no-empty': [true],
        // 'color-named': ['always-where-possible'],
        // 'color-no-hex': [true],
        'color-no-invalid-hex': [true],
        'custom-property-no-missing-var-function': [true],
        'declaration-block-no-duplicate-properties': [true],
        'declaration-block-no-redundant-longhand-properties': null,
        'declaration-block-no-shorthand-property-overrides': [true],
        'declaration-property-value-disallowed-list': [
            {
                background: colorVariablesBlockList,
                'background-color': colorVariablesBlockList,
                'border-bottom-color': colorVariablesBlockList,
                'border-color': colorVariablesBlockList,
                'border-left-color': colorVariablesBlockList,
                'border-right-color': colorVariablesBlockList,
                'border-top-color': colorVariablesBlockList,
                color: colorVariablesBlockList,
                fill: colorVariablesBlockList,
                stroke: colorVariablesBlockList,
                'text-decoration-color': colorVariablesBlockList
            }
        ],
        'declaration-property-value-keyword-no-deprecated': [true],
        'declaration-property-value-no-unknown': [true],
        'font-family-name-quotes': ['always-unless-keyword'],
        'font-family-no-duplicate-names': [true],
        // 'font-family-no-missing-generic-family-keyword': [
        //     true,
        //     {
        //         ignoreFontFamilies: [
        //             '{font-family-name}'
        //         ]
        //     }
        // ],
        'function-calc-no-unspaced-operator': [true],
        'function-disallowed-list': [
            'hsl',
            'hsla'
            // 'rgb',
            // 'rgba'
        ],
        'function-name-case': ['lower'],
        'function-no-unknown': [true],
        'import-notation': ['string'],
        'keyframe-block-no-duplicate-selectors': [true],
        'keyframe-declaration-no-important': [true],
        'length-zero-no-unit': [true],
        'media-feature-name-no-unknown': [true],
        'media-query-no-invalid': [true],
        'named-grid-areas-no-invalid': [true],
        'no-descending-specificity': null,
        'no-duplicate-at-import-rules': [true],
        'no-duplicate-selectors': [true],
        'no-empty-source': [true],
        'no-invalid-double-slash-comments': [true],
        'no-irregular-whitespace': [true],
        'no-unknown-animations': [true],
        'property-disallowed-list': colorVariablesBlockList,
        'property-no-deprecated': [true],
        'property-no-unknown': [true],
        'selector-anb-no-unmatchable': [true],
        'selector-not-notation': ['complex'],
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: [
                    // CSS Modules support
                    'export',
                    'global',
                    // Shadow DOM support (e.g. frontend/lib/src/widget/shadow-reset.css)
                    'host',
                    'host-context'
                ]
            }
        ],
        'selector-pseudo-element-no-unknown': [true],
        'selector-type-case': ['lower'],
        'selector-type-no-unknown': [true],
        'string-no-newline': [true],
        'unit-no-unknown': [true],
        'value-keyword-case': [
            'lower',
            {
                ignoreProperties: ['font-family'],
                camelCaseSvgKeywords: true
            }
        ]
    }
};

// eslint-disable-next-line import-x/no-default-export
export default stylelintConfig;
