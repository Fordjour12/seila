import { TextStyle } from "react-native";

export const Colors = {
  bg: "#0C0D0F",
  bgRaised: "#14171B",
  bgFloat: "#171A1F",
  bgElevated: "#1B1F25",
  textPrimary: "#F8F8F7",
  textSecondary: "#C7CBD1",
  textMuted: "#8D95A2",
  border: "#2D333B",
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
