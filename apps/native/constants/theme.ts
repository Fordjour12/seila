import { TextStyle } from "react-native";

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
  bg: string;
  bgRaised: string;
  bgFloat: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSoft: string;
  amber: string;
  amberGlow: string;
  amberBorder: string;
  sage: string;
  sageGlow: string;
  sageBorder: string;
  rose: string;
  roseDim: string;
  transparent: string;
  light: Record<string, string>;
  dark: Record<string, string>;
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
  bg: "#0C0D0F",
  bgRaised: "#14171B",
  bgFloat: "#171A1F",
  bgElevated: "#1B1F25",
  textPrimary: "#F8F8F7",
  textSecondary: "#C7CBD1",
  textMuted: "#8D95A2",
  borderSoft: "#21262D",
  amber: "#F5A524",
  amberGlow: "rgba(245, 165, 36, 0.14)",
  amberBorder: "rgba(245, 165, 36, 0.35)",
  sage: "#77C8A0",
  sageGlow: "rgba(119, 200, 160, 0.16)",
  sageBorder: "rgba(119, 200, 160, 0.35)",
  rose: "#FF6B8A",
  roseDim: "rgba(255, 107, 138, 0.16)",
  transparent: "transparent",
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
    bg: "#FBFAF9",
    bgRaised: "#FBFAF9",
    bgFloat: "#ECEBE9",
    bgElevated: "#FBFAF9",
    textPrimary: "#363636",
    textSecondary: "#767676",
    textMuted: "#ECEBE9",
    borderSoft: "#E5E4E1",
    amber: "#E9A849",
    amberGlow: "rgba(233, 168, 73, 0.14)",
    amberBorder: "rgba(233, 168, 73, 0.35)",
    sage: "#5FB076",
    sageGlow: "rgba(95, 176, 118, 0.16)",
    sageBorder: "rgba(95, 176, 118, 0.35)",
    rose: "#D95450",
    roseDim: "rgba(217, 84, 80, 0.16)",
    transparent: "transparent",
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
    bg: "#0C0D0F",
    bgRaised: "#14171B",
    bgFloat: "#171A1F",
    bgElevated: "#1B1F25",
    textPrimary: "#F8F8F7",
    textSecondary: "#C7CBD1",
    textMuted: "#8D95A2",
    borderSoft: "#21262D",
    amber: "#F5A524",
    amberGlow: "rgba(245, 165, 36, 0.14)",
    amberBorder: "rgba(245, 165, 36, 0.35)",
    sage: "#77C8A0",
    sageGlow: "rgba(119, 200, 160, 0.16)",
    sageBorder: "rgba(119, 200, 160, 0.35)",
    rose: "#FF6B8A",
    roseDim: "rgba(255, 107, 138, 0.16)",
    transparent: "transparent",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

const textBase: TextStyle = {
  fontFamily: "DMSans_400Regular",
};

export const Typography = {
  eyebrow: { ...textBase, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" as const },
  displayXL: { ...textBase, fontSize: 34, lineHeight: 40, fontFamily: "DMSerifDisplay_400Regular" },
  displayLG: { ...textBase, fontSize: 30, lineHeight: 36, fontFamily: "DMSerifDisplay_400Regular" },
  displayMD: { ...textBase, fontSize: 26, lineHeight: 32, fontFamily: "DMSerifDisplay_400Regular" },
  displaySM: { ...textBase, fontSize: 22, lineHeight: 28, fontFamily: "DMSerifDisplay_400Regular" },
  labelLG: { ...textBase, fontSize: 16, lineHeight: 22, fontFamily: "DMSans_500Medium" },
  labelMD: { ...textBase, fontSize: 14, lineHeight: 20, fontFamily: "DMSans_500Medium" },
  labelSM: { ...textBase, fontSize: 12, lineHeight: 16, fontFamily: "DMSans_500Medium" },
  bodyMD: { ...textBase, fontSize: 15, lineHeight: 22 },
  bodySM: { ...textBase, fontSize: 13, lineHeight: 19 },
  bodyXS: { ...textBase, fontSize: 11, lineHeight: 16 },
};
