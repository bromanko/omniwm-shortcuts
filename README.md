# OmniWM Shortcuts

A small Raycast extension for searching and running the keyboard shortcuts in your OmniWM configuration. Search for an action, a key combination, or terms such as **width**, **height**, and **workspace**.

- Reads your configuration when the command opens; **⌘R** refreshes it.
- Groups actions by resizing/layout, focus, movement, workspaces, and utilities.
- Shows all configured actions by default; the dropdown can filter to assigned or unassigned shortcuts.
- With IPC enabled, **Enter** runs supported actions, including unassigned ones. **⌘C** copies the shortcut; **⌘O** opens the config.
- Unsupported actions remain visible as **Reference Only**.
- Supports schema v4 and v5 resize action names and displays readable fallback labels for unfamiliar actions.
- Browsing reads files locally and works without IPC. Execution uses the installed `omniwmctl` CLI and local IPC.

In Niri, the primary span is column width in horizontal orientation and row height in vertical orientation. Labels include both interpretations because this extension does not query the active monitor. A listed shortcut may apply only to a particular layout.

## Install locally

Requirements: macOS, Raycast, OmniWM, Nix, and [devenv](https://devenv.sh/getting-started/).

```sh
git clone https://github.com/bromanko/omniwm-shortcuts.git
cd omniwm-shortcuts
devenv shell
npm ci
npm run dev
```

Run **Search OmniWM Shortcuts** in Raycast. Keep the development process running while editing. For a distribution build, run `npm run build`.

Node 22 and npm come from `devenv.nix`; `devenv.lock` pins the Nix inputs and `package-lock.json` pins JavaScript dependencies. If you use direnv, run `direnv allow` once instead of entering `devenv shell` manually.

This repository is published on GitHub; it is not a Raycast Store listing.

## Configuration

The extension reads `$XDG_CONFIG_HOME/omniwm/settings.toml` when `XDG_CONFIG_HOME` is an absolute path, otherwise `~/.config/omniwm/settings.toml`. Symlinks work normally. Raycast may not inherit environment variables from your terminal; use the extension's **Configuration File** preference for a custom location in that case. The preference accepts an absolute path or a path beginning with `~/`.

Missing files, invalid TOML, malformed hotkey entries, and duplicate action IDs are shown in the list's error view. If OmniWM's global hotkeys are disabled, the list displays a notice. Unassigned entries come from the file; the extension does not invent omitted actions or default bindings.

## Run actions in OmniWM

Enable IPC in your OmniWM configuration:

```toml
[general]
ipcEnabled = true
```

Refresh the extension with **⌘R**. **Run in OmniWM** becomes the default action on supported entries; pressing **Enter** executes it. If IPC is disabled, the list continues to work as a shortcut reference. The extension re-reads the config before each run, so disabling IPC also blocks actions from a stale list.

OmniWM 0.8.0 is the tested version. The extension looks for its bundled CLI in `/Applications/OmniWM.app` or `~/Applications/OmniWM.app`, then standard Homebrew locations. Keep the app and CLI versions matched. If the CLI cannot connect after changing settings, restart OmniWM.

Before window actions, the extension captures OmniWM's focused window, closes Raycast, and explicitly restores that window before sending the command. If no managed window is available, it reports an error. Workspace and utility actions can run without a focused window. Execution uses explicit argument arrays, never shell interpolation or simulated keystrokes. Resize actions use `[niri].resizeStepPercent` (default 5%).

Window marks, custom shell widgets/apps, and unfamiliar action IDs remain reference-only. Failed commands appear as Raycast error toasts. The extension never retries a mutating command automatically.

## Development

Inside `devenv shell`:

```sh
npm run check     # tests, ESLint, formatting, distribution build
npm run format
npm run dev
```

The parser tests use synthetic fixtures and contain no personal OmniWM configuration. The extension never edits the settings file.

## License

Original extension code is MIT licensed. The official OmniWM icon retains its upstream GPLv2 license; see [icon attribution and source](third-party/omniwm/README.md). This is an independent extension, not an official OmniWM project.
