# OmniWM icon

`assets/icon.png` is the original 512×512 representation extracted from
OmniWM v0.8.0's `Resources/AppIcon.icns`, without visual modifications.

- Upstream: https://github.com/OmniNull/OmniWM/tree/v0.8.0
- App icon: https://github.com/OmniNull/OmniWM/blob/v0.8.0/Resources/AppIcon.icns
- Editable source: `omniwm-app-icon.svg`, copied from upstream's
  `assets/brand/app/omniwm-app-icon.svg` at v0.8.0.
- Copyright: OmniNull and OmniWM contributors.
- License: GNU GPL version 2; see the accompanying `LICENSE` copied from upstream.

The upstream artwork retains its license. The extension's MIT license applies
to its original code, not to this third-party artwork. This independent
extension is not affiliated with or endorsed by OmniWM.

To extract the same PNG on macOS:

```sh
iconutil --convert iconset --output /tmp/omniwm.iconset /Applications/OmniWM.app/Contents/Resources/AppIcon.icns
cp /tmp/omniwm.iconset/icon_512x512.png assets/icon.png
```
