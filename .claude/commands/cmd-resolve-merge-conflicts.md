---
description: >-
  Resolve merge/rebase conflicts conservatively by understanding both sides' intent - flags judgment calls instead of
  guessing
---

# Resolve Merge Conflicts

Resolve the working tree's merge/rebase conflicts by understanding what **both** sides were trying to do, not by picking
a side mechanically.

## Steps

- Establish the situation: `git status`, `git diff --name-only --diff-filter=U`, and whether this is a merge, rebase, or
  cherry-pick (affects which side is "ours"). With `rerere.autoupdate` enabled, resolutions git replayed are already
  staged and invisible to `--diff-filter=U` - spot them in `git status` (staged changes mid-merge) or via
  `Resolved '<file>' using previous resolution.` lines in the merge output, review them WITHOUT unstaging (the user
  owns the index), and include them in the report.
- For each conflicted file:
    - No conflict markers in a conflicted path is not an anomaly: with rerere enabled, git replayed a remembered
      resolution into the working tree and the path stays unmerged. Review the replayed content like a hand
      resolution - a recording from an older merge can be stale for today's content.
    - Read the whole file, not just the conflict markers - conflicts often interact.
    - Under `merge.conflictstyle` `diff3` / `zdiff3`, each hunk carries a base section (opened by a 7-pipe marker)
      between "ours" and the equals line: it shows what both sides changed FROM - use it to judge intent, and
      remember ours ends at the pipes, not at the equals line.
    - Understand each side's intent: `git log --oneline` of both branches for the file, `git show` of the relevant
      commits, and the surrounding code.
    - Resolve conservatively: when the two intents are compatible, keep **both** (the usual case for independent
      additions to the same region); when they genuinely contradict, prefer the resolution the codebase supports and
      note the evidence.
    - Verify the merged result is coherent: imports present, no duplicate declarations, no leftover conflict markers.
- After all files: search the tree for stray markers - `grep -rnE '^(<{7}|\|{7}|={7}$|>{7})'`, an ERE so this doc
  itself contains no literal markers - and run the project's quickest relevant checks (lint, type-check, targeted
  tests) from `package.json` `scripts` when available.

## What NOT To Do

- Never resolve wholesale with `git checkout --ours` / `--theirs` - that discards one side's intent.
- Never guess on a genuine judgment call (two valid but contradictory behaviors): present both options with evidence and
  let the user choose.
- Never stage resolutions, `git add`, continue/abort the merge or rebase, or commit - the user owns those steps.
- Never delete tests or assertions to make the merge "work".

## Report

- Per file: how it was resolved (kept both / chose a side, with the why).
- Judgment calls awaiting the user's decision.
- Results of the post-resolution checks.
