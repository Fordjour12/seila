export const colors = {
  background: "#F6F7F9",
  surface: "#FFFFFF",
  foreground: "#111827",
  muted: "#6B7280",
  primary: "#0F766E",
  success: "#15803D",
  danger: "#B91C1C",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  family: {
    sans: "System",
    mono: "Menlo",
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;
