/**
 * Life OS — Check-in Screen
 * Route: app/(tabs)/checkin/index.tsx
 *
 * Two modes: daily (quick) and weekly (reflective).
 * Mood picker: emoji-anchored 1–5.
 * Energy slider: 1–5 with haptic feedback.
 * Flag chips: quick tags.
 * Optional private note.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../../constants/theme';
import { Button } from '../../../components/ui';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Rough'   },
  { value: 2, emoji: '😕', label: 'Low'     },
  { value: 3, emoji: '😐', label: 'Okay'    },
  { value: 4, emoji: '🙂', label: 'Good'    },
  { value: 5, emoji: '😊', label: 'Great'   },
];

const FLAG_OPTIONS = [
  'anxious', 'calm', 'grateful', 'overwhelmed',
  'focused', 'tired', 'restless', 'hopeful',
  'irritable', 'connected', 'lonely', 'proud',
];

const WEEKLY_PROMPTS = [
  'What felt good this week?',
  'What felt hard?',
  'What do I want to carry into next week?',
];

// ─────────────────────────────────────────────
// MOOD PICKER
// ─────────────────────────────────────────────

function MoodPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={moodStyles.row}>
      {MOOD_OPTIONS.map(opt => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              moodStyles.item,
              selected && moodStyles.itemSelected,
              pressed && moodStyles.itemPressed,
            ]}
          >
            <Text style={[moodStyles.emoji, selected && moodStyles.emojiSelected]}>
              {opt.emoji}
            </Text>
            <Text style={[moodStyles.label, selected && moodStyles.labelSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const moodStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.bgRaised,
  },
  itemSelected: {
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberGlow,
  },
  itemPressed: { opacity: 0.7 },
  emoji: { fontSize: 22 },
  emojiSelected: {},
  label: { ...Typography.eyebrow, color: Colors.textMuted, fontSize: 9 },
  labelSelected: { color: Colors.amber },
});

// ─────────────────────────────────────────────
// ENERGY SLIDER
// ─────────────────────────────────────────────

function EnergySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const LEVELS = [1, 2, 3, 4, 5];
  return (
    <View style={energyStyles.wrap}>
      <View style={energyStyles.track}>
        {LEVELS.map(l => (
          <Pressable
            key={l}
            onPress={() => onChange(l)}
            style={[
              energyStyles.segment,
              l <= value && energyStyles.segmentFilled,
              l === 1 && energyStyles.segmentFirst,
              l === 5 && energyStyles.segmentLast,
            ]}
          />
        ))}
      </View>
      <View style={energyStyles.labels}>
        <Text style={energyStyles.labelText}>Low</Text>
        <Text style={energyStyles.labelValue}>{value}/5</Text>
        <Text style={energyStyles.labelText}>High</Text>
      </View>
    </View>
  );
}

const energyStyles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  track: { flexDirection: 'row', height: 10, gap: 3 },
  segment: {
    flex: 1,
    backgroundColor: Colors.borderSoft,
    borderRadius: 2,
  },
  segmentFilled: { backgroundColor: Colors.amber },
  segmentFirst: { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
  segmentLast:  { borderTopRightRadius: 5, borderBottomRightRadius: 5 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelText: { ...Typography.bodyXS, color: Colors.textMuted },
  labelValue: { ...Typography.labelMD, color: Colors.amber },
});

// ─────────────────────────────────────────────
// FLAG CHIPS
// ─────────────────────────────────────────────

function FlagChips({ selected, onToggle }: { selected: string[]; onToggle: (f: string) => void }) {
  return (
    <View style={flagStyles.wrap}>
      {FLAG_OPTIONS.map(flag => {
        const active = selected.includes(flag);
        return (
          <Pressable
            key={flag}
            onPress={() => onToggle(flag)}
            style={[flagStyles.chip, active && flagStyles.chipActive]}
          >
            <Text style={[flagStyles.chipText, active && flagStyles.chipTextActive]}>
              {flag}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const flagStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgRaised,
  },
  chipActive: {
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberGlow,
  },
  chipText: { ...Typography.labelSM, color: Colors.textMuted },
  chipTextActive: { color: Colors.amber },
});

// ─────────────────────────────────────────────
// RECENT CHECK-INS STRIP
// ─────────────────────────────────────────────

const RECENT = [
  { day: 'Mon', mood: 4, energy: 3 },
  { day: 'Tue', mood: 2, energy: 2 },
  { day: 'Wed', mood: 3, energy: 4 },
  { day: 'Thu', mood: 4, energy: 4 },
  { day: 'Fri', mood: 5, energy: 4 },
  { day: 'Sat', mood: 3, energy: 3 },
  { day: 'Sun', mood: null, energy: null },
];

const MOOD_EMOJI_SM = ['', '😞', '😕', '😐', '🙂', '😊'];

function RecentStrip() {
  return (
    <View style={recentStyles.wrap}>
      {RECENT.map((r, i) => (
        <View key={i} style={recentStyles.day}>
          <Text style={recentStyles.emoji}>
            {r.mood ? MOOD_EMOJI_SM[r.mood] : '—'}
          </Text>
          <View
            style={[
              recentStyles.energyBar,
              { height: r.energy ? r.energy * 5 + 4 : 4 },
              r.energy ? recentStyles.energyBarFilled : recentStyles.energyBarEmpty,
            ]}
          />
          <Text style={recentStyles.dayLabel}>{r.day}</Text>
        </View>
      ))}
    </View>
  );
}

const recentStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.lg,
  },
  day: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emoji: { fontSize: 14 },
  energyBar: {
    width: 4,
    borderRadius: 2,
  },
  energyBarFilled: { backgroundColor: Colors.amber },
  energyBarEmpty:  { backgroundColor: Colors.borderSoft },
  dayLabel: { ...Typography.eyebrow, fontSize: 9, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// CHECK-IN SCREEN
// ─────────────────────────────────────────────

export default function CheckinScreen() {
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(3);
  const [flags, setFlags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [weeklyAnswers, setWeeklyAnswers] = useState<string[]>(['', '', '']);
  const [submitted, setSubmitted] = useState(false);

  const successAnim = useRef(new Animated.Value(0)).current;

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const submit = () => {
    setSubmitted(true);
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, damping: 15 }).start();
  };

  const canSubmit = mood !== null;

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={[styles.successWrap, {
          opacity: successAnim,
          transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        }]}>
          <Text style={styles.successEmoji}>{MOOD_EMOJI_SM[mood ?? 3]}</Text>
          <Text style={styles.successTitle}>Checked in.</Text>
          <Text style={styles.successSub}>
            {flags.length > 0 ? `Feeling ${flags.slice(0, 2).join(' and ')}.` : 'See you tomorrow.'}
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Check-in</Text>
          <Text style={styles.title}>How are{'\n'}you doing?</Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          {(['daily', 'weekly'] as const).map(m => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === 'daily' ? 'Daily' : 'Weekly'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Recent strip */}
        <View style={styles.section}>
          <RecentStrip />
        </View>

        {/* Mood */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>How's your mood?</Text>
          <MoodPicker value={mood} onChange={setMood} />
        </View>

        {/* Energy */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Energy level</Text>
          <EnergySlider value={energy} onChange={setEnergy} />
        </View>

        {/* Flags */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Anything showing up?</Text>
          <FlagChips selected={flags} onToggle={toggleFlag} />
        </View>

        {/* Weekly prompts */}
        {mode === 'weekly' && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Reflect</Text>
            {WEEKLY_PROMPTS.map((prompt, i) => (
              <View key={i} style={styles.promptGroup}>
                <Text style={styles.promptText}>{prompt}</Text>
                <TextInput
                  style={styles.promptInput}
                  placeholder="Take your time…"
                  placeholderTextColor={Colors.textMuted}
                  value={weeklyAnswers[i]}
                  onChangeText={text => {
                    const next = [...weeklyAnswers];
                    next[i] = text;
                    setWeeklyAnswers(next);
                  }}
                  multiline
                  numberOfLines={3}
                />
              </View>
            ))}
          </View>
        )}

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Private note <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Anything else on your mind…"
            placeholderTextColor={Colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit */}
        <Button
          label="Submit check-in"
          variant="primary"
          onPress={submit}
          disabled={!canSubmit}
          style={{ marginBottom: 48 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  header: { marginBottom: Spacing.xxl },
  eyebrow: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.sm },
  title: { ...Typography.displayXL, color: Colors.textPrimary },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 3,
    marginBottom: Spacing.xxl,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  modeBtnActive: { backgroundColor: Colors.bgFloat },
  modeBtnText: { ...Typography.labelMD, color: Colors.textMuted },
  modeBtnTextActive: { color: Colors.textPrimary },
  section: { marginBottom: Spacing.xxl },
  fieldLabel: { ...Typography.labelLG, color: Colors.textSecondary, marginBottom: Spacing.md },
  optional: { ...Typography.bodyXS, color: Colors.textMuted, fontFamily: 'DMSans_300Light' },
  promptGroup: { marginBottom: Spacing.lg },
  promptText: { ...Typography.bodySM, color: Colors.textSecondary, marginBottom: Spacing.sm, fontStyle: 'italic', fontFamily: 'DMSans_300Light' },
  promptInput: {
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    ...Typography.bodyMD,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  noteInput: {
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Typography.bodyMD,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  // Success
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  successEmoji: { fontSize: 56 },
  successTitle: { ...Typography.displayLG, color: Colors.textPrimary },
  successSub: { ...Typography.bodyMD, color: Colors.textSecondary, fontFamily: 'DMSans_300Light' },
});
