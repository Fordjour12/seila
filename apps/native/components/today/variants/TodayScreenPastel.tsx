import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

// ─── PASTEL DESIGN SYSTEM ─────────────────────────────────────────────────────
// Deliberately independent of the app's dark theme tokens.
// Every value chosen for softness, safety, calm.

const P = {
  // Grounds
  ground: "#f4f0fb", // lavender-white base
  groundWarm: "#faf6ff", // lightest surface
  surface: "#ffffff", // card surface
  surfaceBlush: "#fdf4f8", // pink-tinted surface

  // Lavender family
  lavender: "#c4b5f4", // primary accent
  lavenderDeep: "#9b8de8", // pressed / active
  lavenderSoft: "#ede8fc", // tinted backgrounds
  lavenderGlow: "rgba(196,181,244,0.18)",

  // Sage family
  sage: "#8fbfaa", // completion, positive
  sageSoft: "#dff0e8", // sage tinted bg
  sageDeep: "#5a9980", // sage text

  // Blush / rose
  blush: "#f0b8c8", // gentle warmth
  blushSoft: "#fde8ef", // blush tinted bg
  blushDeep: "#c4607a", // blush text

  // Peach
  peach: "#f5c4a0", // energy accent
  peachSoft: "#fef0e4", // peach bg
  peachDeep: "#c47840", // peach text

  // Text
  ink: "#2d2640", // deep lavender-black
  inkMid: "#6b6080", // secondary
  inkSoft: "#a098b8", // muted
  inkGhost: "#c8c0d8", // placeholder
} as const;

const PT = {
  display: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: P.ink,
  },
  displaySM: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: P.ink,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.06,
    color: P.inkMid,
  },
  labelLG: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: P.ink,
  },
  body: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: P.ink,
  },
  bodyLight: {
    fontFamily: "DMSans_300Light",
    fontSize: 14,
    lineHeight: 21,
    color: P.inkMid,
  },
  caption: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    lineHeight: 15,
    color: P.inkSoft,
  },
  eyebrow: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.12,
    textTransform: "uppercase" as const,
    color: P.inkSoft,
  },
  // Large mood/energy numbers
  readout: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.5,
    color: P.ink,
  },
} as const;

// ─── TYPES + MOCK ─────────────────────────────────────────────────────────────

type Habit = { id: string; name: string; done: boolean; emoji: string };
type FocusTask = { id: string; text: string };

const MOCK_HABITS: Habit[] = [
  { id: "1", name: "Morning walk", done: false, emoji: "🌿" },
  { id: "2", name: "Journaling", done: true, emoji: "✏️" },
  { id: "3", name: "Read 20 pages", done: false, emoji: "📖" },
];

const MOCK_FOCUS: FocusTask[] = [
  { id: "1", text: "Reply to Dr. Osei email" },
  { id: "2", text: "Book therapy appointment" },
];

const MOCK_LAST_CHECKIN = { mood: 3, energy: 4, time: "Today, 8:30am" };

const MOOD_META: Record<number, { word: string; color: string; bg: string; bar: string }> = {
  1: { word: "rough", color: P.blushDeep, bg: P.blushSoft, bar: P.blush },
  2: { word: "low", color: P.blushDeep, bg: P.blushSoft, bar: P.blush },
  3: { word: "okay", color: P.peachDeep, bg: P.peachSoft, bar: P.peach },
  4: { word: "good", color: P.sageDeep, bg: P.sageSoft, bar: P.sage },
  5: { word: "great", color: P.sageDeep, bg: P.sageSoft, bar: P.sage },
};

// ─── PILL TAG ─────────────────────────────────────────────────────────────────

function PillTag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[pill.wrap, { backgroundColor: bg }]}>
      <Text style={[pill.text, { color }]}>{label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  text: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.08,
    textTransform: "uppercase",
  },
});

// ─── GREETING CARD ────────────────────────────────────────────────────────────

function GreetingCard({ doneCount, total }: { doneCount: number; total: number }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const pct = total === 0 ? 0 : doneCount / total;

  return (
    <View style={gc.card}>
      {/* Soft gradient blob — simulated with layered views */}
      <View style={gc.blobA} />
      <View style={gc.blobB} />

      <PillTag label="Today" color={P.lavenderDeep} bg={P.lavenderSoft} />
      <Text style={[PT.display, { marginTop: 10 }]}>{greeting} ✦</Text>
      <Text style={[PT.bodyLight, { marginTop: 6 }]}>
        Keep scope small. One steady step is enough.
      </Text>

      {/* Progress ring-bar */}
      <View style={gc.progressRow}>
        <View style={gc.progressTrack}>
          <View style={[gc.progressFill, { width: `${pct * 100}%` as any }]} />
        </View>
        <Text style={[PT.caption, { marginLeft: 10, color: P.lavenderDeep }]}>
          {doneCount}/{total} habits
        </Text>
      </View>
    </View>
  );
}

const gc = StyleSheet.create({
  card: {
    backgroundColor: P.lavenderSoft,
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  blobA: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(196,181,244,0.28)",
    top: -40,
    right: -30,
  },
  blobB: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(143,191,170,0.2)",
    bottom: -20,
    right: 60,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(196,181,244,0.3)",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: P.lavenderDeep,
    borderRadius: 99,
  },
});

// ─── CAPTURE INPUT ────────────────────────────────────────────────────────────

function CaptureInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={ci.wrap}>
      <View style={ci.iconDot}>
        <Text style={{ fontSize: 14 }}>💬</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        maxLength={280}
        placeholder="How are you right now?"
        placeholderTextColor={P.inkGhost}
        style={ci.input}
        multiline
      />
    </View>
  );
}

const ci = StyleSheet.create({
  wrap: {
    backgroundColor: P.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
    shadowColor: P.lavender,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  iconDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.lavenderSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  input: {
    ...PT.body,
    flex: 1,
    minHeight: 40,
  },
});

// ─── CHECK-IN CARD ────────────────────────────────────────────────────────────
// The key redesign. Two large soft-colored readout blobs side by side,
// each in a pill-shaped container. Mood carries a tinted bg based on value.
// Energy is always peach. A soft word label underneath each number.
// No emoji — the color does the emotional work.

function CheckinCard({ onPress }: { onPress: () => void }) {
  const { mood, energy, time } = MOCK_LAST_CHECKIN;
  const moodMeta = MOOD_META[mood] ?? MOOD_META[3];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [chk.card, pressed && chk.cardPressed]}>
      {/* Header */}
      <View style={chk.header}>
        <PillTag label="Last check-in" color={P.inkMid} bg={P.lavenderGlow} />
        <Text style={[PT.caption, { color: P.inkSoft }]}>{time}</Text>
      </View>

      {/* Readout row */}
      <View style={chk.readouts}>
        {/* Mood blob */}
        <View style={[chk.readoutBlob, { backgroundColor: moodMeta.bg }]}>
          <Text style={[PT.readout, { color: moodMeta.color }]}>{mood}</Text>
          <Text style={[PT.eyebrow, { color: moodMeta.color, marginTop: 4 }]}>
            mood · {moodMeta.word}
          </Text>
          {/* Tiny 5-dot scale */}
          <View style={chk.scale}>
            {[1, 2, 3, 4, 5].map((n) => (
              <View
                key={n}
                style={[
                  chk.scaleDot,
                  n <= mood
                    ? { backgroundColor: moodMeta.color }
                    : { backgroundColor: moodMeta.bar + "40" },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Energy blob */}
        <View style={[chk.readoutBlob, { backgroundColor: P.peachSoft }]}>
          <Text style={[PT.readout, { color: P.peachDeep }]}>{energy}</Text>
          <Text style={[PT.eyebrow, { color: P.peachDeep, marginTop: 4 }]}>energy</Text>
          <View style={chk.scale}>
            {[1, 2, 3, 4, 5].map((n) => (
              <View
                key={n}
                style={[
                  chk.scaleDot,
                  n <= energy
                    ? { backgroundColor: P.peachDeep }
                    : { backgroundColor: P.peach + "40" },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Footer CTA */}
      <View style={chk.footer}>
        <Text style={[PT.label, { color: P.lavenderDeep }]}>Check in again →</Text>
      </View>
    </Pressable>
  );
}

const chk = StyleSheet.create({
  card: {
    backgroundColor: P.surface,
    borderRadius: 24,
    padding: 18,
    shadowColor: P.lavender,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
  },
  cardPressed: { opacity: 0.92 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readouts: {
    flexDirection: "row",
    gap: 12,
  },
  readoutBlob: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: "flex-start",
    gap: 2,
  },
  scale: {
    flexDirection: "row",
    gap: 4,
    marginTop: 10,
  },
  scaleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: P.lavenderGlow,
    paddingTop: 12,
    alignItems: "center",
  },
});

// ─── NEXT ACTION CARD ─────────────────────────────────────────────────────────

function NextActionCard({ task, onPress }: { task: FocusTask | undefined; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [na.card, pressed && { opacity: 0.92 }]}>
      <View style={na.blobAccent} />
      <PillTag label="Focus now" color={P.sageDeep} bg={P.sageSoft} />
      <Text style={[PT.displaySM, { marginTop: 10, marginBottom: 14 }]}>
        {task ? task.text : "No focus task set"}
      </Text>
      <View style={na.linkRow}>
        <Text style={[PT.label, { color: P.lavenderDeep }]}>Open Tasks →</Text>
      </View>
    </Pressable>
  );
}

const na = StyleSheet.create({
  card: {
    backgroundColor: P.sageSoft,
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  blobAccent: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(143,191,170,0.25)",
    top: -30,
    right: -20,
  },
  linkRow: {
    backgroundColor: P.surface,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
});

// ─── HABIT ROW ────────────────────────────────────────────────────────────────

function HabitPill({ habit, onToggle }: { habit: Habit; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[hp.pill, habit.done && hp.pillDone]}>
      {/* Emoji bubble */}
      <View style={[hp.emojiBubble, habit.done && hp.emojiBubbleDone]}>
        <Text style={{ fontSize: 15 }}>{habit.emoji}</Text>
      </View>

      <Text style={[hp.name, habit.done && hp.nameDone]} numberOfLines={1}>
        {habit.name}
      </Text>

      {/* Checkmark circle */}
      <View style={[hp.check, habit.done && hp.checkDone]}>
        {habit.done && <Text style={hp.checkMark}>✓</Text>}
      </View>
    </Pressable>
  );
}

const hp = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: P.surface,
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: P.lavender,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  pillDone: {
    backgroundColor: P.sageSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  emojiBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.lavenderSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emojiBubbleDone: {
    backgroundColor: "rgba(143,191,170,0.3)",
  },
  name: {
    ...PT.labelLG,
    flex: 1,
  },
  nameDone: {
    color: P.sageDeep,
    textDecorationLine: "line-through",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.lavender,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkDone: {
    backgroundColor: P.sage,
    borderColor: P.sage,
  },
  checkMark: {
    fontSize: 11,
    color: "#fff",
    fontFamily: "DMSans_500Medium",
  },
});

// ─── FOCUS TASK PILL ──────────────────────────────────────────────────────────

function FocusTaskPill({ task, onComplete }: { task: FocusTask; onComplete: () => void }) {
  return (
    <Pressable onPress={onComplete} style={({ pressed }) => [ft.pill, pressed && { opacity: 0.8 }]}>
      <View style={ft.dot} />
      <Text style={[PT.body, { flex: 1 }]}>{task.text}</Text>
      <View style={ft.completePill}>
        <Text style={ft.completeText}>done</Text>
      </View>
    </Pressable>
  );
}

const ft = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: P.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: P.lavender,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.lavender,
    flexShrink: 0,
  },
  completePill: {
    backgroundColor: P.lavenderSoft,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  completeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    letterSpacing: 0.06,
    textTransform: "uppercase",
    color: P.lavenderDeep,
  },
});

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

function SoftSectionHeader({ label, meta }: { label: string; meta?: string }) {
  return (
    <View style={ssh.row}>
      <Text style={PT.eyebrow}>{label}</Text>
      {meta && <Text style={PT.caption}>{meta}</Text>}
    </View>
  );
}

const ssh = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export function TodayScreenPastel() {
  const [input, setInput] = useState("");
  const [habits, setHabits] = useState(MOCK_HABITS);
  const [focus, setFocus] = useState(MOCK_FOCUS);

  const doneCount = useMemo(() => habits.filter((h) => h.done).length, [habits]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ── GREETING ─────────────────────────────────────────── */}
        <GreetingCard doneCount={doneCount} total={habits.length} />

        {/* ── CAPTURE ──────────────────────────────────────────── */}
        <CaptureInput value={input} onChangeText={setInput} />

        {/* ── CHECK-IN ─────────────────────────────────────────── */}
        <View style={s.section}>
          <SoftSectionHeader label="Last check-in" />
          <CheckinCard onPress={() => router.push("/(tabs)/checkin")} />
        </View>

        {/* ── NEXT ACTION ──────────────────────────────────────── */}
        <View style={s.section}>
          <SoftSectionHeader label="Next action" />
          <NextActionCard task={focus[0]} onPress={() => router.push("/(tabs)/tasks")} />
        </View>

        {/* ── HABITS ───────────────────────────────────────────── */}
        <View style={s.section}>
          <SoftSectionHeader label="Habits" meta={`${doneCount} of ${habits.length}`} />
          <View style={s.pillStack}>
            {habits.map((habit) => (
              <HabitPill
                key={habit.id}
                habit={habit}
                onToggle={() =>
                  setHabits((prev) =>
                    prev.map((h) => (h.id === habit.id ? { ...h, done: !h.done } : h)),
                  )
                }
              />
            ))}
          </View>
        </View>

        {/* ── FOCUS QUEUE ──────────────────────────────────────── */}
        <View style={s.section}>
          <SoftSectionHeader label="Focus queue" meta={`${focus.length}/3`} />
          {focus.length === 0 ? (
            <View style={s.emptyPill}>
              <Text style={[PT.bodyLight, { textAlign: "center" }]}>All clear ✦</Text>
            </View>
          ) : (
            <View style={s.pillStack}>
              {focus.map((task) => (
                <FocusTaskPill
                  key={task.id}
                  task={task}
                  onComplete={() => setFocus((prev) => prev.filter((t) => t.id !== task.id))}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ROOT STYLES ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.ground },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
  },
  section: { marginBottom: 24 },
  pillStack: { gap: 10 },
  emptyPill: {
    backgroundColor: P.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: P.lavender,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
