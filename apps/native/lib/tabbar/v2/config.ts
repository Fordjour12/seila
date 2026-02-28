import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type TabRoute = keyof typeof TAB_CONFIG;

export const TAB_CONFIG: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Today", icon: "reader-outline" },
  habits: { label: "Habits", icon: "walk-outline" },
  "check-in": { label: "Check-in", icon: "telescope-outline" },
  tasks: { label: "Tasks", icon: "checkbox-outline" },
  finance: { label: "Finance", icon: "wallet-outline" },
  pattern: { label: "Patterns", icon: "magnet-outline" },
  review: { label: "Review", icon: "document-text-outline" },
  settings: { label: "Settings", icon: "settings-outline" },
};

export const DEFAULT_TAB_ORDER: TabRoute[] = [
  "index",
  "habits",
  "check-in",
  "tasks",
  "finance",
  "pattern",
  "review",
  "settings",
];

let customTabOrder: TabRoute[] | null = null;

export function getTabOrder(): TabRoute[] {
  if (customTabOrder) return customTabOrder;
  return DEFAULT_TAB_ORDER;
}

export function setTabOrder(order: TabRoute[]): void {
  customTabOrder = order;
}

export function resetTabOrder(): void {
  customTabOrder = null;
}

export function getOrderedTabs() {
  const order = getTabOrder();
  return order
    .map((key) => ({ key, ...TAB_CONFIG[key] }))
    .filter((tab) => tab.label);
}

export const SETTINGS_TAB_AVATAR = require("../../../assets/bba8b6ac6c886a26604e0b8f74964127.jpg");

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
