#!/usr/bin/env bash

# Claude Code PreToolUse hook (matcher: Write|Edit|MultiEdit), wired in .claude/settings.json.
#
# Blocks direct edits to the npm manifest family: files GENERATED from package.json.ts
# (package.json, package-version.json) and the npm-OWNED package-lock.json (not generated from
# package.json.ts - npm rewrites it on install, so hand edits are lost or corrupt it). The hook
# payload arrives as JSON on stdin; we read tool_input.file_path with node (robust JSON parsing,
# and node is always present in an npm project). Vendored manifests under node_modules/ are
# exempt - they are neither generated nor npm-owned in this repo's sense. On a block, prints the
# standard PreToolUse "deny" response JSON on stdout, which stops the edit and shows Claude the
# reason.

file_path="$(node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write((JSON.parse(d).tool_input||{}).file_path||"")}catch(e){}})')"

case "$file_path" in
    */node_modules/*)
        exit 0
        ;;
    */package.json|package.json|*/package-version.json|package-version.json)
        FILE_PATH="$file_path" node -e '
            const reason =
                `Refusing to edit ${process.env.FILE_PATH} directly: it is generated from ` +
                "package.json.ts. Edit package.json.ts instead, then run: " +
                "node --run housekeeping:generate-package-json";
            process.stdout.write(JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: "PreToolUse",
                    permissionDecision: "deny",
                    permissionDecisionReason: reason
                }
            }));
        '
        exit 0
        ;;
    */package-lock.json|package-lock.json)
        FILE_PATH="$file_path" node -e '
            const reason =
                `Refusing to edit ${process.env.FILE_PATH} directly: the lockfile is owned by ` +
                "npm. Run: npm install (to sync it after a dependency change) or " +
                "node --run housekeeping:update-package-lock-json (for a full regeneration)";
            process.stdout.write(JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: "PreToolUse",
                    permissionDecision: "deny",
                    permissionDecisionReason: reason
                }
            }));
        '
        exit 0
        ;;
esac

exit 0
