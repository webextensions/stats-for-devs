# Why `postpublish` regenerates package.json and publint runs in a post batch

During a release of a project forked from this template (np 12.0.1 / npm 11.12.1), `npm publish`
succeeded but left the prepack-stripped `package.json` (no `preinstall` script) on disk - the
pack-time `postpack` restore never landed, even though publish's packing normally runs it (why npm
skipped or lost it is internal to npm and was not reproducible from the artifacts; the on-disk
state was proven by recomputing the checks-execution content hashes). np's subsequent
`git push --follow-tags` then ran the pre-push suite against the stripped manifest, the
`pkg-json-sync` check failed - loudly and by design, this is exactly the "aborted pack" failure
mode the [postpack.sh](../../scripts/npm-run-scripts/postpack.sh) header documents - and np
aborted its remaining steps. (The push itself had already happened: `postversion` pushes the
version commit and tag right after `npm version`, before publish.)

Two defenses were added:

- **`postpublish` regenerates the manifest** (see its comment in [package.json.ts](../../package.json.ts)):
  npm runs `postpublish` after the upload, inside the same `npm publish` invocation, so even a lost
  `postpack` restore cannot leave a stripped `package.json` for whatever runs next (np's push, the
  developer's next commit). It reuses `node --run housekeeping:generate-package-json` - the same
  regeneration `postpack` performs - and is harmless for consumers: npm never runs `postpublish`
  from an installed dependency.
- **The publint check moved into `healthChecksWorktreeMutating`** in
  [all-is-well.ts](../../scripts/health-checks/all-is-well.ts): publint packs with a real
  `npm pack`, whose `prepack` strips `package.json` mid-run and whose `postpack` restores it. In
  the concurrent batch this raced every sibling check that reads `package.json` (`pkg-json-sync`,
  `prepack-strip`, `npm-ci-dry`) - any of them could have observed the mid-pack stripped state. As
  a second batch that starts after the main batch has fully completed, no check can observe the
  mid-pack state. Accepted trade-off: a cold full run gets a few seconds longer since publint no
  longer overlaps the main batch; the checks-execution cache keeps warm runs fast.

Each piece becomes unnecessary when its upstream cause goes away: `postpublish` once npm reliably
restores via `postpack` on publish, and the post batch once publint can lint the tarball without
running the pack lifecycle scripts against the working tree.
