import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeResponse, executeAction, focusedWindowId } from "./ipc";
import { parseShortcuts } from "./shortcuts";

const config = (enabled = "true", id = "resizeContainerPrimarySpan.grow") =>
  `[general]\nipcEnabled = ${enabled}\n[niri]\nresizeStepPercent = 7\n[[hotkeys]]\nid = "${id}"\nbinding = "Unassigned"`;
const focused = {
  window: { id: "window-one", app: { bundleId: "com.example.editor" } },
};

test("IPC is opt-in only and invalid resize settings fail clearly", () => {
  assert.equal(parseShortcuts("hotkeys = []").ipcEnabled, false);
  assert.equal(parseShortcuts(config('"true"')).ipcEnabled, false);
  assert.equal(parseShortcuts(config()).ipcEnabled, true);
  assert.throws(() => parseShortcuts(config().replace("= 7", "= 0")));
});

test("IPC disabled, removed actions, and unsupported actions never invoke the CLI or dismiss Raycast", async () => {
  for (const [source, id] of [
    [config("false"), "resizeContainerPrimarySpan.grow"],
    [config(), "removed"],
    [config("true", "unknown"), "unknown"],
  ]) {
    await assert.rejects(
      executeAction(id, {
        readConfig: async () => source,
        cli: async () => {
          assert.fail("CLI called");
        },
        closeRaycast: async () => {
          assert.fail("Raycast closed");
        },
        wait: async () => {},
      }),
    );
  }
});

test("captures target, closes Raycast, restores target, then sends action exactly once", async () => {
  const calls: string[][] = [];
  await executeAction("resizeContainerPrimarySpan.grow", {
    readConfig: async () => config(),
    cli: async (args) => {
      calls.push(args);
      return args[0] === "query" ? focused : {};
    },
    closeRaycast: async () => {
      calls.push(["close-raycast"]);
    },
    wait: async () => {},
  });
  assert.deepEqual(calls, [
    ["ping"],
    ["query", "focused-window"],
    ["close-raycast"],
    ["window", "focus", "window-one"],
    ["command", "set-container-primary-span", "+7%"],
  ]);
});

test("retries only focus discovery after Raycast closes; never acts on Raycast", async () => {
  let queries = 0;
  const calls: string[][] = [];
  await executeAction("resizeContainerPrimarySpan.grow", {
    readConfig: async () => config(),
    cli: async (args) => {
      calls.push(args);
      if (args[0] === "query")
        return ++queries < 3
          ? {
              window: { id: "raycast", app: { bundleId: "com.raycast.macos" } },
            }
          : focused;
      return {};
    },
    closeRaycast: async () => {},
    wait: async () => {},
  });
  assert.equal(calls.filter((args) => args[0] === "command").length, 1);
  assert.equal(
    calls.some((args) => args.includes("raycast")),
    false,
  );
});

test("missing focus and failed focus restoration stop the window action", async () => {
  for (const missing of [true, false]) {
    await assert.rejects(
      executeAction("resizeContainerPrimarySpan.grow", {
        readConfig: async () => config(),
        cli: async (args) => {
          if (args[0] === "command") assert.fail("Action sent");
          if (args[0] === "window") throw new Error("window closed");
          return missing ? {} : focused;
        },
        closeRaycast: async () => {},
        wait: async () => {},
      }),
    );
  }
});

test("workspace switching works without a focused managed window", async () => {
  const calls: string[][] = [];
  await executeAction("switchWorkspace.0", {
    readConfig: async () => config("true", "switchWorkspace.0"),
    cli: async (args) => {
      calls.push(args);
      return {};
    },
    closeRaycast: async () => {},
    wait: async () => {},
  });
  assert.deepEqual(calls, [["ping"], ["command", "switch-workspace", "1"]]);
});

test("response decoder rejects server errors and ignored actions", () => {
  assert.deepEqual(
    decodeResponse(
      '{"ok":true,"status":"success","result":{"payload":{"message":"pong"}}}',
    ),
    { message: "pong" },
  );
  for (const response of [
    "{}",
    '{"ok":false,"status":"rejected"}',
    '{"ok":true,"status":"ignored_overview"}',
    "not json",
  ])
    assert.throws(() => decodeResponse(response));
  assert.equal(focusedWindowId({ window: null }), undefined);
});
