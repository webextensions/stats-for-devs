---
name: skill-update-ignore-rules
description: Use when about to add, remove, or change entries in .gitignore, .git/info/exclude / docs/template-project/git-info-exclude.example, the .cursorignore file, the eslint.config.js / eslint.markdown.config.js globalIgnores lists, the tsconfig.json exclude list, or any similar ignore/exclude list, while on an abstract- or template- branch of this repository; also when adding a placeholder file to keep an otherwise-empty directory in git.
---

# Update Ignore Rules

## Overview - one primary home, one escape hatch

- **Primary: the committed config of the root branch `abstract-javascript-project`.** EVERY shared ignore pattern of
  the template-branch family - family-wide artifacts (caches, logs, `node_modules/`, `temp/`, ...) AND the
  structure/build output of every branch (`/public-*/`, `dist`, `/app-data/`, local config files, ...) - lives in the
  root branch's committed files and flows into every other branch via the usual template merges:
    - `.gitignore` - what git ignores
    - `.cursorignore` - what Cursor keeps out of its AI indexing
    - `eslint.config.js` and `eslint.markdown.config.js` - the `globalIgnores` lists (keep the two byte-identical)
    - `tsconfig.json` - the `exclude` list
    - `.block-non-keyboard-characters.suppressions.json` - the `exemptions` array
    - `.vscode/settings.json` - the `search.exclude` list (mirrors the `globalIgnores` directories)
    - `scripts/housekeeping/clean.ts` - every git-ignored artifact needs a keep-or-delete entry there
    - Any other ignore/exclude list carrying the same cross-branch NOTE comment
- **Secondary: `.git/info/exclude`** - git's per-clone ignore file, for MACHINE-LOCAL personal patterns only
  (personal scratch files, editor leftovers, machine-specific artifacts - things not worth committing). Developers
  append to it by hand, or seed it via `node --run setup:git-exclude` from
  [docs/template-project/git-info-exclude.example](../../../docs/template-project/git-info-exclude.example) (which
  deliberately carries no shared patterns).

Purposeful divergence is still allowed where it provides value - e.g. the git-ignored `config/*.local*.js` files are
deliberately NOT in the ESLint `globalIgnores` / tsconfig `exclude` lists, so errors in these machine-local files
still surface via lint / type-check.

## Per-directory tracked .gitignore

To ignore a directory's contents while keeping the directory present in the repo, use a tracked `.gitignore` inside
that directory with `*` + `!/.gitignore` (the pattern `.codegraph/.gitignore` uses). Such a file lives on the branch
that has the directory. Where the root `.gitignore` already carries a blanket pattern for that directory (e.g.
`/app-data/`, which keeps every branch's leftovers invisible), the nested file has nothing left to ignore - use
`.gitkeep` instead, per the section below.

The same mechanism covers a single generated file next to tracked ones: `.vscode/soft-links/.gitignore` ignores only
the generated `node` symlink while keeping its `setup.sh` tracked.

## Keeping an empty directory: .gitkeep, not an empty .gitignore

When a directory must exist in git but has nothing to ignore, commit an empty `.gitkeep` - either because it never
had anything to ignore (`docs/specs/implemented/.gitkeep`) or because the root `.gitignore` already covers its
contents (the web-app family's `app-data/database/*/.gitkeep`). An empty `.gitignore` keeps the directory too, but
reads as a forgotten ignore list. The `*` + `!/.gitignore` form above is for ignoring a directory's CONTENTS while
keeping the directory; `.gitkeep` is for a directory that ignores nothing.

A directory that already tracks files of its own needs no placeholder at all - `config/encryption/keys/` on the
web-app family is kept present by its tracked `*.documented.runtime.*.pem` pair, so the root `.gitignore` lines above
are its only guard.

## Decision

Classify the entry, then check the current branch (`git branch --show-current`):

- Machine-local personal pattern (only this developer / this clone cares): it belongs in no committed file. Point the
  developer at `.git/info/exclude` (append by hand, or via `node --run setup:git-exclude`); touch their exclude file
  only when they explicitly ask.
- Shared pattern, on `abstract-javascript-project`: make the edit here, keeping each file's existing NOTE comment and
  entry style. A new git-ignored artifact directory also needs a `scripts/housekeeping/clean.ts` keep-or-delete
  decision.
- Shared pattern, on any other `abstract-` or `template-` branch: do NOT make the edit - not even "temporarily" or
  "also here for now". Print the warning below and stop. (Exceptions require explicit human authorization and are
  reconciled toward the root branch at the next merge.)
- On any other branch (a forked project / npm package repo): this skill does not apply; handle the request normally.

## The Warning (shared entry requested on a non-root `abstract-` / `template-` branch)

Do not edit the file. Print this (adapted to the concrete file and entry) and leave the change to the developer:

> **WARNING: Not applying this ignore-rule change on the current branch.**
>
> Shared ignore/exclude entries (`.gitignore`, `eslint.config.js` / `eslint.markdown.config.js` `globalIgnores`,
> `tsconfig.json` `exclude`, `.cursorignore`, ...) are edited only in the `abstract-javascript-project` branch and
> flow into every other `abstract-` / `template-` branch via the usual template merges. Editing the list on this
> branch would make the branches diverge and cause merge conflicts across the whole branch family.
>
> To apply the change: checkout `abstract-javascript-project`, add the entry there (next to the NOTE comment in the
> file), commit, then merge it down (see `/cmd-merge-base-branches`).
>
> If the entry is a machine-local personal pattern, it does not belong in a committed file at all - append it to this
> clone's `.git/info/exclude` instead.

## Rationalizations - All Mean STOP

| Thought | Reality |
|---------|---------|
| "A leftover dir from another branch shows as noise here - patch this branch's .gitignore" | Shared patterns are edited on `abstract-javascript-project` only. A missing root entry is a root-branch change to merge down, not a local patch. |
| "This entry concerns only this branch's own build output, so its own .gitignore is the home" | Same home: the root branch. Root-listing every branch's output is exactly what keeps leftovers invisible after branch switches. |
| "It is one line; add it here now and upstream it later" | That one line diverges the family and conflicts on the next template merge. Print the warning instead. |
| "I will checkout `abstract-javascript-project` and commit it myself" | The human owns git state (see `.claude/rules/git-workflow.md`). Print the warning; the developer switches branches. |
| "I will write into .git/info/exclude directly for the user" | `.git/` is the developer's local git state. Point them at `node --run setup:git-exclude` or a manual append; touch their exclude only when they explicitly ask. |
| "This pattern is personal, but committing it to the example file shares it conveniently" | The example file is committed and deliberately carries no patterns. Personal patterns stay in the clone's `.git/info/exclude`. |
