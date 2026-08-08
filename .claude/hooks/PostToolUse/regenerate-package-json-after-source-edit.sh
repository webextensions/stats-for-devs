#!/usr/bin/env bash

# Claude Code PostToolUse hook (matcher: Write|Edit|MultiEdit), wired in .claude/settings.json.
#
# Whenever package.json.ts (or the package-json-utils helper module it computes its dependency
# fields with) is edited, regenerate package.json so it never drifts from its sources. The
# equivalents outside Claude Code are the folder-open watcher task in .vscode/tasks.json (which
# covers plain human edits in the editor) and the Cursor afterFileEdit hook
# (.cursor/hooks/afterFileEdit/regenerate-package-json-after-source-edit.sh). Editing package.json
# directly is blocked by the paired PreToolUse hook
# (.claude/hooks/PreToolUse/block-direct-package-json-edit.sh).
#
# The whole body is a grep gate over the event JSON plus one command. The hook fires on EVERY
# Write/Edit/MultiEdit and takes the no-op path almost every time, so avoiding a Node startup per
# edit matters - hence grep on the raw stdin instead of the usual "node -e" JSON parse.
#
# Claude Code pipes the PostToolUse event JSON on stdin. On a regeneration failure this exits 2,
# which Claude Code surfaces back to the model.

# The leading "[{,]" pins the match to a real JSON key. "file_path" sits inside the "tool_input"
# object, whose quotes are unescaped, so it still matches; but the payload also carries the edit
# strings, and a file whose contents happen to mention "file_path" would otherwise be a false
# positive. Inside a JSON string that text is escaped as \"file_path\", so requiring an unescaped
# quote rules it out.
#
# The path part matches "package.json.ts" only as the full final path segment, or any .ts file under
# "utils/package-json-utils/" ("/" or "\" as the separator, so Windows paths work too) -
# "notpackage.json.ts" and "package.json.ts.bak" do not match.
if ! grep -Eq '[{,][[:space:]]*"file_path"[[:space:]]*:[[:space:]]*"([^"]*[/\\])?(package\.json\.ts|utils[/\\]package-json-utils[/\\][^"]*\.ts)"'; then
    exit 0
fi

output="$("${CLAUDE_PROJECT_DIR:-.}/scripts/housekeeping/generate-package-json.sh" 2>&1)"
if [ $? -eq 0 ]; then
    echo 'Regenerated package.json from package.json.ts.'
    exit 0
fi

echo 'package.json.ts (or utils/package-json-utils/) changed but regeneration failed - check it. Run: node --run housekeeping:generate-package-json' >&2
echo "$output" >&2
exit 2
