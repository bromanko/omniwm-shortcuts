import { canonicalId } from "./shortcuts";

export interface Command {
  args: string[];
  needsWindow: boolean;
}
const fixed: Record<string, string[]> = {
  workspaceBackAndForth: ["switch-workspace", "back-and-forth"],
  "switchWorkspace.next": ["switch-workspace", "next"],
  "switchWorkspace.previous": ["switch-workspace", "prev"],
  focusPrevious: ["focus", "previous"],
  focusDownOrLeft: ["focus", "down-or-left"],
  focusUpOrRight: ["focus", "up-or-right"],
  focusWindowTop: ["focus-window", "top"],
  focusWindowBottom: ["focus-window", "bottom"],
  focusWindowDownOrTop: ["focus-window", "down-or-top"],
  focusWindowUpOrBottom: ["focus-window", "up-or-bottom"],
  focusColumnFirst: ["focus-column", "first"],
  focusColumnLast: ["focus-column", "last"],
  focusMonitorNext: ["focus-monitor", "next"],
  focusMonitorPrevious: ["focus-monitor", "prev"],
  focusMonitorLast: ["focus-monitor", "last"],
  moveWindowToWorkspaceUp: ["move-to-workspace", "up"],
  moveWindowToWorkspaceDown: ["move-to-workspace", "down"],
  moveColumnToWorkspaceUp: ["move-column-to-workspace", "up"],
  moveColumnToWorkspaceDown: ["move-column-to-workspace", "down"],
  cycleSizeForward: ["cycle-size", "forward"],
  cycleSizeBackward: ["cycle-size", "backward"],
  cycleWindowPrimarySpanForward: ["cycle-window-primary-span", "forward"],
  cycleWindowPrimarySpanBackward: ["cycle-window-primary-span", "backward"],
  cycleWindowSecondarySpanForward: ["cycle-window-secondary-span", "forward"],
  cycleWindowSecondarySpanBackward: ["cycle-window-secondary-span", "backward"],
  preselectClear: ["preselect", "clear"],
  toggleWorkspaceBarVisibility: ["toggle-workspace-bar"],
  toggleHiddenBarPanel: ["hidden-bar", "panel"],
};
// Only these verified action names may be converted to CLI words. Unknown IDs
// are reference-only; never infer an executable command from arbitrary config.
const simple = [
  "focusWindowOrWorkspaceDown",
  "focusWindowOrWorkspaceUp",
  "centerColumn",
  "centerVisibleColumns",
  "moveWindowDown",
  "moveWindowUp",
  "moveWindowDownOrToWorkspaceDown",
  "moveWindowUpOrToWorkspaceUp",
  "consumeWindowIntoColumn",
  "expelWindowFromColumn",
  "moveColumnToFirst",
  "moveColumnToLast",
  "toggleColumnTabbed",
  "toggleContainerFullPrimarySpan",
  "expandContainerToAvailablePrimarySpan",
  "resetWindowSecondarySpan",
  "balanceSizes",
  "moveToRoot",
  "toggleSplit",
  "swapSplit",
  "toggleFullscreen",
  "toggleNativeFullscreen",
  "openCommandPalette",
  "raiseAllFloatingWindows",
  "toggleFloatingFocus",
  "rescueOffscreenWindows",
  "toggleFocusedWindowFloating",
  "closeFocusedWindow",
  "openMenuAnywhere",
  "toggleQuakeTerminal",
  "toggleWorkspaceLayout",
  "toggleOverview",
  "toggleSystemStats",
  "volumeUp",
  "volumeDown",
  "volumeMute",
  "mediaPlayPause",
  "mediaNext",
  "mediaPrevious",
  "toggleShortcutPause",
  "beginPrefix",
  "toggleWindowMode",
  "exitKeyboardMode",
];
for (const id of simple)
  fixed[id] = [id.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)];

export function commandFor(
  actionId: string,
  resizeStepPercent = 5,
): Command | undefined {
  const id = canonicalId(actionId);
  let words = Object.hasOwn(fixed, id) ? fixed[id] : undefined;
  let match: RegExpMatchArray | null;
  if (
    (match = id.match(
      /^(switchWorkspace|moveToWorkspace|moveColumnToWorkspace|focusColumn)\.(0|[1-9]\d*)$/,
    ))
  ) {
    const number = Number(match[2]) + 1;
    if (!Number.isSafeInteger(number)) return undefined;
    const names: Record<string, string> = {
      switchWorkspace: "switch-workspace",
      moveToWorkspace: "move-to-workspace",
      moveColumnToWorkspace: "move-column-to-workspace",
      focusColumn: "focus-column",
    };
    words = [names[match[1]], String(number)];
  } else if (
    (match = id.match(
      /^(switchWorkspaceSlot|moveToWorkspaceSlot|focusWindowInColumn|moveColumnToIndex|toggleScratchpad|assignFocusedWindowToScratchpad)\.([1-9]\d*)$/,
    ))
  ) {
    const number = Number(match[2]);
    if (!Number.isSafeInteger(number)) return undefined;
    const names: Record<string, string[]> = {
      switchWorkspaceSlot: ["switch-workspace", "slot"],
      moveToWorkspaceSlot: ["move-to-workspace", "slot"],
      focusWindowInColumn: ["focus-window-in-column"],
      moveColumnToIndex: ["move-column-to-index"],
      toggleScratchpad: ["scratchpad", "toggle"],
      assignFocusedWindowToScratchpad: ["scratchpad", "assign"],
    };
    words = [...names[match[1]], String(number)];
  } else if (
    (match = id.match(
      /^(focus|move|moveColumn|moveWindowToMonitor|moveWorkspaceToMonitor|preselect)\.(left|right|up|down)$/,
    ))
  ) {
    const names: Record<string, string> = {
      focus: "focus",
      move: "move",
      moveColumn: "move-column",
      moveWindowToMonitor: "move-to-monitor",
      moveWorkspaceToMonitor: "swap-workspace-with-monitor",
      preselect: "preselect",
    };
    words = [names[match[1]], match[2]];
  } else if (
    (match = id.match(
      /^resize(ContainerPrimarySpan|WindowPrimarySpan|WindowSecondarySpan)\.(grow|shrink)$/,
    ))
  ) {
    if (
      !Number.isInteger(resizeStepPercent) ||
      resizeStepPercent < 1 ||
      resizeStepPercent > 100
    )
      return undefined;
    const names: Record<string, string> = {
      ContainerPrimarySpan: "set-container-primary-span",
      WindowPrimarySpan: "set-window-primary-span",
      WindowSecondarySpan: "set-window-secondary-span",
    };
    words = [
      names[match[1]],
      `${match[2] === "grow" ? "+" : "-"}${resizeStepPercent}%`,
    ];
  } else if (
    (match = id.match(/^resize(Grow|Shrink)\.(horizontal|vertical)$/))
  ) {
    words = ["resize", match[2], match[1].toLowerCase()];
  } else if ((match = id.match(/^resizeFocusedWindow\.(grow|shrink)$/))) {
    words = ["resize-focused", match[1]];
  } else if (
    (match = id.match(
      /^openCommandPalette\.(windows|menu|clipboard|commands|applications|files)$/,
    ))
  ) {
    words = ["open-command-palette", match[1]];
  }
  if (!words) return undefined;
  const global =
    /^(switchWorkspace|workspaceBackAndForth|focusMonitor|moveWorkspaceToMonitor|toggleScratchpad|openCommandPalette|toggleWorkspaceBarVisibility|toggleHiddenBarPanel|toggleQuakeTerminal|toggleWorkspaceLayout|toggleOverview|toggleSystemStats|volume|media|toggleShortcutPause|beginPrefix|toggleWindowMode|exitKeyboardMode|raiseAllFloatingWindows|toggleFloatingFocus|rescueOffscreenWindows|openMenuAnywhere)/.test(
      id,
    );
  return { args: ["command", ...words], needsWindow: !global };
}
