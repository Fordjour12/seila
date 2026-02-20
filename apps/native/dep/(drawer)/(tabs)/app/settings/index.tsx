/**
 * Life OS — Settings Screen
 * Route: app/settings/index.tsx
 *
 * Sections:
 *   - AI Memory (view working model, clear)
 *   - Notifications (per-module, quiet hours)
 *   - Event Log (audit trail, export)
 *   - Tone Policy (view active rules)
 *   - Hard Mode preferences
 *   - Data & Privacy (export all, reset)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Toggle, SectionLabel } from '../../components/ui';

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  chevron = true,
  danger = false,
  right,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && styles.rowPressed,
      ]}
    >
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
          {label}
        </Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {right ?? (chevron && onPress && (
        <Text style={styles.chevron}>›</Text>
      ))}
    </Pressable>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─────────────────────────────────────────────
// SETTINGS SCREEN
// ─────────────────────────────────────────────

export default function SettingsScreen() {
  const [hardModeExitConfirm, setHardModeExitConfirm] = useState(false);
  const [captureAutoSend, setCaptureAutoSend] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── AI ── */}
        <SectionLabel>AI & Memory</SectionLabel>
        <SettingsGroup>
          <SettingsRow
            icon="◎"
            label="What the AI knows"
            sublabel="View your working model and memory"
            onPress={() => router.push('/settings/aicontext')}
          />
          <Divider />
          <SettingsRow
            icon="◇"
            label="Conversational capture"
            sublabel="Auto-submit on return key"
            onPress={undefined}
            chevron={false}
            right={
              <Toggle
                value={captureAutoSend}
                onToggle={() => setCaptureAutoSend(p => !p)}
              />
            }
          />
        </SettingsGroup>

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel>Notifications</SectionLabel>
        <SettingsGroup>
          <SettingsRow
            icon="○"
            label="Notification settings"
            sublabel="Per-module, quiet hours, tone"
            onPress={() => router.push('/settings/notifications')}
          />
        </SettingsGroup>

        {/* ── HARD MODE ── */}
        <SectionLabel>Hard Mode</SectionLabel>
        <SettingsGroup>
          <SettingsRow
            icon="□"
            label="Exit requires confirmation"
            sublabel="Off by default — exit is always one tap"
            onPress={undefined}
            chevron={false}
            right={
              <Toggle
                value={hardModeExitConfirm}
                onToggle={() => setHardModeExitConfirm(p => !p)}
              />
            }
          />
          <Divider />
          <SettingsRow
            icon="◈"
            label="Max items per plan"
            sublabel="Currently: AI decides (recommended)"
            onPress={() => {}}
          />
        </SettingsGroup>

        {/* ── DATA ── */}
        <SectionLabel>Data & Log</SectionLabel>
        <SettingsGroup>
          <SettingsRow
            icon="▷"
            label="Event log"
            sublabel="Every action this system has taken"
            onPress={() => router.push('/settings/eventlog')}
          />
          <Divider />
          <SettingsRow
            icon="◆"
            label="Export all data"
            sublabel="Full event log as JSON"
            onPress={() => {}}
          />
        </SettingsGroup>

        {/* ── TONE POLICY ── */}
        <SectionLabel>Tone Policy</SectionLabel>
        <SettingsGroup>
          <View style={styles.tonePolicyCard}>
            <Text style={styles.tonePolicyTitle}>Active rules</Text>
            {[
              'Never use: fail, missed, behind, should, need to, streak',
              'Never frame absence of action negatively',
              'Suggestions: max 3 at a time, one module at a time',
              'Silence preferred when confidence is low',
            ].map((rule, i) => (
              <View key={i} style={styles.toneRuleRow}>
                <View style={styles.toneRuleDot} />
                <Text style={styles.toneRuleText}>{rule}</Text>
              </View>
            ))}
            <Text style={styles.tonePolicyNote}>
              These rules apply to all AI output. They cannot be disabled.
            </Text>
          </View>
        </SettingsGroup>

        {/* ── DANGER ── */}
        <SectionLabel>Reset</SectionLabel>
        <SettingsGroup>
          <SettingsRow
            icon="×"
            label="Clear AI memory"
            sublabel="Resets the working model. Cannot be undone."
            onPress={() => {}}
            danger
          />
          <Divider />
          <SettingsRow
            icon="×"
            label="Reset all data"
            sublabel="Wipes the entire event log. Cannot be undone."
            onPress={() => {}}
            danger
          />
        </SettingsGroup>

        {/* Version */}
        <Text style={styles.version}>Life OS · v0.1.0 · Personal build</Text>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // Group
  group: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  rowPressed: { backgroundColor: Colors.bgElevated },
  rowIcon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.bgFloat,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIconText: { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace' },
  rowContent: { flex: 1 },
  rowLabel: { ...Typography.bodyMD, color: Colors.textPrimary, marginBottom: 2 },
  rowLabelDanger: { color: Colors.rose },
  rowSublabel: { ...Typography.bodyXS, color: Colors.textMuted, lineHeight: 16 },
  chevron: { fontSize: 20, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.borderSoft, marginLeft: Spacing.lg + 32 + Spacing.md },

  // Tone policy
  tonePolicyCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tonePolicyTitle: { ...Typography.labelLG, color: Colors.textSecondary, marginBottom: Spacing.xs },
  toneRuleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  toneRuleDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginTop: 7,
    flexShrink: 0,
  },
  toneRuleText: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    fontFamily: 'DMSans_300Light',
    flex: 1,
    lineHeight: 20,
  },
  tonePolicyNote: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    fontStyle: 'italic',
    fontFamily: 'DMSans_300Light',
    marginTop: Spacing.xs,
  },

  version: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});
