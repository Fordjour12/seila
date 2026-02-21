/**
 * Life OS — Notification Settings
 * Route: app/settings/notifications.tsx
 *
 * Per-module notification toggles + time preferences.
 * Quiet hours config.
 * All notification copy must follow tone policy.
 */

import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "../../constants/theme";
import { SectionLabel, Toggle } from "../../components/ui";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface ModuleNotifConfig {
  id: string;
  icon: string;
  label: string;
  description: string;
  enabled: boolean;
  exampleCopy: string;
}

const MODULES: ModuleNotifConfig[] = [
  {
    id: "checkin",
    icon: "○",
    label: "Check-in",
    description: "Daily prompt to log mood and energy",
    enabled: true,
    exampleCopy: "How are you doing today?",
  },
  {
    id: "habits",
    icon: "◇",
    label: "Habits",
    description: "Gentle reminder if morning anchor approaches",
    enabled: true,
    exampleCopy: "Morning walk is still open.",
  },
  {
    id: "finance",
    icon: "◈",
    label: "Finance",
    description: "Import inbox when new transactions arrive",
    enabled: false,
    exampleCopy: "3 transactions waiting in your inbox.",
  },
  {
    id: "review",
    icon: "▷",
    label: "Weekly review",
    description: "Sunday reminder to close the week",
    enabled: true,
    exampleCopy: "Ready to close the week when you are.",
  },
  {
    id: "patterns",
    icon: "⋮",
    label: "Patterns",
    description: "When a new pattern is detected",
    enabled: false,
    exampleCopy: "The AI noticed something worth seeing.",
  },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: i, label: `${h}:00 ${ampm}` };
});

// ─────────────────────────────────────────────
// TIME PICKER (simple segmented)
// ─────────────────────────────────────────────

function TimePicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const SLOTS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  return (
    <View style={tpStyles.wrap}>
      <Text style={tpStyles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tpStyles.scroll}
      >
        {SLOTS.map((h) => {
          const hDisplay = h > 12 ? h - 12 : h;
          const ampm = h < 12 ? "AM" : "PM";
          const isSelected = value === h;
          return (
            <Pressable
              key={h}
              onPress={() => onChange(h)}
              style={[tpStyles.slot, isSelected && tpStyles.slotActive]}
            >
              <Text style={[tpStyles.slotText, isSelected && tpStyles.slotTextActive]}>
                {hDisplay}
                {ampm}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  label: { ...Typography.eyebrow, color: Colors.textMuted },
  scroll: { gap: Spacing.sm, paddingHorizontal: 2, paddingVertical: 2 },
  slot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  slotActive: {
    backgroundColor: Colors.amberGlow,
    borderColor: Colors.amberBorder,
  },
  slotText: { ...Typography.labelSM, color: Colors.textMuted },
  slotTextActive: { color: Colors.amber },
});

// ─────────────────────────────────────────────
// MODULE ROW
// ─────────────────────────────────────────────

function ModuleNotifRow({ config, onToggle }: { config: ModuleNotifConfig; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={modStyles.wrap}>
      <Pressable onPress={() => config.enabled && setExpanded((p) => !p)} style={modStyles.row}>
        <View style={modStyles.icon}>
          <Text style={modStyles.iconText}>{config.icon}</Text>
        </View>
        <View style={modStyles.info}>
          <Text style={modStyles.label}>{config.label}</Text>
          <Text style={modStyles.desc}>{config.description}</Text>
        </View>
        <Toggle value={config.enabled} onToggle={onToggle} />
      </Pressable>

      {config.enabled && expanded && (
        <View style={modStyles.example}>
          <Text style={modStyles.exampleLabel}>Example copy</Text>
          <Text style={modStyles.exampleText}>"{config.exampleCopy}"</Text>
        </View>
      )}
    </View>
  );
}

const modStyles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.bgFloat,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: { fontSize: 12, color: Colors.textMuted, fontFamily: "monospace" },
  info: { flex: 1 },
  label: { ...Typography.bodyMD, color: Colors.textPrimary, marginBottom: 2 },
  desc: { ...Typography.bodyXS, color: Colors.textMuted, lineHeight: 16 },
  example: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
    marginLeft: 32 + Spacing.md + Spacing.lg,
  },
  exampleLabel: { ...Typography.eyebrow, color: Colors.textMuted },
  exampleText: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    fontStyle: "italic",
    fontFamily: "DMSans_300Light",
  },
});

// ─────────────────────────────────────────────
// NOTIFICATIONS SCREEN
// ─────────────────────────────────────────────

export default function NotificationsScreen() {
  const [modules, setModules] = useState(MODULES);
  const [quietStart, setQuietStart] = useState(22);
  const [quietEnd, setQuietEnd] = useState(8);
  const [quietEnabled, setQuietEnabled] = useState(true);

  const toggleModule = (id: string) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tone note */}
        <View style={styles.toneNote}>
          <Text style={styles.toneNoteText}>
            All notifications follow the tone policy — no urgency language, no streak pressure, no
            guilt. Examples shown are exactly what you'll receive.
          </Text>
        </View>

        {/* Modules */}
        <SectionLabel>By module</SectionLabel>
        <View style={styles.card}>
          {modules.map((m) => (
            <ModuleNotifRow key={m.id} config={m} onToggle={() => toggleModule(m.id)} />
          ))}
        </View>

        {/* Quiet hours */}
        <SectionLabel>Quiet hours</SectionLabel>
        <View style={styles.card}>
          <View style={styles.quietHeader}>
            <View style={styles.quietInfo}>
              <Text style={styles.quietLabel}>Enable quiet hours</Text>
              <Text style={styles.quietSublabel}>No notifications during this window</Text>
            </View>
            <Toggle value={quietEnabled} onToggle={() => setQuietEnabled((p) => !p)} />
          </View>

          {quietEnabled && (
            <View style={styles.quietTimes}>
              <View style={styles.quietDivider} />
              <View style={styles.quietTimeConfig}>
                <TimePicker value={quietStart} onChange={setQuietStart} label="Start (evening)" />
                <TimePicker value={quietEnd} onChange={setQuietEnd} label="End (morning)" />
              </View>
              <Text style={styles.quietSummary}>
                No notifications from {HOURS[quietStart].label} to {HOURS[quietEnd].label}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery window */}
        <SectionLabel>Preferred window</SectionLabel>
        <View style={styles.card}>
          <View style={styles.windowInfo}>
            <Text style={styles.windowDesc}>
              Prefer notifications in the morning or afternoon? The system avoids sending check-in
              reminders after your quiet hours begin.
            </Text>
          </View>
          <View style={styles.windowDivider} />
          <View style={styles.windowPicker}>
            <TimePicker value={9} onChange={() => {}} label="Earliest delivery time" />
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    gap: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  backText: { fontSize: 24, color: Colors.textSecondary, lineHeight: 28 },
  title: { ...Typography.displaySM, color: Colors.textPrimary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },

  toneNote: {
    backgroundColor: Colors.amberGlow,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  toneNoteText: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    fontFamily: "DMSans_300Light",
    fontStyle: "italic",
    lineHeight: 20,
  },

  card: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: "hidden",
    marginBottom: Spacing.xxl,
  },

  // Quiet hours
  quietHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  quietInfo: { flex: 1 },
  quietLabel: { ...Typography.bodyMD, color: Colors.textPrimary, marginBottom: 2 },
  quietSublabel: { ...Typography.bodyXS, color: Colors.textMuted },
  quietTimes: {},
  quietDivider: { height: 1, backgroundColor: Colors.borderSoft },
  quietTimeConfig: { padding: Spacing.lg, gap: Spacing.xl },
  quietSummary: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textAlign: "center",
    paddingBottom: Spacing.lg,
    fontStyle: "italic",
  },

  // Window
  windowInfo: { padding: Spacing.lg },
  windowDesc: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    fontFamily: "DMSans_300Light",
    lineHeight: 20,
  },
  windowDivider: { height: 1, backgroundColor: Colors.borderSoft },
  windowPicker: { padding: Spacing.lg },
});
