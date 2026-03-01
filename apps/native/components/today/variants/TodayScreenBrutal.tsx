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
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { EmptyState } from "@/components/ui";

// ─── DESIGN SYSTEM OVERRIDE ──────────────────────────────────────────────────
// This screen uses its own local palette — deliberately antithetical to the
// warm-dark editorial system. Light, sharp, architectural, printed.

const T = {
  ink: "#0c0b09", // near-black, warm
  inkFaint: "#4a4640", // secondary text
  inkGhost: "#9a9080", // muted / disabled
  paper: "#f5f2ec", // warm off-white ground
  paperRaised: "#edeae3", // slightly darker paper
  rule: "#d0cac0", // divider lines
  ruleStrong: "#0c0b09", // thick structural rule
  amber: "#c47f20", // amber, muted for light bg
  sage: "#4a7a50", // sage on light
  rose: "#b05a50", // rose on light
} as const;

// ─── TYPOGRAPHY (print-editorial) ─────────────────────────────────────────────
const PT = {
  // Display — treated like newspaper headline
  headline: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -1.2,
    color: T.ink,
  },
  headlineSM: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.5,
    color: T.ink,
  },
  // Section label — small caps rule
  rubric: {
    fontFamily: "DMSans_500Medium",
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.18,
    textTransform: "uppercase" as const,
    color: T.inkFaint,
  },
  // Body
  body: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: T.ink,
  },
  bodyLight: {
    fontFamily: "DMSans_300Light",
    fontSize: 14,
    lineHeight: 21,
    color: T.inkFaint,
  },
  // Large numerals — the instrument readout
  readout: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 54,
    lineHeight: 56,
    letterSpacing: -2,
    color: T.ink,
  },
  readoutSM: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    color: T.ink,
  },
  // Ordinal / index number
  index: {
    fontFamily: "DMSans_300Light",
    fontSize: 11,
    lineHeight: 14,
    color: T.inkGhost,
    letterSpacing: 0.08,
  },
  label: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.06,
    color: T.inkFaint,
  },
} as const;

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Habit = { id: string; name: string; done: boolean };
type FocusTask = { id: string; text: string };

const MOCK_HABITS: Habit[] = [
  { id: "1", name: "Morning walk", done: false },
  { id: "2", name: "Journaling", done: true },
  { id: "3", name: "Read 20 pages", done: false },
];

const MOCK_FOCUS: FocusTask[] = [
  { id: "1", text: "Reply to Dr. Osei email" },
  { id: "2", text: "Book therapy appointment" },
];

const MOCK_LAST_CHECKIN = { mood: 3, energy: 4, time: "Today, 8:30am" };

// Mood as word, not emoji — fits the editorial register
const MOOD_WORD: Record<number, string> = {
  1: "rough",
  2: "low",
  3: "okay",
  4: "good",
  5: "great",
};

const MOOD_BAR_COLOR: Record<number, string> = {
  1: T.rose,
  2: T.rose,
  3: T.amber,
  4: T.sage,
  5: T.sage,
};

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

/** Thick rule line — structural divider */
function Rule({ thick = false, style }: { thick?: boolean; style?: object }) {
  return (
    <View
      style={[{ height: thick ? 2 : 1, backgroundColor: thick ? T.ruleStrong : T.rule }, style]}
    />
  );
}

/** Section header with left-aligned rubric and optional right meta */
function SectionHead({ label, meta }: { label: string; meta?: string }) {
  return (
    <View style={s.sectionHead}>
      <Text style={PT.rubric}>{label}</Text>
      {meta && <Text style={PT.rubric}>{meta}</Text>}
    </View>
  );
}

/** Habit row — numbered, strikeable */
function HabitRow({
  habit,
  index,
  onToggle,
  isLast,
}: {
  habit: Habit;
  index: number;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <>
      <Pressable onPress={onToggle} style={s.habitRow}>
        <Text style={PT.index}>{String(index + 1).padStart(2, "0")}</Text>
        <Text style={[s.habitName, habit.done && s.habitNameDone]}>{habit.name}</Text>
        {/* Completion mark */}
        <View style={[s.habitMark, habit.done && s.habitMarkDone]}>
          {habit.done && <View style={s.habitMarkFill} />}
        </View>
      </Pressable>
      {!isLast && <Rule />}
    </>
  );
}

/** Habit progress bar — thin, full-width, underneath the list */
function HabitProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total;
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${pct * 100}%` as any }]} />
    </View>
  );
}

/** Focus task row */
function FocusRow({
  task,
  index,
  onComplete,
  isLast,
}: {
  task: FocusTask;
  index: number;
  onComplete: () => void;
  isLast: boolean;
}) {
  return (
    <>
      <Pressable onPress={onComplete} style={s.focusRow}>
        <Text style={PT.index}>{String(index + 1).padStart(2, "0")}</Text>
        <Text style={s.focusText}>{task.text}</Text>
        <View style={s.focusDot} />
      </Pressable>
      {!isLast && <Rule />}
    </>
  );
}

/**
 * Check-in panel — the key differentiator.
 * Instrument layout: two large readout numbers side by side,
 * labelled below, with a thin bar encoding mood sentiment.
 * No emoji. No card border. Just data.
 */
function CheckinPanel({ onPress }: { onPress: () => void }) {
  const { mood, energy, time } = MOCK_LAST_CHECKIN;
  const moodWord = MOOD_WORD[mood] ?? "—";
  const barColor = MOOD_BAR_COLOR[mood] ?? T.amber;

  return (
    <Pressable onPress={onPress} style={s.checkinPanel}>
      {/* Sentiment bar — thin stripe across top */}
      <View style={[s.checkinBar, { backgroundColor: barColor }]} />

      <View style={s.checkinBody}>
        {/* Left: Mood readout */}
        <View style={s.checkinCell}>
          <Text style={PT.readout}>{mood}</Text>
          <View style={s.checkinCellMeta}>
            <Text style={PT.rubric}>mood</Text>
            <Text style={[PT.rubric, { color: barColor, marginLeft: 6 }]}>{moodWord}</Text>
          </View>
        </View>

        {/* Vertical rule */}
        <View style={s.checkinVRule} />

        {/* Right: Energy readout */}
        <View style={s.checkinCell}>
          <Text style={PT.readout}>{energy}</Text>
          <View style={s.checkinCellMeta}>
            <Text style={PT.rubric}>energy</Text>
          </View>
        </View>

        {/* Scale indicator */}
        <View style={s.checkinScale}>
          <Text style={PT.index}>/5</Text>
        </View>
      </View>

      <Rule style={{ marginHorizontal: 0 }} />

      {/* Timestamp footer */}
      <View style={s.checkinFooter}>
        <Text style={PT.index}>{time}</Text>
        <Text style={[PT.rubric, { color: T.amber }]}>Check in again →</Text>
      </View>
    </Pressable>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export function TodayScreenBrutalist() {
  const [input, setInput] = useState("");
  const [habits, setHabits] = useState(MOCK_HABITS);
  const [focus, setFocus] = useState(MOCK_FOCUS);

  const doneCount = useMemo(() => habits.filter((h) => h.done).length, [habits]);
  const nextFocus = focus[0];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ── MASTHEAD ─────────────────────────────────────────────── */}
        <Rule thick />
        <View style={s.masthead}>
          <View style={s.mastheadLeft}>
            <Text style={PT.rubric}>Life OS · Daily</Text>
            <Text style={[PT.headline, { marginTop: 6 }]}>Today</Text>
          </View>
          <View style={s.mastheadRight}>
            <Text style={[PT.rubric, { textAlign: "right" }]}>{today}</Text>
            <Text style={[PT.index, { textAlign: "right", marginTop: 4 }]}>
              {doneCount}/{habits.length} habits
            </Text>
          </View>
        </View>
        <Rule thick />

        {/* ── CAPTURE ──────────────────────────────────────────────── */}
        <View style={s.captureBlock}>
          <TextInput
            value={input}
            onChangeText={setInput}
            maxLength={280}
            placeholder="How are you right now?"
            placeholderTextColor={T.inkGhost}
            style={s.captureInput}
            multiline
          />
          <Rule />
        </View>

        {/* ── CHECK-IN ─────────────────────────────────────────────── */}
        <View style={s.block}>
          <SectionHead label="Last check-in" />
          <CheckinPanel onPress={() => router.push("/(tabs)/checkin")} />
        </View>

        {/* ── NEXT ACTION ──────────────────────────────────────────── */}
        <View style={s.block}>
          <SectionHead label="Next action" />
          <View style={s.focusFeature}>
            {/* Column accent */}
            <View style={s.focusAccentBar} />
            <View style={s.focusFeatureContent}>
              <Text style={PT.rubric}>Focus now</Text>
              <Text style={[PT.headlineSM, { marginTop: 6 }]}>
                {nextFocus ? nextFocus.text : "No focus task set"}
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/tasks/index" as never)} style={s.focusFeatureLink}>
                <Text style={[PT.rubric, { color: T.amber }]}>Open task queue →</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── HABITS ───────────────────────────────────────────────── */}
        <View style={s.block}>
          <SectionHead label="Habits" meta={`${doneCount} of ${habits.length}`} />
          <Rule />
          {habits.map((habit, i) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              index={i}
              isLast={i === habits.length - 1}
              onToggle={() =>
                setHabits((prev) =>
                  prev.map((h) => (h.id === habit.id ? { ...h, done: !h.done } : h)),
                )
              }
            />
          ))}
          <Rule />
          <HabitProgressBar done={doneCount} total={habits.length} />
        </View>

        {/* ── FOCUS QUEUE ──────────────────────────────────────────── */}
        <View style={s.block}>
          <SectionHead label="Focus queue" meta={`${focus.length}/3`} />
          <Rule />
          {focus.length === 0 ? (
            <View style={s.emptyRow}>
              <Text style={PT.bodyLight}>Queue is clear.</Text>
            </View>
          ) : (
            focus.map((task, i) => (
              <FocusRow
                key={task.id}
                task={task}
                index={i}
                isLast={i === focus.length - 1}
                onComplete={() => setFocus((prev) => prev.filter((t) => t.id !== task.id))}
              />
            ))
          )}
          <Rule />
        </View>

        {/* ── FOOTER RULE ──────────────────────────────────────────── */}
        <Rule thick style={{ marginTop: Spacing.xxl }} />
        <View style={s.footer}>
          <Text style={PT.index}>One steady step is enough.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.paper },

  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },

  // Masthead
  masthead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 18,
    gap: 12,
  },
  mastheadLeft: { flex: 1 },
  mastheadRight: { alignItems: "flex-end" },

  // Capture
  captureBlock: { marginTop: 28, marginBottom: 4 },
  captureInput: {
    ...PT.body,
    paddingVertical: 16,
    paddingHorizontal: 0,
    minHeight: 52,
  },

  // Generic block
  block: { marginTop: 28 },

  // Section head
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  // Check-in panel
  checkinPanel: {
    backgroundColor: T.paperRaised,
    overflow: "hidden",
  },
  checkinBar: {
    height: 3,
    width: "100%",
  },
  checkinBody: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  checkinCell: { flex: 1, gap: 6 },
  checkinCellMeta: { flexDirection: "row", alignItems: "center" },
  checkinVRule: {
    width: 1,
    height: 56,
    backgroundColor: T.rule,
    marginHorizontal: 20,
    alignSelf: "center",
  },
  checkinScale: {
    position: "absolute",
    right: 16,
    top: 20,
  },
  checkinFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  // Focus feature
  focusFeature: {
    flexDirection: "row",
    gap: 0,
  },
  focusAccentBar: {
    width: 2,
    backgroundColor: T.amber,
    marginRight: 16,
  },
  focusFeatureContent: { flex: 1, paddingVertical: 4 },
  focusFeatureLink: { marginTop: 14 },

  // Habit row
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  habitName: {
    ...PT.body,
    flex: 1,
  },
  habitNameDone: {
    color: T.inkGhost,
    textDecorationLine: "line-through",
  },
  habitMark: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: T.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  habitMarkDone: {
    borderColor: T.sage,
  },
  habitMarkFill: {
    width: 10,
    height: 10,
    backgroundColor: T.sage,
  },

  // Progress bar
  progressTrack: {
    height: 2,
    backgroundColor: T.rule,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: T.sage,
  },

  // Focus row
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  focusText: {
    ...PT.body,
    flex: 1,
  },
  focusDot: {
    width: 5,
    height: 5,
    backgroundColor: T.amber,
  },

  // Empty
  emptyRow: {
    paddingVertical: 20,
  },

  // Footer
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
