import { useThemeColor, type ThemeColor } from "heroui-native";

export function safeThemeColorValue(color: string, fallback: string) {
  return color && color !== "invalid" ? color : fallback;
}

export function useSafeThemeColor(themeColor: ThemeColor, fallback: string) {
  const resolved = useThemeColor(themeColor);
  return safeThemeColorValue(resolved, fallback);
}
