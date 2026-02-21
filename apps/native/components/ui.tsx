import React from "react";
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { Colors, Radius, Spacing, Typography } from "../constants/theme";

export function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

export function EmptyState({
  title,
  body,
  subtitle,
  icon,
}: {
  title: string;
  body?: string;
  subtitle?: string;
  icon?: string;
}) {
  const details = body ?? subtitle;
  return (
    <View style={styles.empty}>
      {icon ? <Text style={styles.emptyIcon}>{icon}</Text> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      {details ? <Text style={styles.emptyBody}>{details}</Text> : null}
    </View>
  );
}

export function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </Pressable>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = "primary", disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === "primary"
          ? styles.buttonPrimary
          : variant === "secondary"
            ? styles.buttonSecondary
            : styles.buttonGhost,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "primary"
            ? styles.buttonTextPrimary
            : variant === "secondary"
              ? styles.buttonTextSecondary
              : styles.buttonTextGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.sm },
  empty: {
    backgroundColor: Colors.bgRaised,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.lg,
  },
  emptyTitle: { ...Typography.labelLG, color: Colors.textPrimary },
  emptyBody: { ...Typography.bodySM, color: Colors.textSecondary },
  emptyIcon: { fontSize: 18 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.amberGlow,
    borderColor: Colors.amberBorder,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeText: { ...Typography.labelSM, color: Colors.amber },
  toggleTrack: {
    alignItems: "center",
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    height: 28,
    justifyContent: "center",
    width: 48,
  },
  toggleTrackOn: { backgroundColor: Colors.amberBorder },
  toggleThumb: {
    backgroundColor: Colors.textMuted,
    borderRadius: Radius.full,
    height: 20,
    transform: [{ translateX: -10 }],
    width: 20,
  },
  toggleThumbOn: {
    backgroundColor: Colors.amber,
    transform: [{ translateX: 10 }],
  },
  button: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  buttonPrimary: { backgroundColor: Colors.amber, borderColor: Colors.amber },
  buttonSecondary: { backgroundColor: Colors.bgRaised, borderColor: Colors.borderSoft },
  buttonGhost: { backgroundColor: Colors.transparent, borderColor: Colors.transparent },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...Typography.labelMD },
  buttonTextPrimary: { color: "#121212" },
  buttonTextSecondary: { color: Colors.textPrimary },
  buttonTextGhost: { color: Colors.textMuted },
});
