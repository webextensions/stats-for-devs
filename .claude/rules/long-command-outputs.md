# Long Command Outputs - Log to a File First

Any command whose output can exceed a screen - test suites, merge scripts, large `git diff` /
`git show` - is run with its output redirected to a log file, then inspected from the log:

```sh
mkdir -p .cache/agent-logs
<command> > .cache/agent-logs/<name>.log 2>&1; echo "EXIT=$?"
```

`.cache/` is git-ignored, so the logs are invisible to git and to the checks-execution content hash
([checks-execution-caching.md](./checks-execution-caching.md)).

- Inspect with `tail`, `grep -n`, or line-range reads of the log. `tail -N` alone hides the error
  header - read both the grep hits and the tail.
- Never re-run a command (or an individual sub-check of a suite) just to recover output a previous
  run already produced - grep the saved log instead.
- Filter with `grep -E`, never `rg -E`: in ripgrep `-E` means `--encoding` and consumes the
  pattern, silently breaking the pipe.
