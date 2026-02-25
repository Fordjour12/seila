import { useThemeColor } from "heroui-native";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useMemo } from "react";

export interface ThemeColors {
  background: string;
  foreground: string;
  surface: string;
  surfaceForeground: string;
  overlay: string;
  overlayForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  default: string;
  defaultForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  danger: string;
  dangerForeground: string;
  segment: string;
  segmentForeground: string;
  fieldBackground: string;
  fieldForeground: string;
  fieldBorder: string;
  fieldPlaceholder: string;
  border: string;
  divider: string;
  link: string;
  transparent: string;
  taskFocus: string;
  taskDueSoon: string;
  taskOverdue: string;
  taskDone: string;

  light: Record<string, string>;
  dark: Record<string, string>;
}

export function useSemanticColors() {
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");
  const surface = useThemeColor("surface");
  const overlay = useThemeColor("overlay");
  const muted = useThemeColor("muted");
  const accent = useThemeColor("accent");
  const success = useThemeColor("success");
  const warning = useThemeColor("warning");
  const danger = useThemeColor("danger");
  const border = useThemeColor("border");
  const link = useThemeColor("link");

  return {
    background,
    foreground,
    surface,
    overlay,
    muted,
    accent,
    primary: accent,
    secondary: foreground,
    success,
    warning,
    danger,
    error: danger,
    fieldBackground: surface,
    fieldForeground: foreground,
    fieldBorder: border,
    border,
    link,
  };
}

export function useResolvedThemeColors() {
  const semantic = useSemanticColors();
  const { currentTheme } = useAppTheme();
  const mode = currentTheme === "dark" ? Colors.dark : Colors.light;

  return {
    background: semantic.background || mode.background,
    foreground: semantic.foreground || mode.foreground,
    surface: semantic.surface || mode.surface,
    surfaceForeground: mode.surfaceForeground,
    overlay: semantic.overlay || mode.overlay,
    overlayForeground: mode.overlayForeground,
    muted: semantic.muted || mode.muted,
    mutedForeground: mode.mutedForeground,
    accent: semantic.accent || mode.accent,
    accentForeground: mode.accentForeground,
    default: mode.default,
    defaultForeground: mode.defaultForeground,
    success: semantic.success || mode.success,
    successForeground: mode.successForeground,
    warning: semantic.warning || mode.warning,
    warningForeground: mode.warningForeground,
    danger: semantic.danger || mode.danger,
    dangerForeground: mode.dangerForeground,
    segment: mode.segment,
    segmentForeground: mode.segmentForeground,
    fieldBackground: semantic.fieldBackground || mode.fieldBackground,
    fieldForeground: semantic.fieldForeground || mode.fieldForeground,
    fieldBorder: semantic.fieldBorder || mode.fieldBorder,
    fieldPlaceholder: mode.fieldPlaceholder,
    border: semantic.border || mode.border,
    divider: mode.divider,
    link: semantic.link || mode.link,
    transparent: mode.transparent,
  };
}

export function useModeThemeColors() {
  const { currentTheme } = useAppTheme();
  return useMemo(
    () => (currentTheme === "dark" ? Colors.dark : Colors.light),
    [currentTheme],
  );
}

export const Colors: ThemeColors = {
  background: "#0C0D0F",
  foreground: "#F8F8F7",
  surface: "#14171B",
  surfaceForeground: "#F8F8F7",
  overlay: "#14171B",
  overlayForeground: "#F8F8F7",
  muted: "#2D333B",
  mutedForeground: "#C7CBD1",
  accent: "#E86B5B",
  accentForeground: "#0C0D0F",
  default: "#171A1F",
  defaultForeground: "#F8F8F7",
  success: "#77C8A0",
  successForeground: "#0C0D0F",
  warning: "#F5A524",
  warningForeground: "#0C0D0F",
  danger: "#FF6B8A",
  dangerForeground: "#0C0D0F",
  segment: "#2D333B",
  segmentForeground: "#F8F8F7",
  fieldBackground: "#14171B",
  fieldForeground: "#F8F8F7",
  fieldBorder: "#3D444D",
  fieldPlaceholder: "#C7CBD1",
  border: "#2D333B",
  divider: "#2D333B",
  link: "#E86B5B",
  transparent: "transparent",
  taskFocus: "#E86B5B",
  taskDueSoon: "#F5A524",
  taskOverdue: "#FF6B8A",
  taskDone: "#77C8A0",

  light: {
    background: "#FBFAF9",
    foreground: "#363636",
    surface: "#FBFAF9",
    surfaceForeground: "#363636",
    overlay: "#FBFAF9",
    overlayForeground: "#363636",
    muted: "#ECEBE9",
    mutedForeground: "#767676",
    accent: "#E86B5B",
    accentForeground: "#FBFAF9",
    default: "#ECEBE9",
    defaultForeground: "#363636",
    success: "#5FB076",
    successForeground: "#FBFAF9",
    warning: "#E9A849",
    warningForeground: "#FBFAF9",
    danger: "#D95450",
    dangerForeground: "#FBFAF9",
    segment: "#ECEBE9",
    segmentForeground: "#363636",
    fieldBackground: "#FBFAF9",
    fieldForeground: "#363636",
    fieldBorder: "#E5E4E1",
    fieldPlaceholder: "#767676",
    border: "#E5E4E1",
    divider: "#E5E4E1",
    link: "#E86B5B",
    transparent: "transparent",
    taskFocus: "#E86B5B",
    taskDueSoon: "#E9A849",
    taskOverdue: "#D95450",
    taskDone: "#5FB076",
  },
  dark: {
    background: "#0C0D0F",
    foreground: "#F8F8F7",
    surface: "#14171B",
    surfaceForeground: "#F8F8F7",
    overlay: "#14171B",
    overlayForeground: "#F8F8F7",
    muted: "#2D333B",
    mutedForeground: "#C7CBD1",
    accent: "#E86B5B",
    accentForeground: "#0C0D0F",
    default: "#171A1F",
    defaultForeground: "#F8F8F7",
    success: "#77C8A0",
    successForeground: "#0C0D0F",
    warning: "#F5A524",
    warningForeground: "#0C0D0F",
    danger: "#FF6B8A",
    dangerForeground: "#0C0D0F",
    segment: "#2D333B",
    segmentForeground: "#F8F8F7",
    fieldBackground: "#14171B",
    fieldForeground: "#F8F8F7",
    fieldBorder: "#3D444D",
    fieldPlaceholder: "#C7CBD1",
    border: "#2D333B",
    divider: "#2D333B",
    link: "#E86B5B",
    transparent: "transparent",
    taskFocus: "#E86B5B",
    taskDueSoon: "#F5A524",
    taskOverdue: "#FF6B8A",
    taskDone: "#77C8A0",
  },
};
