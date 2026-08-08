#!/usr/bin/env bash

# Cursor "afterFileEdit" hook, wired in .cursor/hooks.json.
#
# Whenever the Cursor agent edits package.json.ts (or the utils/package-json-utils/ helper module it
# computes its dependency fields with), regenerate package.json so it never drifts from its sources.
# This is the Cursor counterpart of the Claude Code PostToolUse hook
# (.claude/hooks/PostToolUse/regenerate-package-json-after-source-edit.sh) and of the folder-open
# watcher task in .vscode/tasks.json (which covers plain human edits in the editor).
#
# The whole body is a grep gate over the event JSON plus one command. It fires on EVERY agent file
# edit and takes the no-op path almost every time, so avoiding a Node startup per edit matters.
#
# Cursor runs this file directly, so it relies on the shebang above and must stay executable
# (mode 755). See .cursor/rules/cursor-hooks.mdc.
#
# afterFileEdit is informational-only: Cursor cannot be blocked from here, so this always exits 0 and
# reports problems on stderr.

cd "$(dirname "$0")" # Change directory to the folder containing this file
cd ../../../         # Change directory to project's root folder

# Cursor pipes the afterFileEdit event JSON on stdin, which grep reads directly.
#
# The leading "[{,]" pins the match to a real JSON key. The payload also carries the edit strings, so
# a file whose contents happen to mention "file_path" would otherwise be a false positive - and that
# is not hypothetical, since .cursor/rules/cursor-hooks.mdc contains exactly such a line. Inside a
# JSON string that text is escaped as \"file_path\", so requiring an unescaped quote rules it out.
#
# The path part matches "package.json.ts" only as the full final path segment, or any .ts file under
# "utils/package-json-utils/" ("/" or "\" as the separator, so Windows paths work too) -
# "notpackage.json.ts" and "package.json.ts.bak" do not match.
if ! grep -Eq '[{,][[:space:]]*"file_path"[[:space:]]*:[[:space:]]*"([^"]*[/\\])?(package\.json\.ts|utils[/\\]package-json-utils[/\\][^"]*\.ts)"'; then
    exit 0
fi

output="$(./scripts/housekeeping/generate-package-json.sh 2>&1)"
if [ $? -eq 0 ]; then
    echo 'Regenerated package.json from package.json.ts.'
else
    echo 'package.json.ts (or utils/package-json-utils/) changed but regeneration failed - check it. Run: node --run housekeeping:generate-package-json' >&2
    echo "$output" >&2
fi

exit 0
