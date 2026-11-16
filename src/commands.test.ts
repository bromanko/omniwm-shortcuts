import assert from "node:assert/strict";
import { test } from "node:test";
import { commandFor } from "./commands";

test("translates zero-based workspace and column IDs but not one-based slots", () => {
  assert.deepEqual(commandFor("switchWorkspace.0")?.args, [
    "command",
    "switch-workspace",
    "1",
  ]);
  assert.deepEqual(commandFor("moveColumnToWorkspace.9")?.args, [
    "command",
    "move-column-to-workspace",
    "10",
  ]);
  assert.deepEqual(commandFor("focusColumn.0")?.args, [
    "command",
    "focus-column",
    "1",
  ]);
  assert.deepEqual(commandFor("switchWorkspaceSlot.1")?.args, [
    "command",
    "switch-workspace",
    "slot",
    "1",
  ]);
  assert.deepEqual(commandFor("toggleScratchpad.10")?.args, [
    "command",
    "scratchpad",
    "toggle",
    "10",
  ]);
  assert.deepEqual(commandFor("focusWindowInColumn.1")?.args, [
    "command",
    "focus-window-in-column",
    "1",
  ]);
});

test("resize respects configuration and aliases rather than the legacy ID's amount", () => {
  assert.deepEqual(commandFor("resizeWindowSecondarySpan.grow", 7)?.args, [
    "command",
    "set-window-secondary-span",
    "+7%",
  ]);
  assert.deepEqual(
    commandFor("setContainerPrimarySpan.decrease10Percent", 5)?.args,
    ["command", "set-container-primary-span", "-5%"],
  );
  assert.deepEqual(commandFor("resizeGrow.vertical")?.args, [
    "command",
    "resize",
    "vertical",
    "grow",
  ]);
  assert.equal(commandFor("resizeContainerPrimarySpan.grow", 101), undefined);
});

test("rejects unknown IDs, injected commands, and malformed numbers", () => {
  for (const id of [
    "constructor",
    "toString",
    "__proto__",
    "newFutureAction",
    "focus.left; touch /tmp/example",
    "switchWorkspace.-1",
    "switchWorkspace.01",
    "switchWorkspace.999999999999999999999",
  ])
    assert.equal(commandFor(id), undefined);
  assert.equal(commandFor("switchWorkspace.1")?.needsWindow, false);
  assert.equal(commandFor("toggleFullscreen")?.needsWindow, true);
});
