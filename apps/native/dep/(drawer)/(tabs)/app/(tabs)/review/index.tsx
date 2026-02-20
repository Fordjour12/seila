/**
 * Life OS — Weekly Review Screen
 * Route: app/(tabs)/review/index.tsx
 *
 * 4 phases: Look Back → Reflect → Intentions → Close
 * AI generates the look-back summary.
 * User controls: skip any phase, skip entire review.
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Button } from '../../components/ui';

const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────
// MOCK AI SUMMARY
// ─────────────────────────────────────────────

const MOCK_SUMMARY = {
  bullets: [
    '5 habit completions logged across the week',
    '4 daily check-ins completed — Monday through Friday',
    '2 focus tasks completed, 1 carried forward',
    'Spending stayed within most envelope ceilings',
  ],
  brightSpot: 'Wednesday showed your highest energy of the week — you logged both a walk and journaling.',
  worthNoticing: 'Check-ins trailed off toward the weekend, which tracks with your Sunday energy pattern.',
};

const REFLECT_PROMPTS = [
  'What felt good this week?',
  'What felt hard or heavy?',
  'What do you want to carry into next week?',
];

// ─────────────────────────────────────────────
// PHASE INDICATOR
// ─────────────────────────────────────────────

function PhaseIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={phaseStyles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            phaseStyles.dot,
            i < current ? phaseStyles.dotDone : i === current ? phaseStyles.dotActive : phaseStyles.dotPending,
          ]}
        />
      ))}
    </View>
  );
}

const phaseStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxl },
  dot: { height: 3, flex: 1, borderRadius: 2 },
  dotDone: { backgroundColor: Colors.sage },
  dotActive: { backgroundColor: Colors.amber },
  dotPending: { backgroundColor: Colors.borderSoft },
});

// ─────────────────────────────────────────────
// PHASE 1: LOOK BACK
// ─────────────────────────────────────────────

function LookBackPhase({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={phaseContentStyles.wrap}>
      <Text style={phaseContentStyles.phaseLabel}>Look back</Text>
      <Text style={phaseContentStyles.title}>Your week{'\n'}in brief.</Text>

      {loading ? (
        <View style={lookStyles.loading}>
          <Animated.Text style={lookStyles.loadingText}>
            The AI is reading your week…
          </Animated.Text>
        </View>
      ) : (
        <View style={lookStyles.summaryCard}>
          {/* Bullets */}
          <View style={lookStyles.bullets}>
            {MOCK_SUMMARY.bullets.map((b, i) => (
              <View key={i} style={lookStyles.bulletRow}>
                <View style={lookStyles.bulletDot} />
                <Text style={lookStyles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Bright spot */}
          <View style={lookStyles.highlight}>
            <Text style={lookStyles.highlightLabel}>Bright spot</Text>
            <Text style={lookStyles.highlightText}>{MOCK_SUMMARY.brightSpot}</Text>
          </View>

          {/* Worth noticing */}
          <View style={[lookStyles.highlight, lookStyles.highlightAlt]}>
            <Text style={lookStyles.highlightLabel}>Worth noticing</Text>
            <Text style={lookStyles.highlightText}>{MOCK_SUMMARY.worthNoticing}</Text>
          </View>
        </View>
      )}

      {!loading && (
        <Button label="Continue to reflection →" variant="primary" onPress={onNext} />
      )}
    </View>
  );
}

const lookStyles = StyleSheet.create({
  loading: { paddingVertical: 48, alignItems: 'center' },
  loadingText: { ...Typography.bodySM, color: Colors.textMuted, fontStyle: 'italic', fontFamily: 'DMSans_300Light' },
  summaryCard: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  bullets: { padding: Spacing.xl, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSoft },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.textMuted, marginTop: 7, flexShrink: 0 },
  bulletText: { ...Typography.bodyMD, color: Colors.textSecondary, flex: 1, lineHeight: 22 },
  highlight: {
    padding: Spacing.xl,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    backgroundColor: Colors.sageGlow,
  },
  highlightAlt: { backgroundColor: Colors.amberGlow, borderBottomWidth: 0 },
  highlightLabel: { ...Typography.eyebrow, color: Colors.textMuted },
  highlightText: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: 'DMSans_300Light',
    lineHeight: 20,
  },
});

// ─────────────────────────────────────────────
// PHASE 2: REFLECT
// ─────────────────────────────────────────────

function ReflectPhase({ onNext }: { onNext: (answers: string[]) => void }) {
  const [answers, setAnswers] = useState(['', '', '']);
  const [current, setCurrent] = useState(0);

  const updateAnswer = (i: number, text: string) => {
    setAnswers(prev => { const n = [...prev]; n[i] = text; return n; });
  };

  const next = () => {
    if (current < REFLECT_PROMPTS.length - 1) {
      setCurrent(c => c + 1);
    } else {
      onNext(answers);
    }
  };

  return (
    <View style={phaseContentStyles.wrap}>
      <Text style={phaseContentStyles.phaseLabel}>Reflect</Text>
      <Text style={phaseContentStyles.title}>
        {current + 1}/{REFLECT_PROMPTS.length}
      </Text>

      <View style={reflectStyles.promptCard}>
        <Text style={reflectStyles.prompt}>{REFLECT_PROMPTS[current]}</Text>
        <TextInput
          style={reflectStyles.answer}
          placeholder="Take your time…"
          placeholderTextColor={Colors.textMuted}
          value={answers[current]}
          onChangeText={text => updateAnswer(current, text)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
        />
      </View>

      <View style={reflectStyles.btnRow}>
        <Pressable onPress={next} style={reflectStyles.skipBtn}>
          <Text style={reflectStyles.skipText}>Skip this one</Text>
        </Pressable>
        <Button
          label={current < REFLECT_PROMPTS.length - 1 ? 'Next →' : 'Continue →'}
          variant="primary"
          onPress={next}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const reflectStyles = StyleSheet.create({
  promptCard: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.xl,
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
    flex: 1,
  },
  prompt: {
    ...Typography.displaySM,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  answer: {
    ...Typography.bodyMD,
    color: Colors.textPrimary,
    flex: 1,
    fontFamily: 'DMSans_300Light',
  },
  btnRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  skipBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm },
  skipText: { ...Typography.labelMD, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// PHASE 3: INTENTIONS
// ─────────────────────────────────────────────

function IntentionsPhase({ onNext }: { onNext: (intentions: string[]) => void }) {
  const [intentions, setIntentions] = useState(['', '', '']);

  const update = (i: number, text: string) => {
    setIntentions(prev => { const n = [...prev]; n[i] = text; return n; });
  };

  const filled = intentions.filter(i => i.trim()).length;

  return (
    <View style={phaseContentStyles.wrap}>
      <Text style={phaseContentStyles.phaseLabel}>Intentions</Text>
      <Text style={phaseContentStyles.title}>Next week,{'\n'}I want to…</Text>
      <Text style={phaseContentStyles.subtitle}>
        1–3 loose intentions. Not commitments — directions.
      </Text>

      <View style={intentStyles.slots}>
        {intentions.map((val, i) => (
          <View key={i} style={intentStyles.slot}>
            <View style={intentStyles.slotNum}>
              <Text style={intentStyles.slotNumText}>{i + 1}</Text>
            </View>
            <TextInput
              style={intentStyles.input}
              placeholder={
                i === 0 ? 'Something I want to nurture…'
                : i === 1 ? 'Something I want to try…'
                : 'Something I want to let go of…'
              }
              placeholderTextColor={Colors.textMuted}
              value={val}
              onChangeText={text => update(i, text)}
              returnKeyType="next"
            />
          </View>
        ))}
      </View>

      <Button
        label="Seal the week →"
        variant="primary"
        onPress={() => onNext(intentions.filter(i => i.trim()))}
        disabled={filled === 0}
        style={{ marginTop: Spacing.xxl }}
      />
    </View>
  );
}

const intentStyles = StyleSheet.create({
  slots: { gap: Spacing.md },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  slotNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.bgFloat,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  slotNumText: { ...Typography.eyebrow, color: Colors.textMuted },
  input: { flex: 1, ...Typography.bodyMD, color: Colors.textPrimary, paddingVertical: 0 },
});

// ─────────────────────────────────────────────
// PHASE 4: CLOSE
// ─────────────────────────────────────────────

function ClosePhase({ intentions }: { intentions: string[] }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, damping: 15, useNativeDriver: true }).start();
  }, []);

  const weekStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <Animated.View style={[closeStyles.wrap, { transform: [{ scale: scaleAnim }], opacity: scaleAnim }]}>
      <Text style={closeStyles.emoji}>✦</Text>
      <Text style={closeStyles.title}>Week sealed.</Text>
      <Text style={closeStyles.date}>{weekStr}</Text>

      {intentions.length > 0 && (
        <View style={closeStyles.card}>
          <Text style={closeStyles.cardLabel}>Going into next week</Text>
          {intentions.map((intent, i) => (
            <Text key={i} style={closeStyles.intent}>— {intent}</Text>
          ))}
        </View>
      )}

      <Text style={closeStyles.note}>
        This review is saved. You can revisit it from your history.
      </Text>
    </Animated.View>
  );
}

const closeStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xxl },
  emoji: { fontSize: 40, color: Colors.amber },
  title: { ...Typography.displayLG, color: Colors.textPrimary },
  date: { ...Typography.bodyMD, color: Colors.textMuted, fontFamily: 'DMSans_300Light' },
  card: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.xl,
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cardLabel: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.xs },
  intent: { ...Typography.bodyMD, color: Colors.textSecondary, fontFamily: 'DMSans_300Light', fontStyle: 'italic' },
  note: { ...Typography.bodySM, color: Colors.textMuted, textAlign: 'center', fontFamily: 'DMSans_300Light', marginTop: Spacing.lg },
});

const phaseContentStyles = StyleSheet.create({
  wrap: { flex: 1 },
  phaseLabel: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.sm },
  title: { ...Typography.displayXL, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodyMD, color: Colors.textSecondary, fontFamily: 'DMSans_300Light', marginBottom: Spacing.xxl },
});

// ─────────────────────────────────────────────
// REVIEW SCREEN
// ─────────────────────────────────────────────

type Phase = 0 | 1 | 2 | 3; // look back | reflect | intentions | close

export default function ReviewScreen() {
  const [phase, setPhase] = useState<Phase>(0);
  const [intentions, setIntentions] = useState<string[]>([]);
  const [started, setStarted] = useState(false);

  // Landing state — review not yet started
  if (!started) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.landing}>
          <Text style={styles.eyebrow}>Weekly Review</Text>
          <Text style={styles.landingTitle}>Time to close{'\n'}the week.</Text>
          <Text style={styles.landingSubtitle}>
            Takes about 5 minutes. You can skip any part.
          </Text>

          <View style={styles.phaseList}>
            {['Look back', 'Reflect', 'Intentions', 'Seal it'].map((p, i) => (
              <View key={i} style={styles.phaseListItem}>
                <View style={styles.phaseListNum}>
                  <Text style={styles.phaseListNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.phaseListLabel}>{p}</Text>
              </View>
            ))}
          </View>

          <View style={styles.landingBtns}>
            <Button label="Start review" variant="primary" onPress={() => setStarted(true)} style={{ flex: 1 }} />
            <Pressable style={styles.skipAll}>
              <Text style={styles.skipAllText}>Skip this week</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <PhaseIndicator current={phase} total={4} />

        {phase === 0 && <LookBackPhase onNext={() => setPhase(1)} />}
        {phase === 1 && <ReflectPhase onNext={() => setPhase(2)} />}
        {phase === 2 && (
          <IntentionsPhase
            onNext={(i) => { setIntentions(i); setPhase(3); }}
          />
        )}
        {phase === 3 && <ClosePhase intentions={intentions} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  // Landing
  landing: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  eyebrow: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.sm },
  landingTitle: { ...Typography.displayXL, color: Colors.textPrimary, marginBottom: Spacing.sm },
  landingSubtitle: { ...Typography.bodyMD, color: Colors.textSecondary, fontFamily: 'DMSans_300Light', marginBottom: Spacing.xxxl },
  phaseList: { gap: Spacing.md, marginBottom: Spacing.xxxl },
  phaseListItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  phaseListNum: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseListNumText: { ...Typography.labelMD, color: Colors.textMuted },
  phaseListLabel: { ...Typography.bodyMD, color: Colors.textSecondary },
  landingBtns: { gap: Spacing.md },
  skipAll: { alignItems: 'center', paddingVertical: Spacing.md },
  skipAllText: { ...Typography.labelMD, color: Colors.textMuted },
});
