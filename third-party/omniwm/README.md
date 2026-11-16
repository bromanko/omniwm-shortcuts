# OmniWM icon

`assets/icon.png` is rendered from OmniWM v0.8.0's official SVG artwork.
The only source modification is a rounded-square clipping path (224-unit
corner radius on the 1024-unit canvas), added for Raycast on 2026-11-16.
The PNG is rendered at 512×512 with transparent outer corners.

- Upstream: https://github.com/OmniNull/OmniWM/tree/v0.8.0
- App icon: https://github.com/OmniNull/OmniWM/blob/v0.8.0/Resources/AppIcon.icns
- Editable source: `omniwm-app-icon.svg`, copied from upstream's
  `assets/brand/app/omniwm-app-icon.svg` at v0.8.0.
- Copyright: OmniNull and OmniWM contributors.
- License: GNU GPL version 2; see the accompanying `LICENSE` copied from upstream.

The upstream artwork retains its license. The extension's MIT license applies
to its original code, not to this third-party artwork. This independent
extension is not affiliated with or endorsed by OmniWM.

To reproduce the Raycast asset with devenv-managed Node:

```sh
devenv shell
npm ci
npm run build:icon
```

`scripts/build-icon.mjs` applies the mask without changing the upstream SVG.
