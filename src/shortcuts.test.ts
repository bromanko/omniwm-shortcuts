import assert from "node:assert/strict";
import { test } from "node:test";
import { configPath, formatBinding, parseShortcuts } from "./shortcuts";

test("reads real TOML, maps legacy IDs, and preserves assigned bindings", () => {
  const result = parseShortcuts(
    `[general]\nhotkeysEnabled = false\n[[hotkeys]]\nid = "setContainerPrimarySpan.increase10Percent"\nbinding = "Option+Equal"\n[[hotkeys]]\nid = "newFutureAction.3"\nbinding = "Unassigned"`,
  );
  assert.equal(result.hotkeysEnabled, false);
  assert.equal(result.shortcuts[0].title, "Grow Column Width / Row Height");
  assert.equal(result.shortcuts[0].binding, "Option+Equal");
  assert.equal(result.shortcuts[1].title, "New Future Action 3");
  assert.equal(result.shortcuts[1].assigned, false);
});

test("rejects malformed TOML, invalid rows, and duplicate migrated actions", () => {
  for (const source of [
    "[broken",
    "hotkeys = 3",
    '[[hotkeys]]\nid = "foo"',
    '[[hotkeys]]\nid = "resizeContainerPrimarySpan.grow"\nbinding = "Option+Equal"\n[[hotkeys]]\nid = "setContainerPrimarySpan.increase10Percent"\nbinding = "Unassigned"',
  ]) {
    assert.throws(() => parseShortcuts(source));
  }
});

test("resolves custom paths and absolute XDG paths without expanding shell commands", () => {
  assert.equal(
    configPath(undefined, "/config", "/home/test"),
    "/config/omniwm/settings.toml",
  );
  assert.equal(
    configPath(undefined, "relative", "/home/test"),
    "/home/test/.config/omniwm/settings.toml",
  );
  assert.equal(
    configPath("~/custom.toml", undefined, "/home/test"),
    "/home/test/custom.toml",
  );
  assert.throws(() => configPath("relative.toml"));
  assert.equal(configPath("/tmp/$(whoami).toml"), "/tmp/$(whoami).toml");
});

test("formats modifiers and preserves unfamiliar keys", () => {
  assert.equal(formatBinding("Option+Shift+Equal"), "⌥ ⇧ =");
  assert.equal(formatBinding("Hyper+F12"), "Hyper F12");
  assert.equal(formatBinding("Unassigned"), "Unassigned");
});
