import {
  Action,
  ActionPanel,
  Icon,
  Keyboard,
  List,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { readFile } from "node:fs/promises";
import {
  categories,
  configPath,
  formatBinding,
  parseShortcuts,
} from "./shortcuts";

export default function SearchShortcuts() {
  const [data, setData] = useState<ReturnType<typeof parseShortcuts>>();
  const [path, setPath] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("assigned");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const file = configPath(
        getPreferenceValues<{ configPath?: string }>().configPath,
      );
      setPath(file);
      setData(parseShortcuts(await readFile(file, "utf8")));
    } catch (error) {
      setData(undefined);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const commonActions = (
    <>
      {path && (
        <Action.Open
          title="Open Configuration"
          target={path}
          shortcut={Keyboard.Shortcut.Common.Open}
        />
      )}
      <Action
        title="Refresh Shortcuts"
        icon={Icon.ArrowClockwise}
        onAction={refresh}
        shortcut={Keyboard.Shortcut.Common.Refresh}
      />
      <Action
        title="Extension Preferences"
        icon={Icon.Gear}
        onAction={openExtensionPreferences}
      />
    </>
  );
  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search actions, shortcuts, width, height…"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Show Shortcuts"
          value={filter}
          onChange={setFilter}
        >
          <List.Dropdown.Item title="Assigned" value="assigned" />
          <List.Dropdown.Item title="All" value="all" />
          <List.Dropdown.Item title="Unassigned" value="unassigned" />
        </List.Dropdown>
      }
    >
      <List.EmptyView
        icon={error ? Icon.Warning : Icon.Keyboard}
        title={error ? "Cannot Read OmniWM Shortcuts" : "No Matching Shortcuts"}
        description={
          error ??
          "Try another search or select All to include unassigned actions."
        }
        actions={<ActionPanel>{commonActions}</ActionPanel>}
      />
      {data && !data.hotkeysEnabled && (
        <List.Item
          title="OmniWM Keyboard Shortcuts Are Disabled"
          subtitle="Enable hotkeysEnabled in your configuration"
          icon={Icon.Warning}
          actions={<ActionPanel>{commonActions}</ActionPanel>}
        />
      )}
      {categories.map((category) => (
        <List.Section key={category} title={category}>
          {data?.shortcuts
            .filter(
              (item) =>
                item.category === category &&
                (filter === "all" || item.assigned === (filter === "assigned")),
            )
            .map((item) => (
              <List.Item
                key={item.id}
                title={item.title}
                keywords={item.keywords}
                icon={Icon.Keyboard}
                accessories={[
                  { text: formatBinding(item.binding), tooltip: item.id },
                ]}
                actions={
                  <ActionPanel>
                    {item.assigned && (
                      <Action.CopyToClipboard
                        title="Copy Shortcut"
                        content={item.binding}
                      />
                    )}
                    <Action.CopyToClipboard
                      title="Copy Action ID"
                      content={item.id}
                    />
                    {commonActions}
                  </ActionPanel>
                }
              />
            ))}
        </List.Section>
      ))}
    </List>
  );
}
