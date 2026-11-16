import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

// Keep upstream's editable artwork untouched; only clip its outer background.
const source = readFileSync(
  new URL("../third-party/omniwm/omniwm-app-icon.svg", import.meta.url),
  "utf8",
);
const rounded = source
  .replace(
    /(<svg\b[^>]*>)/,
    '$1<defs><clipPath id="raycast-rounded"><rect width="1024" height="1024" rx="224" /></clipPath></defs><g clip-path="url(#raycast-rounded)">',
  )
  .replace(/<\/svg>\s*$/, "</g></svg>");
const image = new Resvg(rounded, {
  fitTo: { mode: "width", value: 512 },
}).render();
writeFileSync(new URL("../assets/icon.png", import.meta.url), image.asPng());
