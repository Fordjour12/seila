/**
 * Life OS — App Header Bar
 * Used on the Today screen.
 * Exposes: Settings, Recovery Context, Hard Mode activation.
 *
 * Usage:
 *   import { AppHeaderBar } from '../../components/today/AppHeaderBar';
 *   // Place above ScrollView in TodayScreen
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "../../constants/theme";

interface AppHeaderBarProps {
  hardModeActive?: boolean;
}

export function AppHeaderBar({ hardModeActive = false }: AppHeaderBarProps) {
  return (
    <View style={styles.bar}>
      {/* Wordmark */}
      <Text style={styles.logo}>Life OS</Text>

      <View style={styles.actions}>
        {/* Recovery Context */}
        <Pressable
          onPress={() => router.push("/recovery")}
          style={styles.iconBtn}
          accessibilityLabel="Recovery context"
        >
          <Text style={styles.iconBtnText}>○</Text>
        </Pressable>

        {/* Hard Mode */}
        <Pressable
          onPress={() => router.push("/hardmode")}
          style={[styles.hardModeBtn, hardModeActive && styles.hardModeBtnActive]}
          accessibilityLabel={hardModeActive ? "Hard Mode active" : "Activate Hard Mode"}
        >
          {hardModeActive && <View style={styles.hardModeDot} />}
          <Text style={[styles.hardModeBtnText, hardModeActive && styles.hardModeBtnTextActive]}>
            {hardModeActive ? "Hard Mode" : "Hard Mode"}
          </Text>
        </Pressable>

        {/* Settings */}
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.iconBtn}
          accessibilityLabel="Settings"
        >
          <Text style={styles.iconBtnText}>◈</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  logo: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 18,
    color: Colors.amber,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "monospace",
  },
  hardModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgRaised,
  },
  hardModeBtnActive: {
    backgroundColor: "rgba(212,146,58,0.1)",
    borderColor: Colors.amberBorder,
  },
  hardModeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.amber,
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  hardModeBtnText: {
    ...Typography.labelSM,
    color: Colors.textMuted,
  },
  hardModeBtnTextActive: {
    color: Colors.amber,
  },
});
