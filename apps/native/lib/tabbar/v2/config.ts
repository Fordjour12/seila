import type { SearchResult } from "../../hooks/useSearch";
import type { IconName } from "@expo/vector-icons";

export type TabRoute = keyof typeof TAB_CONFIG;

export const TAB_CONFIG: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Today", icon: "home-outline" },
  "habits/index": { label: "Habits", icon: "leaf-outline" },
  "checkin/index": { label: "Check-in", icon: "pulse-outline" },
  tasks: { label: "Tasks", icon: "checkbox-outline" },
  finance: { label: "Finance", icon: "wallet-outline" },
  "patterns/index": { label: "Patterns", icon: "analytics-outline" },
  "review/index": { label: "Review", icon: "document-text-outline" },
  settings: { label: "Settings", icon: "settings-outline" },
};

export const SETTINGS_TAB_AVATAR = require("../../assets/bba8b6ac6c886a26604e0b8f74964127.jpg");

export const TAB_ICON_MAP: Record<string, IconName> = {
  route: "navigate-outline",
  habit: "leaf-outline",
  task: "checkbox-outline",
  transaction: "wallet-outline",
  account: "card-outline",
  envelope: "pricetag-outline",
  savingsGoal: "trophy-outline",
  suggestion: "sparkles-outline",
};

export function getSuggestionRouteName(screen?: string): string | undefined {
  if (screen === "checkin") return "checkin/index";
  if (screen === "tasks") return "tasks";
  if (screen === "finance") return "finance";
  if (screen === "patterns") return "patterns/index";
  if (screen === "weekly-review") return "review/index";
  return undefined;
}

export function getTabIconName(icon: IconName, isFocused: boolean): IconName {
  if (isFocused && icon.endsWith("-outline")) {
    return icon.replace("-outline", "") as IconName;
  }
  return icon;
}
