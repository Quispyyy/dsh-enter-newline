# dsh-enter-newline

[中文](README.md) | English

Makes **Enter insert a line break and Ctrl/Cmd+Enter send** in the DSH composer.

| Key | Behaviour |
|---|---|
| `Enter` | line break |
| `Ctrl+Enter` / `⌘+Enter` | send (already stock DSH; untouched here) |
| `Shift+Enter` | line break (unchanged) |
| `Enter` while the `/` or `@` menu is open | picks the item, no line break |
| `Enter` during IME composition | left to the IME |

## Why

DSH ships Enter-to-send with Shift+Enter for newlines, and its settings only expose
"send behaviour while busy" (queue / steer). There is no newline-key option, so
long prompts are easy to send by accident.

## Install

Pick one, then **restart DSH** (the plugin graph is composed at startup — a page
refresh is not enough).

### 1. CLI (recommended)

Windows — the CLI lives in the install directory:

```sh
"D:\dsh\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:Quispyyy/dsh-enter-newline
```

macOS / Linux:

```sh
dsh plugin --profile desktop add github:Quispyyy/dsh-enter-newline
```

### 2. Plugins panel

Sidebar **Plugins → Add plugin**, paste `github:Quispyyy/dsh-enter-newline`,
choose the **NPM** source (not the mainland mirror), install, restart.

### 3. By hand

1. Copy this repository to `%USERPROFILE%\.dsh\profiles\desktop\plugins\dsh-enter-newline`
   and keep a copy at `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-enter-newline`;
2. add `"dsh-enter-newline": "file:./plugins/dsh-enter-newline"` to `dependencies`
   in `%USERPROFILE%\.dsh\profiles\desktop\package.json`;
3. append `"dsh-enter-newline"` to `dsh.profile.bundles` in the same file;
4. restart DSH.

## How it works

No patching of `app.asar` and no interception of the send path. `client.js` adds a
capture-phase `keydown` listener. When a plain, unmodified Enter lands inside the
Lexical composer (`[data-lexical-editor="true"]`), it redefines `shiftKey` to
`true` on **that event object only**, so DSH's own keymap takes the branch it
already has:

```
if (event?.shiftKey === true) return false;   // hand over to the editor → line break
```

Deliberately skipped: modifier combos, IME composition (`isComposing` /
`keyCode === 229`), and an open command or mention menu (a visible
`[role="listbox"]` containing a `[role="option"]`), where Enter must pick an item.

## Compatibility

- Tested on DSH desktop 44.7.0 (internal package `0.2.1-rc.5`) on Windows.
- Relies on two internals: the `data-lexical-editor="true"` composer root and the
  keymap branch above. If DSH changes either, the plugin stops working — the
  failure mode is stock Enter-to-send, nothing destructive.

## Uninstall

Disable/uninstall it in the Plugins panel, or (manual installs) drop the
`dependencies` line and the `bundles` entry, delete the directory, restart.

## Development

No build step; `client.js` is the hand-written browser module.

```sh
npm test          # offline DOM stubs exercising the keydown logic
node --check client.js
```

## License

MIT
