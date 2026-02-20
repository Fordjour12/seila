/**
 * Life OS — Event Log
 * Route: app/settings/eventlog.tsx
 *
 * Chronological audit trail of everything the system has recorded.
 * Filterable by module.
 * Exportable as JSON.
 *
 * This is the source of truth for the entire system.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

// ─────────────────────────────────────────────
// MOCK EVENT LOG
// ─────────────────────────────────────────────

type EventModule = 'habits' | 'checkin' | 'tasks' | 'finance' | 'patterns' | 'hardMode' | 'weeklyReview' | 'capture' | 'system';

interface EventEntry {
  id: string;
  type: string;
  module: EventModule;
  occurredAt: number;
  payload: Record<string, unknown>;
}

const MOCK_EVENTS: EventEntry[] = [
  { id: '1',  type: 'habit.logged',              module: 'habits',       occurredAt: Date.now() - 1000 * 60 * 30,       payload: { habitId: 'morning-walk', name: 'Morning walk' } },
  { id: '2',  type: 'checkin.daily.submitted',    module: 'checkin',      occurredAt: Date.now() - 1000 * 60 * 90,       payload: { mood: 3, energy: 4, flags: ['focused'] } },
  { id: '3',  type: 'task.completed',             module: 'tasks',        occurredAt: Date.now() - 1000 * 60 * 120,      payload: { taskId: 't1', text: 'Reply to Dr. Osei email' } },
  { id: '4',  type: 'hardmode.itemFlagged',       module: 'hardMode',     occurredAt: Date.now() - 1000 * 60 * 180,      payload: { itemId: 'plan-3', reason: 'not_now' } },
  { id: '5',  type: 'finance.transaction.confirmed', module: 'finance',   occurredAt: Date.now() - 1000 * 60 * 240,      payload: { merchant: 'Whole Foods', amount: -67.40 } },
  { id: '6',  type: 'pattern.dismissed',          module: 'patterns',     occurredAt: Date.now() - 1000 * 60 * 60 * 5,   payload: { patternId: 'p2' } },
  { id: '7',  type: 'habit.skipped',              module: 'habits',       occurredAt: Date.now() - 1000 * 60 * 60 * 6,   payload: { habitId: 'meditation', name: 'Meditation' } },
  { id: '8',  type: 'hardmode.activated',         module: 'hardMode',     occurredAt: Date.now() - 1000 * 60 * 60 * 7,   payload: { duration: '1d', modules: ['habits', 'tasks'] } },
  { id: '9',  type: 'checkin.weekly.submitted',   module: 'checkin',      occurredAt: Date.now() - 1000 * 60 * 60 * 48,  payload: { mood: 4, energy: 3, reflections: 3 } },
  { id: '10', type: 'finance.account.added',      module: 'finance',      occurredAt: Date.now() - 1000 * 60 * 60 * 72,  payload: { name: 'Marcus Savings', type: 'savings' } },
  { id: '11', type: 'review.completed',           module: 'weeklyReview', occurredAt: Date.now() - 1000 * 60 * 60 * 96,  payload: { intentions: 2 } },
  { id: '12', type: 'aiContext.cleared',           module: 'system',       occurredAt: Date.now() - 1000 * 60 * 60 * 120, payload: {} },
];

const ALL_MODULES: Array<{ id: EventModule | 'all'; label: string }> = [
  { id: 'all',         label: 'All'    },
  { id: 'habits',      label: 'Habits' },
  { id: 'checkin',     label: 'Check-in' },
  { id: 'tasks',       label: 'Tasks'  },
  { id: 'finance',     label: 'Finance'},
  { id: 'hardMode',    label: 'Hard Mode' },
  { id: 'weeklyReview',label: 'Review' },
  { id: 'system',      label: 'System' },
];

const MODULE_COLOR: Record<EventModule, string> = {
  habits:       Colors.sage,
  checkin:      Colors.amber,
  tasks:        Colors.textSecondary,
  finance:      Colors.amber,
  patterns:     Colors.textMuted,
  hardMode:     Colors.rose,
  weeklyReview: Colors.sage,
  capture:      Colors.textMuted,
  system:       Colors.textMuted,
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatPayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload);
  if (keys.length === 0) return '';
  return keys
    .filter(k => payload[k] !== undefined && payload[k] !== null)
    .map(k => `${k}: ${JSON.stringify(payload[k])}`)
    .join(' · ');
}

// ─────────────────────────────────────────────
// EVENT ROW
// ─────────────────────────────────────────────

function EventRow({ event, isLast }: { event: EventEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = MODULE_COLOR[event.module];
  const payloadStr = formatPayload(event.payload);

  return (
    <Pressable
      onPress={() => payloadStr ? setExpanded(p => !p) : undefined}
      style={[rowStyles.wrap, !isLast && rowStyles.wrapBorder]}
    >
      <View style={[rowStyles.dot, { backgroundColor: color }]} />
      <View style={rowStyles.content}>
        <View style={rowStyles.header}>
          <Text style={rowStyles.type}>{event.type}</Text>
          <Text style={rowStyles.time}>{timeAgo(event.occurredAt)}</Text>
        </View>
        <Text style={rowStyles.module}>{event.module}</Text>
        {expanded && payloadStr && (
          <Text style={rowStyles.payload}>{payloadStr}</Text>
        )}
      </View>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  wrapBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  content: { flex: 1, gap: 3 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  type: { ...Typography.labelMD, color: Colors.textPrimary, flex: 1 },
  time: { ...Typography.bodyXS, color: Colors.textMuted, flexShrink: 0 },
  module: { ...Typography.eyebrow, color: Colors.textMuted },
  payload: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    fontFamily: 'DMSans_300Light',
    lineHeight: 16,
    marginTop: Spacing.xs,
  },
});

// ─────────────────────────────────────────────
// EVENT LOG SCREEN
// ─────────────────────────────────────────────

export default function EventLogScreen() {
  const [filter, setFilter] = useState<EventModule | 'all'>('all');

  const filtered = useMemo(() =>
    filter === 'all'
      ? MOCK_EVENTS
      : MOCK_EVENTS.filter(e => e.module === filter),
    [filter]
  );

  const handleExport = async () => {
    const json = JSON.stringify(MOCK_EVENTS, null, 2);
    await Share.share({
      message: json,
      title: 'Life OS — Event Log Export',
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Event log</Text>
          <Text style={styles.subtitle}>{MOCK_EVENTS.length} events recorded</Text>
        </View>
        <Pressable onPress={handleExport} style={styles.exportBtn}>
          <Text style={styles.exportText}>Export</Text>
        </Pressable>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {ALL_MODULES.map(m => (
          <Pressable
            key={m.id}
            onPress={() => setFilter(m.id as EventModule | 'all')}
            style={[styles.filterTab, filter === m.id && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, filter === m.id && styles.filterTabTextActive]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Events */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No events for this module</Text>
            </View>
          ) : (
            filtered.map((event, i) => (
              <EventRow key={event.id} event={event} isLast={i === filtered.length - 1} />
            ))
          )}
        </View>

        <Text style={styles.note}>
          Tap any event to expand its payload.
          This log is the source of truth for the entire system.
          Raw events are never edited or deleted.
        </Text>

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
  headerContent: { flex: 1 },
  title: { ...Typography.displaySM, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyXS, color: Colors.textMuted },
  exportBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportText: { ...Typography.labelSM, color: Colors.textSecondary },

  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgRaised,
  },
  filterTabActive: {
    backgroundColor: Colors.amberGlow,
    borderColor: Colors.amberBorder,
  },
  filterTabText: { ...Typography.labelSM, color: Colors.textMuted },
  filterTabTextActive: { color: Colors.amber },

  scroll: { flex: 1 },
  card: {
    margin: Spacing.xxl,
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: 'hidden',
  },
  empty: { padding: Spacing.xxl, alignItems: 'center' },
  emptyText: { ...Typography.bodyMD, color: Colors.textMuted },
  note: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    fontStyle: 'italic',
    fontFamily: 'DMSans_300Light',
    lineHeight: 18,
  },
});
