# Demo

[demo.html](demo.html) exercises every metric group: breakpoints, tap targets, virtual keyboard, long tasks,
heap growth, DOM-node count, scrolling and inspect mode.

It loads `../dist/widget.js` (the unminified standalone build) directly, so run the build once and then just
open the file - no server and no install:

```sh
node --run build:lib
```

Then open `demo/demo.html` in a browser. It works over `file://`, which is the property the drop-in build
exists to provide. While iterating on the library source, re-run `node --run build:lib` and reload the page -
or use the dev harness (`node --run start`) instead, which rebuilds on change (see
[docs/development/frontend-build.md](../docs/development/frontend-build.md)).

[Click here](https://raw.githack.com/webextensions/stats-for-devs/main/demo/demo.html) to view the online demo.

An ESM demo page (importing `dist/index.js` with an external react) is not ported yet - see
[docs/specs/todo/TODO.md](../docs/specs/todo/TODO.md).

# Project home page

[Click here](https://github.com/webextensions/stats-for-devs) to go to the project's home page.

# Main README.md

[Click here](../README.md) to view the project's README.md document.
