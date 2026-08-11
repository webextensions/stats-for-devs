# Codex Permission and Command Notes

Some assistant runtimes keep a narrow allow list for shell commands and deny destructive git or file operations. Codex
approval is controlled by the runtime, but these are the project preferences Codex should respect. The authoritative
machine-readable list is the `permissions.allow` / `ask` / `deny` arrays in
[.claude/settings.json](../.claude/settings.json) - keep this file's tiers consistent with them.

## Preferred Allowed Commands

- File exploration: `ls`, `rg`, `rg --files`, `tree`, `wc`, `git show`, `git status`, `git diff`, `git log`,
  `codegraph explore` / `codegraph node`
- File moves/renames: `git mv`
- Development scripts: `node --run start`, `node --run start:app:use-hmr`
- Build scripts (one-shot variants only): `node --run build:dry-run`, `node --run build:do-not-watch`
- Lint scripts: `node --run eslint`, `node --run eslint:fix`, `node --run eslint:*`
- Stylelint scripts: `node --run stylelint`, `node --run stylelint:fix`, `node --run stylelint:*`
- Test scripts: `node --run test`, `node --run test:*`, `node --run vitest`, `node --run knip`,
  `node --run syntaxlint`
- Type checks: `node --run test:types`, `node --run test:types:frontend`
- Housekeeping: `node --run housekeeping:generate-package-json`
- npm read/install ops: `npm audit`, `npm ci`, `npm install`, `npm ls`, `npm outdated`, `npm show`, `npm view`

## Ask Before Running

Recoverable but index- or worktree-mutating operations - the developer owns git state in local/interactive sessions
(cloud sessions follow the "Git and safety" carve-out in [AGENTS.md](../AGENTS.md): stage named files, commit, and
push to a dedicated task branch):

- Bulk staging (`git add -A`, `git add -u`, `git add .`) or unstaging (`git restore --staged`, path-level `git reset`);
  the developer handles the index after manual review
- `git checkout --`, `git restore`, `git reset`, `git clean`, `git rm`, `git stash drop` / `git stash clear`
- `rm -rf` / `rm -fr` outside freshly created scratch paths

## Never

- `git push --force` (any variant, including `--force-with-lease` and `-f`)
- `--no-verify` on git commands

## Package Management

- Do not edit `package.json` directly for dependency changes.
- Edit `package.json.ts`, then run `node --run housekeeping:generate-package-json`.
- Use `node --run housekeeping:update-and-generate-package-json` for dependency updates.
