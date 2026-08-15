---
name: skill-update-npm-packages
description: Update npm dependency versions via package.json.ts (the source of truth) - survey with npm-check-updates, batch the within-major bumps, majors one at a time with changelog analysis, then a full lockfile recreate and health-check run.
argument-hint: [optional package names and/or tier: patch|minor|major]
disable-model-invocation: true
---

# Update NPM Packages

Update dependency versions in [package.json.ts](../../../package.json.ts) - the source of truth; never
hand-edit `package.json` (see [.claude/rules/git-workflow.md](../../rules/git-workflow.md)). Regenerate with
`node --run housekeeping:generate-package-json` after every hand edit.

Scope: version updates and the lockfile refresh only. Adding/removing packages and the category/fence layout
(`dependenciesFor*`, Project vs Template originated) are out of scope - the header comments in
`package.json.ts` cover those.

## Arguments

`$ARGUMENTS` is free-form and restricts the session:

- Package names: update only those packages (all other rules still apply).
- Tier keywords `patch` / `minor` / `major`: update only those tiers.
- A mix of both works; no arguments = full session over every dependency.

## Version-range policy

The range prefix in `package.json.ts` states the update intent - honor it:

- `^` entries and bare exact versions (`1.2.3`): update to the latest available version; a major bump goes
  through the per-major flow below. A bare entry stays bare - never gain a `^` / `~` prefix.
- `~` entries: update to the latest version within the SAME major (the `--target minor` survey pass surfaces
  it; spot-check with `npm view "<pkg>@<major>.x" version`). Report a newer major as available, but do not
  cross it.
- `=` entries: deliberately frozen - never update, report only.
- Any other range syntax (`>=`, `x`, `*`, `||`, ...): stop and ask the developer.

Preserve each version line's inline `//` comment; update its text only when the bump makes it stale.

## Workflow

- **Survey**: run the two `npm-check-updates` passes below and classify every candidate: patch/minor batch,
  majors list, held-back pins, ask-first oddities. Do not survey with `npm outdated`: it is anchored on the
  INSTALLED state, so it reports nothing when the installed versions are already current even while the
  declared range floors in `package.json.ts` have drifted behind. `npm-check-updates` compares the declared
  ranges themselves and honors `.npmrc`'s `min-release-age`; `npx --yes` keeps it non-interactive and
  `--prefer-offline` keeps it fast.
    - `npx --prefer-offline --yes npm-check-updates --target minor` - the latest version within each entry's
      own major (never crosses a major boundary): its output IS the patch/minor batch, floor-drift included,
      and for `~` entries it is the full extent of what may be applied.
    - `npx --prefer-offline --yes npm-check-updates` - the full picture including majors: feeds the per-major
      flow (`^` and bare entries) and the held-back report (`~` majors, frozen `=` pins).
    - Nothing needs updating (both passes empty)? Do not stop: skip the batch and per-major phases and
      continue to Finish anyway - the from-scratch reinstall may still refresh transitive dependencies in
      `package-lock.json`. Exception: when `$ARGUMENTS` restricted the session and none of the targeted
      packages/tiers needs a change, report "already current" and stop - no recreate.
- **Patch/minor batch**: hand-edit the versions listed by the `--target minor` pass in `package.json.ts`,
  then run `node --run housekeeping:generate-package-json` (the PostToolUse hook usually already ran it - the
  explicit run is an idempotent confirmation). No correction pass is needed: `--target minor` cannot cross a
  major boundary, so no major can slip into the batch.
- **Majors, one at a time** (each `^` / bare major, only after the batch above):
    - Read the changelog / release notes / migration guide; where the impact is unclear, analyze deeper
      (grep the repo's actual usage against the breaking changes) to be on the safer side.
    - Hand-edit the version in `package.json.ts`, regenerate, and apply the required code migrations -
      minimal and scoped to what the new version requires.
    - Between batches run light checks only: `node --run test:compare-package-json-with-source` and
      `node --run syntaxlint`. Full verification happens once at the end.
- **Finish - lockfile recreate + full verification**, once at the end:
    - The next step deletes `node_modules`: first make sure no other agents or scripts in this session might
      need it - wait for any running ones to finish, and do not run agents in parallel during this scenario.
    - Run `node --run housekeeping:update-package-lock-json -- --no-countdown` (recreates `node_modules` +
      `package-lock.json` from scratch).
    - Check `git diff --stat package-lock.json` and note whether the recreate changed the lockfile
      (transitive refresh) or left it identical.
    - Run `HEALTHCHECKS_NO_CACHE=1 node --run test` (includes the package/lockfile sync guards). The env var
      is required: recreating `node_modules` does not change the git content the checks cache is keyed on, so
      cached passes would otherwise skip the checks (see
      [.claude/rules/checks-execution-caching.md](../../rules/checks-execution-caching.md)). Fix or revert
      the offending bump on failure; never bypass a check.

## Report

- From->to per package, grouped by batch, with each change's tier.
- The lockfile outcome: updated (transitive refresh) or unchanged.
- Skipped entries with reasons: frozen `=` pins, `~` entries held within their major (noting the
  available major), oddities awaiting the developer's answer.
- Per-major breaking-change notes and the migrations applied - including notes that may matter later even if
  nothing broke now.
- Final check results, and a reminder that nothing was staged or committed - review and commit stays the
  developer's step.
- When nothing changed anywhere (manifest untouched AND lockfile identical after the recreate), emit a short
  "everything already up to date" summary instead of the empty tables above.
