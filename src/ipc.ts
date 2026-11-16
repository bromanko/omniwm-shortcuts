import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, constants } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { commandFor } from "./commands";
import { parseShortcuts } from "./shortcuts";

const exec = promisify(execFile);
export type Cli = (args: string[]) => Promise<unknown>;
export function decodeResponse(stdout: string): unknown {
  const response = JSON.parse(stdout);
  if (
    response?.ok !== true ||
    typeof response.status !== "string" ||
    response.status.startsWith("ignored")
  ) {
    throw new Error(
      `OmniWM did not execute the request: ${response?.error?.message ?? response?.status ?? "invalid response"}`,
    );
  }
  return response.result?.payload;
}
export async function findCli(): Promise<string> {
  for (const file of [
    "/Applications/OmniWM.app/Contents/MacOS/omniwmctl",
    join(homedir(), "Applications/OmniWM.app/Contents/MacOS/omniwmctl"),
    "/opt/homebrew/bin/omniwmctl",
    "/usr/local/bin/omniwmctl",
  ]) {
    try {
      await access(file, constants.X_OK);
      return file;
    } catch {
      /* Try the next standard installation location. */
    }
  }
  throw new Error(
    "Cannot find omniwmctl. Install OmniWM in Applications or install its CLI with Homebrew.",
  );
}
export function createCli(executable: string): Cli {
  return async (args) => {
    let stdout: string;
    try {
      ({ stdout } = await exec(executable, [...args, "--json"], {
        timeout: 5000,
        maxBuffer: 1024 * 1024,
      }));
    } catch (error) {
      const failure = error as Error & {
        stdout?: string;
        stderr?: string;
        code?: number | string;
      };
      if (failure.stdout?.trim()) decodeResponse(failure.stdout);
      throw new Error(
        failure.code === 2
          ? "Cannot connect to OmniWM. Enable IPC and make sure OmniWM is running."
          : `OmniWM command failed: ${failure.stderr?.trim() || failure.message}`,
      );
    }
    return decodeResponse(stdout);
  };
}
export function focusedWindowId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || !("window" in payload))
    return undefined;
  const window = payload.window;
  if (
    !window ||
    typeof window !== "object" ||
    !("id" in window) ||
    typeof window.id !== "string"
  )
    return undefined;
  if (
    "app" in window &&
    window.app &&
    typeof window.app === "object" &&
    "bundleId" in window.app &&
    window.app.bundleId === "com.raycast.macos"
  )
    return undefined;
  return window.id;
}

// Re-read settings at invocation, then check transport before dismissing Raycast.
// Only the final action is sent once: retries are limited to read-only focus queries.
export async function executeAction(
  id: string,
  dependencies: {
    readConfig: () => Promise<string>;
    cli: Cli;
    closeRaycast: () => Promise<void>;
    wait: () => Promise<void>;
  },
): Promise<void> {
  const settings = parseShortcuts(await dependencies.readConfig());
  if (!settings.ipcEnabled)
    throw new Error(
      "OmniWM IPC is disabled. Set general.ipcEnabled = true, then refresh.",
    );
  if (!settings.shortcuts.some((item) => item.id === id))
    throw new Error(
      "This action was removed from the configuration. Refresh the shortcuts.",
    );
  const command = commandFor(id, settings.resizeStepPercent);
  if (!command)
    throw new Error("This action does not have a supported CLI mapping.");
  await dependencies.cli(["ping"]);
  let target: string | undefined;
  if (command.needsWindow)
    target = focusedWindowId(
      await dependencies.cli(["query", "focused-window"]),
    );
  await dependencies.closeRaycast();
  if (command.needsWindow) {
    for (let attempt = 0; !target && attempt < 5; attempt++) {
      await dependencies.wait();
      target = focusedWindowId(
        await dependencies.cli(["query", "focused-window"]),
      );
    }
    if (!target)
      throw new Error(
        "No focused OmniWM window. Focus a managed window and try again.",
      );
    // Explicitly restore the captured window before commands that use focused state.
    await dependencies.cli(["window", "focus", target]);
  }
  await dependencies.cli(command.args);
}
