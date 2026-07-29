// Demos the publishable library (frontend/lib/) inside this dev/demo harness app: renders the
// stub Greeting component the way a React consumer's component tree would - via the public barrel
// - but through a relative SOURCE import (not the built dist/), so the dev build and HMR pick up
// library edits instantly without a rebuild. Published consumers import '<package-name>' instead
// and its stylesheet via '<package-name>/style.css'; here the component's CSS Modules come along
// with the import. Replace/remove together with the stub library API (see
// docs/init/CUSTOMIZE/CUSTOMIZE-source-code-and-tests.md).

import { Greeting } from '../../../lib/src/index.ts';

const LibraryDemo = function () {
    return <Greeting name="Ada" />;
};

export { LibraryDemo };
