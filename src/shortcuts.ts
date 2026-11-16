import { parse } from "smol-toml";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

export const categories = [
  "Resizing & Layout",
  "Focus",
  "Movement",
  "Workspaces",
  "Utilities",
] as const;
export type Category = (typeof categories)[number];
export interface Shortcut {
  id: string;
  binding: string;
  assigned: boolean;
  title: string;
  category: Category;
  keywords: string[];
}

const labels: Record<string, string> = {
  "resizeContainerPrimarySpan.grow": "Grow Column Width / Row Height",
  "resizeContainerPrimarySpan.shrink": "Shrink Column Width / Row Height",
  "resizeWindowPrimarySpan.grow": "Grow Window Primary Span",
  "resizeWindowPrimarySpan.shrink": "Shrink Window Primary Span",
  "resizeWindowSecondarySpan.grow": "Grow Window Height / Row Width",
  "resizeWindowSecondarySpan.shrink": "Shrink Window Height / Row Width",
  cycleSizeForward: "Cycle Column / Row Size Forward",
  cycleSizeBackward: "Cycle Column / Row Size Backward",
  toggleContainerFullPrimarySpan: "Toggle Full Column Width / Row Height",
  expandContainerToAvailablePrimarySpan:
    "Expand Column / Row into Available Space",
  resetWindowSecondarySpan: "Reset Window Height / Row Width",
  toggleFullscreen: "Toggle OmniWM Fullscreen",
  toggleNativeFullscreen: "Toggle macOS Fullscreen",
  balanceSizes: "Balance Window Sizes",
  openCommandPalette: "Open Command Palette",
  toggleFocusedWindowFloating: "Toggle Focused Window Floating",
};

export function canonicalId(id: string): string {
  return id.replace(
    /^set(ContainerPrimarySpan|WindowPrimarySpan|WindowSecondarySpan)\.(increase10Percent|decrease10Percent)$/,
    (_, span: string, direction: string) =>
      `resize${span}.${direction === "increase10Percent" ? "grow" : "shrink"}`,
  );
}

export function humanize(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryFor(id: string): Category {
  if (
    /resize|span|size|fullscreen|layout|split|tabbed|floating|preselect/i.test(
      id,
    )
  )
    return "Resizing & Layout";
  if (/workspace/i.test(id)) return "Workspaces";
  if (/^(focus|center)/i.test(id)) return "Focus";
  if (/^(move|swap|consume|expel)/i.test(id)) return "Movement";
  return "Utilities";
}

export function parseShortcuts(source: string): {
  shortcuts: Shortcut[];
  hotkeysEnabled: boolean;
} {
  const data = parse(source);
  if (!Array.isArray(data.hotkeys))
    throw new Error(
      "Expected a [[hotkeys]] array in the OmniWM configuration.",
    );
  const seen = new Set<string>();
  const shortcuts = data.hotkeys.map((entry, index): Shortcut => {
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      !("id" in entry) ||
      !("binding" in entry) ||
      typeof entry.id !== "string" ||
      typeof entry.binding !== "string"
    ) {
      throw new Error(
        `Hotkey entry ${index + 1} must have a string id and binding.`,
      );
    }
    const id = canonicalId(entry.id);
    if (seen.has(id)) throw new Error(`Duplicate hotkey action: ${id}`);
    seen.add(id);
    const category = categoryFor(id);
    return {
      id: entry.id,
      binding: entry.binding,
      assigned: entry.binding.trim() !== "" && entry.binding !== "Unassigned",
      title: labels[id] ?? humanize(id),
      category,
      keywords: [
        entry.id,
        entry.binding,
        category,
        ...(category === "Resizing & Layout"
          ? [
              "resize",
              "wider",
              "narrower",
              "taller",
              "shorter",
              "width",
              "height",
              "maximize",
            ]
          : []),
      ],
    };
  });
  const general = data.general;
  const hotkeysEnabled = !(
    general &&
    typeof general === "object" &&
    "hotkeysEnabled" in general &&
    general.hotkeysEnabled === false
  );
  return { shortcuts, hotkeysEnabled };
}

export function configPath(
  preference?: string,
  xdg = process.env.XDG_CONFIG_HOME,
  home = homedir(),
): string {
  const custom = preference?.trim();
  if (custom) {
    if (custom.startsWith("~/")) return join(home, custom.slice(2));
    if (!isAbsolute(custom))
      throw new Error(
        "Configuration File must be an absolute path or start with ~/.",
      );
    return custom;
  }
  return join(
    xdg && isAbsolute(xdg) ? xdg : join(home, ".config"),
    "omniwm",
    "settings.toml",
  );
}

export function formatBinding(binding: string): string {
  const symbols: Record<string, string> = {
    Command: "⌘",
    Option: "⌥",
    Control: "⌃",
    Shift: "⇧",
    Equal: "=",
    Minus: "−",
    Period: ".",
    Comma: ",",
    Space: "Space",
    Return: "↩",
    Escape: "Esc",
    Left: "←",
    Right: "→",
    Up: "↑",
    Down: "↓",
    Tab: "⇥",
    Backspace: "⌫",
  };
  if (binding === "Unassigned" || !binding.trim()) return "Unassigned";
  return binding
    .split("+")
    .map((part) => symbols[part] ?? part)
    .join(" ");
}
