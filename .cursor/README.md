# Project Cursor Configuration

This directory contains project-scoped guidance and hooks for the Cursor agent working in this repository.

## How To Use

- Root [AGENTS.md](../AGENTS.md) is the compact always-on project guide - Cursor reads it natively.
- `rules/` contains topical Cursor rules (`.mdc` files with `globs` frontmatter); currently
  [rules/cursor-hooks.mdc](rules/cursor-hooks.mdc), the layout and conventions for the hooks below.
- `commands/` contains repeatable workflows for common requests (Markdown files named `cmd-<slug>.md`, using the same `cmd-` basename pattern as other instruction-command trees in this repository).
- `hooks.json` wires executable agent hooks as thin pointers to the scripts under `hooks/<event>/` - conventions and deliberate divergences from the Claude Code hooks: [rules/cursor-hooks.mdc](rules/cursor-hooks.mdc).

On this base template branch, `rules/` and `commands/` start as pointer stubs - the
project-scoped canonical content lives under `.claude/` and is mirrored on demand with the
user-global `cmd-sync-ai-instructions-*` commands.

The scope notes in [.codex/README.md](../.codex/README.md) (exploration preferences, Node version
verification) apply to any agent working here, Cursor included.
