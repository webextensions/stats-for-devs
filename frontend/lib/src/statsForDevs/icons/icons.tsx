// The overlay's seven icons as inline SVG components - replaces the former @mui/icons-material
// dependency (which dragged in @mui/material + Emotion, ~30 kB gzip of the drop-in bundle, for
// seven glyphs). Rendered like MUI's <XIcon fontSize="inherit" />: a 1em currentcolor square
// sized by the host element's font-size.
//
// Icon path data copied from Material Design icons via @mui/icons-material 9.x.
// Copyright (c) Google LLC / MUI contributors. Licensed under the Apache License, Version 2.0 -
// https://www.apache.org/licenses/LICENSE-2.0 (see the Credits section in the root README.md).

import classNames from 'classnames';

import { icon } from './icons.module.css';

interface IconProps {
    className?: string
}

const createIcon = function (pathD: string) {
    const Icon = function ({ className }: IconProps) {
        return (
            <svg aria-hidden="true" className={classNames(icon, className)} focusable="false" viewBox="0 0 24 24">
                <path d={pathD} />
            </svg>
        );
    };
    return Icon;
};

const ChevronLeftIcon = createIcon('M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z');
const CloseIcon = createIcon('M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z');
const ContentCopyIcon = createIcon('M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z');
const DragIndicatorIcon = createIcon('M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2m-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2');
const ExpandMoreIcon = createIcon('M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z');
const SettingsIcon = createIcon('M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6');
const UnfoldLessIcon = createIcon('M7.41 18.59 8.83 20 12 16.83 15.17 20l1.41-1.41L12 14zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10z');

export {
    ChevronLeftIcon,
    CloseIcon,
    ContentCopyIcon,
    DragIndicatorIcon,
    ExpandMoreIcon,
    SettingsIcon,
    UnfoldLessIcon
};
