/**
 * Life OS — Habits Screen
 * Route: app/(tabs)/habits/index.tsx
 *
 * Sections:
 *   - Today's habits (anchor-grouped)
 *   - Habit history strip
 *   - Add habit sheet
 *
 * Design rules enforced here:
 *   - No streaks visible anywhere
 *   - Skip is a positive, intentional action
 *   - Missed habits leave no gap or negative state
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { SectionLabel, Button, EmptyState, Badge } from '../../components/ui';

// ─────────────────────────────────────────────
// TYPES + MOCK DATA
// ─────────────────────────────────────────────

type Anchor = 'morning' | 'afternoon' | 'evening' | 'anytime';
type Difficulty = 'low' | 'medium' | 'high';
type HabitStatus = 'pending' | 'done' | 'skipped';

interface Habit {
  id: string;
  name: string;
  cadence: string;
  anchor: Anchor;
  difficulty: Difficulty;
  status: HabitStatus;
}

const MOCK_HABITS: Habit[] = [
  { id: '1', name: 'Morning walk',      cadence: 'daily',    anchor: 'morning',   difficulty: 'low',    status: 'done'    },
  { id: '2', name: 'Journaling',        cadence: 'daily',    anchor: 'morning',   difficulty: 'medium', status: 'pending' },
  { id: '3', name: 'Afternoon stretch', cadence: 'weekdays', anchor: 'afternoon', difficulty: 'low',    status: 'pending' },
  { id: '4', name: 'Read 20 pages',     cadence: 'daily',    anchor: 'evening',   difficulty: 'low',    status: 'pending' },
  { id: '5', name: 'Meditation',        cadence: 'daily',    anchor: 'evening',   difficulty: 'medium', status: 'pending' },
];

const ANCHOR_LABEL: Record<Anchor, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  anytime: 'Anytime',
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  low: Colors.sage,
  medium: Colors.amber,
  high: Colors.rose,
};

// ─────────────────────────────────────────────
// HABIT CARD
// ─────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  onLog: (id: string) => void;
  onSkip: (id: string) => void;
}

function HabitCard({ habit, onLog, onSkip }: HabitCardProps) {
  const [showActions, setShowActions] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleActions = () => {
    const next = !showActions;
    setShowActions(next);
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: next ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(expandAnim, {
        toValue: next ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const actionsHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 52],
  });

  const isDone = habit.status === 'done';
  const isSkipped = habit.status === 'skipped';
  const isResolved = isDone || isSkipped;

  return (
    <View style={[cardStyles.wrap, isResolved && cardStyles.wrapResolved]}>
      <Pressable onPress={isResolved ? undefined : toggleActions} style={cardStyles.main}>
        {/* Status indicator */}
        <View style={[
          cardStyles.statusDot,
          isDone    && cardStyles.statusDone,
          isSkipped && cardStyles.statusSkipped,
        ]}>
          {isDone    && <Text style={cardStyles.statusIcon}>✓</Text>}
          {isSkipped && <Text style={cardStyles.statusIcon}>·</Text>}
        </View>

        {/* Info */}
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, isResolved && cardStyles.nameResolved]}>
            {habit.name}
          </Text>
          <View style={cardStyles.meta}>
            <View style={[cardStyles.diffDot, { backgroundColor: DIFFICULTY_COLOR[habit.difficulty] }]} />
            <Text style={cardStyles.cadence}>{habit.cadence}</Text>
            {isSkipped && <Text style={cardStyles.skippedLabel}>intentional rest</Text>}
          </View>
        </View>

        {/* Expand chevron */}
        {!isResolved && (
          <Animated.Text style={[cardStyles.chevron, { transform: [{ rotate }] }]}>
            ›
          </Animated.Text>
        )}
      </Pressable>

      {/* Actions */}
      {!isResolved && (
        <Animated.View style={[cardStyles.actions, { height: actionsHeight }]}>
          <View style={cardStyles.actionsInner}>
            <Pressable
              onPress={() => { onLog(habit.id); setShowActions(false); }}
              style={[cardStyles.actionBtn, cardStyles.actionBtnDone]}
            >
              <Text style={cardStyles.actionBtnDoneText}>Done</Text>
            </Pressable>
            <Pressable
              onPress={() => { onSkip(habit.id); setShowActions(false); }}
              style={[cardStyles.actionBtn, cardStyles.actionBtnSkip]}
            >
              <Text style={cardStyles.actionBtnSkipText}>Skip today</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  wrapResolved: { opacity: 0.65 },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusDone:    { backgroundColor: Colors.sage,   borderColor: Colors.sage  },
  statusSkipped: { backgroundColor: Colors.bgFloat, borderColor: Colors.border },
  statusIcon: { fontSize: 11, color: Colors.bg, fontWeight: '700' },
  info: { flex: 1 },
  name: { ...Typography.bodyMD, color: Colors.textPrimary, marginBottom: 3 },
  nameResolved: { color: Colors.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  diffDot: { width: 5, height: 5, borderRadius: 3 },
  cadence: { ...Typography.bodyXS, color: Colors.textMuted },
  skippedLabel: {
    ...Typography.eyebrow,
    color: Colors.sage,
    fontSize: 9,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.sageGlow,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.sageBorder,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  actions: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  actionsInner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  actionBtnDone: {
    backgroundColor: Colors.sageGlow,
    borderColor: Colors.sageBorder,
  },
  actionBtnDoneText: { ...Typography.labelMD, color: Colors.sage },
  actionBtnSkip: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.border,
  },
  actionBtnSkipText: { ...Typography.labelMD, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// ADD HABIT SHEET
// ─────────────────────────────────────────────

const ANCHORS: Anchor[] = ['morning', 'afternoon', 'evening', 'anytime'];
const DIFFICULTIES: Difficulty[] = ['low', 'medium', 'high'];
const CADENCES = ['daily', 'weekdays', 'custom'];

interface AddHabitSheetProps { onClose: () => void; onAdd: (h: Partial<Habit>) => void; }

function AddHabitSheet({ onClose, onAdd }: AddHabitSheetProps) {
  const [name, setName] = useState('');
  const [anchor, setAnchor] = useState<Anchor>('morning');
  const [difficulty, setDifficulty] = useState<Difficulty>('low');
  const [cadence, setCadence] = useState('daily');
  const slideAnim = useRef(new Animated.Value(600)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, damping: 28, stiffness: 300, useNativeDriver: true }).start();
  }, []);

  const close = () => {
    Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(onClose);
  };

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), anchor, difficulty, cadence, status: 'pending' });
    close();
  };

  return (
    <View style={sheetStyles.overlay}>
      <Pressable style={sheetStyles.backdrop} onPress={close} />
      <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.title}>New habit</Text>

        <TextInput
          style={sheetStyles.input}
          placeholder="What do you want to do?"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={sheetStyles.label}>When</Text>
        <View style={sheetStyles.chipRow}>
          {ANCHORS.map(a => (
            <Pressable
              key={a}
              onPress={() => setAnchor(a)}
              style={[sheetStyles.chip, anchor === a && sheetStyles.chipActive]}
            >
              <Text style={[sheetStyles.chipText, anchor === a && sheetStyles.chipTextActive]}>
                {ANCHOR_LABEL[a]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={sheetStyles.label}>How often</Text>
        <View style={sheetStyles.chipRow}>
          {CADENCES.map(c => (
            <Pressable
              key={c}
              onPress={() => setCadence(c)}
              style={[sheetStyles.chip, cadence === c && sheetStyles.chipActive]}
            >
              <Text style={[sheetStyles.chipText, cadence === c && sheetStyles.chipTextActive]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={sheetStyles.label}>Effort level</Text>
        <View style={sheetStyles.chipRow}>
          {DIFFICULTIES.map(d => (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              style={[sheetStyles.chip, difficulty === d && sheetStyles.chipActive]}
            >
              <View style={[sheetStyles.diffDot, { backgroundColor: DIFFICULTY_COLOR[d] }]} />
              <Text style={[sheetStyles.chipText, difficulty === d && sheetStyles.chipTextActive]}>
                {d}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={sheetStyles.btnRow}>
          <Button label="Cancel" variant="ghost" onPress={close} style={{ flex: 0, paddingHorizontal: Spacing.xl }} />
          <Button label="Add habit" variant="primary" onPress={submit} disabled={!name.trim()} style={{ flex: 1 }} />
        </View>
      </Animated.View>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
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
  handle: {
    width: 36, height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.xxl,
  },
  title: { ...Typography.displayMD, color: Colors.textPrimary, marginBottom: Spacing.xl },
  input: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.bodyMD,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  label: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  chipActive: { backgroundColor: Colors.amberGlow, borderColor: Colors.amberBorder },
  chipText: { ...Typography.labelMD, color: Colors.textMuted },
  chipTextActive: { color: Colors.amber },
  diffDot: { width: 6, height: 6, borderRadius: 3 },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
});

// ─────────────────────────────────────────────
// HABITS SCREEN
// ─────────────────────────────────────────────

export default function HabitsScreen() {
  const [habits, setHabits] = useState(MOCK_HABITS);
  const [showAdd, setShowAdd] = useState(false);

  const grouped = ANCHORS.reduce((acc, anchor) => {
    const items = habits.filter(h => h.anchor === anchor);
    if (items.length) acc[anchor] = items;
    return acc;
  }, {} as Record<Anchor, Habit[]>);

  const logHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, status: 'done' } : h));
  };

  const skipHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, status: 'skipped' } : h));
  };

  const addHabit = (data: Partial<Habit>) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: data.name ?? '',
      cadence: data.cadence ?? 'daily',
      anchor: data.anchor ?? 'morning',
      difficulty: data.difficulty ?? 'low',
      status: 'pending',
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const doneCount = habits.filter(h => h.status === 'done').length;
  const skippedCount = habits.filter(h => h.status === 'skipped').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Habits</Text>
          <Text style={styles.title}>Today's{'\n'}routines.</Text>
          {/* No streaks — just today's count */}
          <View style={styles.countRow}>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{doneCount} done</Text>
            </View>
            {skippedCount > 0 && (
              <View style={[styles.countPill, styles.countPillSkip]}>
                <Text style={[styles.countText, { color: Colors.textMuted }]}>
                  {skippedCount} resting
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Grouped habits */}
        {(Object.keys(grouped) as Anchor[]).map(anchor => (
          <View key={anchor} style={styles.group}>
            <SectionLabel>{ANCHOR_LABEL[anchor]}</SectionLabel>
            {grouped[anchor].map(h => (
              <HabitCard key={h.id} habit={h} onLog={logHabit} onSkip={skipHabit} />
            ))}
          </View>
        ))}

        {/* Add button */}
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add habit</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {showAdd && (
        <AddHabitSheet onClose={() => setShowAdd(false)} onAdd={addHabit} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  header: { marginBottom: Spacing.xxxl },
  eyebrow: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.sm },
  title: { ...Typography.displayXL, color: Colors.textPrimary, marginBottom: Spacing.lg },
  countRow: { flexDirection: 'row', gap: Spacing.sm },
  countPill: {
    backgroundColor: Colors.sageGlow,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.sageBorder,
  },
  countPillSkip: {
    backgroundColor: Colors.bgRaised,
    borderColor: Colors.border,
  },
  countText: { ...Typography.labelSM, color: Colors.sage },
  group: { marginBottom: Spacing.xxl },
  addBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addBtnText: { ...Typography.labelLG, color: Colors.textMuted },
});
