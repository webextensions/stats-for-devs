---
description: Naming patterns for slash-command and skill files
paths: [".claude/commands/**", ".claude/skills/**", ".codex/**", ".cursor/commands/**"]
---

# AI Instruction Naming - cmd-* Commands, skill-* Skills

Command and skill names carry a type prefix so they group together in listings and are recognizable
as this repository's instruction files when invoked (`/cmd-...`, `/skill-...`).

- Slash commands are flat files: `.claude/commands/cmd-<slug>.md`. Mirrors keep the same basename:
  `.codex/playbooks/cmd-<slug>.md`, `.cursor/commands/cmd-<slug>.md`.
- Slugs are imperative task phrases (verb-first): `skill-run-the-project`, `cmd-merge-base-branches` - not gerunds
  (`skill-running-the-project`) or noun phrases.
- Skills are directories: `.claude/skills/skill-<topic>/SKILL.md`, with the frontmatter `name`
  equal to the directory name.
- Never create an unprefixed command or skill; rename via `git mv` and update every referrer in the
  same change (no stubs at old paths).
