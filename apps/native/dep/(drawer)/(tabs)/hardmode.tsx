/**
 * Life OS — Hard Mode Screen
 * Route: app/hardmode.tsx  (modal, not a tab)
 *
 * Two states:
 *   1. Inactive — activation flow (scope, duration, anchors)
 *   2. Active   — plan view with flag sheet
 *
 * Design rules:
 *   - Exit is always one tap, no confirmation
 *   - Flag sheet: Not now / Not aligned / Too much
 *   - Rationale visible only on long-press
 *   - Plan is read-only card sequence, not a checklist
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { Button, Toggle } from '../components/ui';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Duration = '1d' | '3d' | '7d';
type FlagReason = 'not_now' | 'not_aligned' | 'too_much';

interface ModuleScope {
  habits: boolean;
  tasks: boolean;
  checkin: boolean;
  finance: boolean;
  weeklyReview: boolean;
}

interface PlannedItem {
  id: string;
  module: keyof ModuleScope;
  label: string;
  scheduledFor: string;
  rationale: string;
  confidence: 'low' | 'medium' | 'high';
  flagged?: FlagReason;
}

// ─────────────────────────────────────────────
// MOCK ACTIVE PLAN
// ─────────────────────────────────────────────

const MOCK_PLAN: PlannedItem[] = [
  {
    id: '1',
    module: 'checkin',
    label: 'Morning check-in',
    scheduledFor: '8:30 AM',
    rationale: 'Your energy tends to be most accurately reported in the first hour after waking.',
    confidence: 'high',
  },
  {
    id: '2',
    module: 'habits',
    label: 'Morning walk',
    scheduledFor: '9:00 AM',
    rationale: 'Walk days show 0.8pt mood increase in your data. Scheduled early to match your pattern.',
    confidence: 'high',
  },
  {
    id: '3',
    module: 'tasks',
    label: 'Reply to Dr. Osei email',
    scheduledFor: '10:30 AM',
    rationale: 'Highest priority inbox item. Scheduled mid-morning when your focus tends to peak.',
    confidence: 'medium',
  },
  {
    id: '4',
    module: 'habits',
    label: 'Journaling',
    scheduledFor: '6:00 PM',
    rationale: 'Evening anchor matches your stated preference. Lower effort to pair with end-of-day.',
    confidence: 'medium',
  },
];

const MODULE_LABELS: Record<keyof ModuleScope, string> = {
  habits:       'Habits',
  tasks:        'Tasks',
  checkin:      'Check-in',
  finance:      'Finance',
  weeklyReview: 'Weekly Review',
};

const MODULE_ICON: Record<keyof ModuleScope, string> = {
  habits:       '◇',
  tasks:        '□',
  checkin:      '○',
  finance:      '◈',
  weeklyReview: '◎',
};

// ─────────────────────────────────────────────
// ACTIVATION FLOW
// ─────────────────────────────────────────────

const DURATIONS: Array<{ id: Duration; label: string; desc: string }> = [
  { id: '1d', label: '1 day',  desc: 'High-stress day or decision fatigue spike' },
  { id: '3d', label: '3 days', desc: 'Short structured push'                     },
  { id: '7d', label: '1 week', desc: 'New routine formation'                     },
];

function ActivationFlow({ onActivate }: { onActivate: (scope: ModuleScope, duration: Duration) => void }) {
  const [scope, setScope] = useState<ModuleScope>({
    habits: true,
    tasks: true,
    checkin: false,
    finance: false,
    weeklyReview: false,
  });
  const [duration, setDuration] = useState<Duration>('1d');

  const toggleModule = (key: keyof ModuleScope) => {
    setScope(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const scopeCount = Object.values(scope).filter(Boolean).length;

  return (
    <ScrollView style={actStyles.scroll} contentContainerStyle={actStyles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={actStyles.header}>
        <Text style={actStyles.eyebrow}>Hard Mode</Text>
        <Text style={actStyles.title}>Hand the wheel{'\n'}to the AI.</Text>
        <Text style={actStyles.subtitle}>
          You choose the scope and duration. The AI plans. You flag anything that doesn't fit.
          No streaks. No failure. Exit anytime.
        </Text>
      </View>

      {/* Duration */}
      <View style={actStyles.section}>
        <Text style={actStyles.sectionLabel}>How long</Text>
        <View style={actStyles.durationList}>
          {DURATIONS.map(d => (
            <Pressable
              key={d.id}
              onPress={() => setDuration(d.id)}
              style={[actStyles.durationItem, duration === d.id && actStyles.durationItemActive]}
            >
              <View style={actStyles.durationLeft}>
                <Text style={[actStyles.durationLabel, duration === d.id && actStyles.durationLabelActive]}>
                  {d.label}
                </Text>
                <Text style={actStyles.durationDesc}>{d.desc}</Text>
              </View>
              <View style={[actStyles.durationRadio, duration === d.id && actStyles.durationRadioActive]} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Scope */}
      <View style={actStyles.section}>
        <Text style={actStyles.sectionLabel}>Which modules</Text>
        <View style={actStyles.scopeList}>
          {(Object.keys(MODULE_LABELS) as Array<keyof ModuleScope>).map(key => (
            <View key={key} style={actStyles.scopeRow}>
              <View style={actStyles.scopeIcon}>
                <Text style={actStyles.scopeIconText}>{MODULE_ICON[key]}</Text>
              </View>
              <Text style={actStyles.scopeLabel}>{MODULE_LABELS[key]}</Text>
              <Toggle value={scope[key]} onToggle={() => toggleModule(key)} />
            </View>
          ))}
        </View>
      </View>

      {/* Note */}
      <View style={actStyles.note}>
        <Text style={actStyles.noteText}>
          Modules you don't select continue in normal mode. You can flag any AI decision at any time.
          Exiting is instant — no confirmation required.
        </Text>
      </View>

      {/* Activate */}
      <Button
        label={`Activate Hard Mode — ${duration}`}
        variant="primary"
        onPress={() => onActivate(scope, duration)}
        disabled={scopeCount === 0}
        style={actStyles.activateBtn}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const actStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  header: { marginBottom: Spacing.xxxl },
  eyebrow: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.sm },
  title: { ...Typography.displayXL, color: Colors.textPrimary, marginBottom: Spacing.md },
  subtitle: { ...Typography.bodyMD, color: Colors.textSecondary, fontFamily: 'DMSans_300Light', lineHeight: 22 },
  section: { marginBottom: Spacing.xxl },
  sectionLabel: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.md },
  durationList: { gap: Spacing.sm },
  durationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.lg,
  },
  durationItemActive: { borderColor: Colors.amberBorder, backgroundColor: Colors.amberGlow },
  durationLeft: { flex: 1, gap: 3 },
  durationLabel: { ...Typography.labelLG, color: Colors.textSecondary },
  durationLabelActive: { color: Colors.amber },
  durationDesc: { ...Typography.bodyXS, color: Colors.textMuted },
  durationRadio: {
    width: 18, height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  durationRadioActive: { borderColor: Colors.amber, backgroundColor: Colors.amber },
  scopeList: { gap: 0, backgroundColor: Colors.bgRaised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderSoft, overflow: 'hidden' },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  scopeIcon: {
    width: 28, height: 28,
    backgroundColor: Colors.bgFloat,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeIconText: { fontSize: 11, color: Colors.textMuted, fontFamily: 'monospace' },
  scopeLabel: { ...Typography.bodyMD, color: Colors.textPrimary, flex: 1 },
  note: {
    backgroundColor: Colors.amberGlow,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  noteText: { ...Typography.bodySM, color: Colors.textSecondary, fontFamily: 'DMSans_300Light', fontStyle: 'italic', lineHeight: 20 },
  activateBtn: { marginBottom: Spacing.md },
});

// ─────────────────────────────────────────────
// ACTIVE PLAN VIEW
// ─────────────────────────────────────────────

function FlagSheet({ item, onFlag, onClose }: {
  item: PlannedItem;
  onFlag: (reason: FlagReason) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, damping: 25, useNativeDriver: true }).start();
  }, []);

  const close = (cb?: () => void) => {
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => {
      onClose();
      cb?.();
    });
  };

  const FLAGS: Array<{ reason: FlagReason; label: string; desc: string }> = [
    { reason: 'not_now',     label: 'Not now',      desc: 'Push this to later today'          },
    { reason: 'not_aligned', label: 'Not aligned',  desc: 'Remove this from today entirely'   },
    { reason: 'too_much',    label: 'Too much',      desc: 'Trim today\'s plan by one item'    },
  ];

  return (
    <View style={flagStyles.overlay}>
      <Pressable style={flagStyles.backdrop} onPress={() => close()} />
      <Animated.View style={[flagStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={flagStyles.handle} />
        <Text style={flagStyles.title}>Flag this item</Text>
        <Text style={flagStyles.item}>{item.label}</Text>
        <View style={flagStyles.options}>
          {FLAGS.map(f => (
            <Pressable
              key={f.reason}
              onPress={() => close(() => onFlag(f.reason))}
              style={flagStyles.option}
            >
              <Text style={flagStyles.optionLabel}>{f.label}</Text>
              <Text style={flagStyles.optionDesc}>{f.desc}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={flagStyles.note}>
          No explanation needed. Flags are signal, not complaint.
        </Text>
      </Animated.View>
    </View>
  );
}

const flagStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 200, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.bgRaised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    paddingBottom: 48,
  },
  handle: { width: 36, height: 3, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xxl },
  title: { ...Typography.displaySM, color: Colors.textPrimary, marginBottom: Spacing.xs },
  item: { ...Typography.bodySM, color: Colors.textMuted, fontStyle: 'italic', fontFamily: 'DMSans_300Light', marginBottom: Spacing.xl },
  options: { gap: Spacing.sm, marginBottom: Spacing.xl },
  option: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.lg,
    gap: 3,
  },
  optionLabel: { ...Typography.labelLG, color: Colors.textPrimary },
  optionDesc: { ...Typography.bodySM, color: Colors.textMuted },
  note: { ...Typography.bodyXS, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic', fontFamily: 'DMSans_300Light' },
});

function PlanItemCard({ item, onFlag }: { item: PlannedItem; onFlag: () => void }) {
  const [showRationale, setShowRationale] = useState(false);

  return (
    <Pressable
      onLongPress={() => setShowRationale(prev => !prev)}
      style={[planStyles.card, item.flagged && planStyles.cardFlagged]}
    >
      <View style={planStyles.timeCol}>
        <Text style={planStyles.time}>{item.scheduledFor}</Text>
      </View>
      <View style={planStyles.mainCol}>
        <View style={planStyles.moduleTag}>
          <Text style={planStyles.moduleIcon}>{MODULE_ICON[item.module]}</Text>
          <Text style={planStyles.moduleName}>{MODULE_LABELS[item.module]}</Text>
        </View>
        <Text style={[planStyles.label, item.flagged && planStyles.labelFlagged]}>
          {item.label}
        </Text>
        {showRationale && (
          <Text style={planStyles.rationale}>{item.rationale}</Text>
        )}
        {item.flagged && (
          <Text style={planStyles.flaggedLabel}>{item.flagged.replace('_', ' ')}</Text>
        )}
        {!showRationale && (
          <Text style={planStyles.longPressHint}>hold to see why</Text>
        )}
      </View>
      {!item.flagged && (
        <Pressable onPress={onFlag} style={planStyles.flagBtn}>
          <Text style={planStyles.flagBtnText}>⚑</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const planStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  cardFlagged: { opacity: 0.5, borderColor: Colors.border },
  timeCol: {
    width: 72,
    padding: Spacing.lg,
    borderRightWidth: 1,
    borderRightColor: Colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.xl,
    backgroundColor: Colors.bgElevated,
  },
  time: { ...Typography.labelSM, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
  mainCol: { flex: 1, padding: Spacing.lg, gap: Spacing.xs },
  moduleTag: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  moduleIcon: { fontSize: 10, color: Colors.textMuted, fontFamily: 'monospace' },
  moduleName: { ...Typography.eyebrow, color: Colors.textMuted },
  label: { ...Typography.labelLG, color: Colors.textPrimary, lineHeight: 20 },
  labelFlagged: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  rationale: { ...Typography.bodySM, color: Colors.textSecondary, fontStyle: 'italic', fontFamily: 'DMSans_300Light', lineHeight: 18, marginTop: Spacing.xs },
  flaggedLabel: { ...Typography.eyebrow, color: Colors.rose, fontSize: 9 },
  longPressHint: { ...Typography.bodyXS, color: Colors.textMuted, opacity: 0.5 },
  flagBtn: { padding: Spacing.lg, justifyContent: 'center' },
  flagBtnText: { fontSize: 16, color: Colors.textMuted },
});

function ActivePlan({ plan, onExit, onFlag }: {
  plan: PlannedItem[];
  onExit: () => void;
  onFlag: (id: string, reason: FlagReason) => void;
}) {
  const [flaggingItem, setFlaggingItem] = useState<PlannedItem | null>(null);

  return (
    <View style={{ flex: 1 }}>
      {/* Mode indicator */}
      <View style={activeStyles.indicator}>
        <View style={activeStyles.indicatorDot} />
        <Text style={activeStyles.indicatorText}>Hard Mode active</Text>
        <Pressable onPress={onExit} style={activeStyles.exitBtn}>
          <Text style={activeStyles.exitText}>Exit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xxl, paddingBottom: 40 }}>
        <View style={activeStyles.header}>
          <Text style={activeStyles.title}>Today's{'\n'}plan.</Text>
          <Text style={activeStyles.subtitle}>
            Long-press any item to see why. Flag anything that doesn't fit.
          </Text>
        </View>

        {plan.map(item => (
          <PlanItemCard
            key={item.id}
            item={item}
            onFlag={() => setFlaggingItem(item)}
          />
        ))}

        {/* Crisis override */}
        <Pressable style={activeStyles.crisisBtn} onPress={() => {
          Alert.alert('Clear today\'s plan', 'This clears all planned items for today. No explanation needed.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear all', style: 'destructive', onPress: onExit },
          ]);
        }}>
          <Text style={activeStyles.crisisText}>Clear today's plan</Text>
        </Pressable>
      </ScrollView>

      {flaggingItem && (
        <FlagSheet
          item={flaggingItem}
          onFlag={(reason) => {
            onFlag(flaggingItem.id, reason);
            setFlaggingItem(null);
          }}
          onClose={() => setFlaggingItem(null)}
        />
      )}
    </View>
  );
}

const activeStyles = StyleSheet.create({
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    backgroundColor: Colors.bgRaised,
  },
  indicatorDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.amber,
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  indicatorText: { ...Typography.labelMD, color: Colors.amber, flex: 1 },
  exitBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exitText: { ...Typography.labelSM, color: Colors.textMuted },
  header: { paddingTop: Spacing.xxl, marginBottom: Spacing.xxl },
  title: { ...Typography.displayXL, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodyMD, color: Colors.textSecondary, fontFamily: 'DMSans_300Light' },
  crisisBtn: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  crisisText: { ...Typography.labelMD, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// HARD MODE SCREEN
// ─────────────────────────────────────────────

export default function HardModeScreen() {
  const [active, setActive] = useState(false);
  const [plan, setPlan] = useState<PlannedItem[]>(MOCK_PLAN);

  const activate = (scope: ModuleScope, duration: Duration) => {
    setActive(true);
  };

  const exit = () => {
    setActive(false);
  };

  const flagItem = (id: string, reason: FlagReason) => {
    setPlan(prev => prev.map(p => p.id === id ? { ...p, flagged: reason } : p));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {active ? (
        <ActivePlan plan={plan} onExit={exit} onFlag={flagItem} />
      ) : (
        <ActivationFlow onActivate={activate} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
});
