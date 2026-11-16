# OmniWM Shortcuts

A small Raycast extension for searching the keyboard shortcuts in your OmniWM configuration. Search for an action, a key combination, or terms such as **width**, **height**, and **workspace**.

- Reads your configuration when the command opens; **⌘R** refreshes it.
- Groups actions by resizing/layout, focus, movement, workspaces, and utilities.
- Shows assigned shortcuts by default; the dropdown also offers all or unassigned actions.
- Copies shortcuts or action IDs and opens the config with **⌘O**.
- Supports schema v4 and v5 resize action names and displays readable fallback labels for unfamiliar actions.
- Reads files locally. No IPC, network service, or OmniWM command execution is required.

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

## Development

Inside `devenv shell`:

```sh
npm run check     # tests, ESLint, formatting, distribution build
npm run format
npm run dev
```

The parser tests use synthetic fixtures and contain no personal OmniWM configuration. The extension never edits the settings file.

## License

MIT. This is an independent extension, not an official OmniWM project.
