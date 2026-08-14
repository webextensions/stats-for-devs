# Set Up the Development Environment

Prerequisites and first-run steps for working on this project. Links point to the sources of truth
instead of copying values from them.

## Prerequisite software

- `Linux` (the tooling assumes a unix environment; shell scripts use `bash`)
- `Git`
- `nvm` - to install and switch to the Node.js version this project pins
- `Visual Studio Code` (or a VS Code-based IDE), with the extensions recommended in
  [.vscode/extensions.json](../../.vscode/extensions.json)

## Node.js

- The pinned version lives in [.nvmrc](../../.nvmrc) (mirrored by `engines` in
  [package.json.ts](../../package.json.ts)); activate it with `nvm install && nvm use`.
- The `preinstall` script gates `npm install` on that version, so a wrong active Node fails fast.

## First run

```sh
nvm use
npm install
node --run setup    # editor soft-links + seeds .git/info/exclude + agent language server
node --run test     # verify the health-check suite passes on a clean checkout
```

## Auto-regenerate package.json from package.json.ts

`package.json` (and `package-version.json`) are generated from `package.json.ts`.
[.vscode/tasks.json](../../.vscode/tasks.json) defines a background task ("Watch package.json.ts ...")
which starts automatically when the folder is opened in VS Code or Cursor and regenerates them on
every change to `package.json.ts` or `utils/package-json-utils/*.ts`. No editor extension is
involved.

Run the "First run" steps above **before** opening the project, since the task terminal resolves
`node` through `.vscode/soft-links/node` (created by `node --run setup`).

The first time you open the folder, the editor asks whether to allow automatic tasks - answer
**Allow**. To revisit that answer, use Command Palette > "Tasks: Manage Automatic Tasks". The related
`task.allowAutomaticTasks` setting is application-scoped, so it is deliberately ignored in workspace
settings and cannot be committed with the project.

To verify: the Terminal panel shows a dedicated terminal for the task, and editing `package.json.ts`
logs a regeneration line there.

Manual fallbacks:

```sh
node --run housekeeping:generate-package-json        # one-shot
node --run housekeeping:generate-package-json:watch  # the same watcher, in your own terminal
```

If you would rather have it triggered by the editor's save,
[.vscode/settings.example.json](../../.vscode/settings.example.json) carries opt-in configuration for
the "emeraldwalk.RunOnSave" (VS Code) and "pucelle.run-on-save" (Cursor, and VS Code) extensions. Use
at most one, and consider switching the task's `runOn` to `default` so that only one writer remains.

## Conventions enforcement

- `ESLint` lints JS/TS (config: [eslint.config.js](../../eslint.config.js)); markdown is linted via
  [eslint.markdown.config.js](../../eslint.markdown.config.js).
- `EditorConfig` keeps editor defaults consistent ([.editorconfig](../../.editorconfig)).
