# CLAUDE.md

@AGENTS.md

## Claude Code

The project-wide agent guide is [AGENTS.md](AGENTS.md) (imported above). This section covers
Claude-Code-specific mechanics only. See [docs/README.md](docs/README.md) for the documentation
index (commands are documented as comments in `package.json.ts`, health checks in
`all-is-well.ts`).

- **Generated files:** hooks block direct edits to the generated `package.json` /
  `package-version.json` and regenerate them after `package.json.ts` edits - always edit
  `package.json.ts` (the hook headers in [.claude/hooks/](.claude/hooks/) document the mechanics).
  The npm-owned `package-lock.json` is blocked the same way - sync it via `npm install`.
- **Session start:** SessionStart hooks inject workspace context (branch, dirty summary, CodeGraph
  status) and report missing workstation tooling - see their headers in
  [.claude/hooks/SessionStart/](.claude/hooks/SessionStart/).
- **Stop hooks:** the scripts in [.claude/hooks/Stop/](.claude/hooks/Stop/) auto-run fixers (plus a
  read-only type check) at the end of each turn - each script's header documents what and when.
  Still produce clean output in the first place; do not rely on the fixers.
- **Permissions:** the deny list in [.claude/settings.json](.claude/settings.json) (authoritative)
  blocks index-mutating git ops and destructive deletes. The human owns commits and pushes.
- **Rules:** topical rules live in [.claude/rules/](.claude/rules/). Files with no `paths:` frontmatter
  key load at launch (e.g. `non-keyboard-characters.md`); the rest are path-scoped and load only when a
  matching file is read - editing a `.ts` file pulls in `typescript-gotchas.md`, editing a hook script
  pulls in `claude-code-hooks.md`.

## CodeGraph

In repositories indexed by CodeGraph (the `.codegraph/` directory holds an index, not just its
committed `.gitignore`), reach for it BEFORE grep/find or reading files when you need to understand
or locate code. The directory's mere existence does not count: it is committed with only a
`.gitignore`, so it is present even in clones that were never indexed - actual index contents (e.g.
the SQLite `codegraph.db`) are the real signal.

- **MCP tools** (when available): `codegraph_explore` answers most code questions in one call - the
  relevant symbols' verbatim source plus the call paths between them. `codegraph_node` returns one
  symbol's source + callers, or reads a whole file with line numbers. If the tools are listed but
  deferred, load them by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` and
  `codegraph node <symbol-or-file>` print the same output.

For exact, type-aware lookups on a single known symbol (references before a rename, an inferred
type), prefer the LSP tool - see the LSP section below.

If `.codegraph/` is absent or holds only its `.gitignore`, skip CodeGraph entirely - indexing is
the user's decision.

## LSP

Claude Code's LSP tool drives `typescript-language-server` over this repo's `.ts` / `.tsx` and `.js`
files (tsconfig's `allowJs`/`checkJs` puts plain JS on the same server). `frontend/` is excluded
from the root [tsconfig.json](tsconfig.json) and served under its own
[frontend/tsconfig.json](frontend/tsconfig.json) instead - the server picks the nearest one, so
`jsx` and `bundler` resolution apply there. Division of labor with the other lookup tools:

- **LSP** - exact, type-aware, no index lag: `findReferences` before a rename or signature change
  (the true blast radius), `goToDefinition`, and `hover`. Hover matters here: the repo is
  `strict: false` with no JSDoc, so tsc's inferred types are visible only through the language
  server.
- **CodeGraph** (section above) - natural-language questions, architecture surveys, whole-file
  source retrieval.
- **grep / Grep** - strings, comments, and file types the server does not cover (`.sh`, `.md`,
  `.json`).

Requires `typescript-language-server` on `PATH` (`node --run setup:ai`); without it the tool fails
silently - the SessionStart hook reports the absence at session start.
