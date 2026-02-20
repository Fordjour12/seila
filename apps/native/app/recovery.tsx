/**
 * Life OS — Recovery Context
 * Route: app/recovery/index.tsx
 *
 * Private long-form writing space. Not a chatbot. Not AI-processed.
 * This is for the human, by the human.
 *
 * Sections:
 *   - Recovery notes (freeform, date-stamped)
 *   - Saved reflections from weekly reviews
 *   - Context documents (e.g. "things my therapist said")
 *
 * Rules:
 *   - Nothing here is read by the AI unless explicitly shared
 *   - No suggestions, no patterns generated from this content
 *   - Export only as plain text
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "../constants/theme";
import { SectionLabel, Button, EmptyState } from "../components/ui";

// ─────────────────────────────────────────────
// TYPES + MOCK
// ─────────────────────────────────────────────

interface RecoveryNote {
  id: string;
  title?: string;
  content: string;
  createdAt: number;
  pinned: boolean;
  tag?: "reflection" | "therapy" | "gratitude" | "general";
}

const MOCK_NOTES: RecoveryNote[] = [
  {
    id: "1",
    title: "Things I noticed this week",
    content:
      "Energy dropped hard on Thursday. Not sure why yet. Might be related to the difficult call Wednesday. Worth watching.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    pinned: true,
    tag: "reflection",
  },
  {
    id: "2",
    title: "What my therapist said",
    content:
      "That patterns I can see don't need to be fixed right away — just seeing them is enough for now. The pressure to act immediately is itself a pattern.",
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    pinned: true,
    tag: "therapy",
  },
  {
    id: "3",
    content: "Had a good walk today. Something about moving helps the thoughts settle.",
    createdAt: Date.now() - 1000 * 60 * 60 * 120,
    pinned: false,
    tag: "general",
  },
];

const TAGS: Array<{ id: NonNullable<RecoveryNote["tag"]>; label: string; emoji: string }> = [
  { id: "reflection", label: "Reflection", emoji: "○" },
  { id: "therapy", label: "Therapy", emoji: "◇" },
  { id: "gratitude", label: "Gratitude", emoji: "◈" },
  { id: "general", label: "General", emoji: "□" },
];

const TAG_COLOR: Record<NonNullable<RecoveryNote["tag"]>, string> = {
  reflection: Colors.amber,
  therapy: Colors.sage,
  gratitude: Colors.amber,
  general: Colors.textMuted,
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return `Today, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─────────────────────────────────────────────
// NOTE CARD
// ─────────────────────────────────────────────

function NoteCard({
  note,
  onPress,
  onPin,
}: {
  note: RecoveryNote;
  onPress: () => void;
  onPin: () => void;
}) {
  const tagConfig = note.tag ? TAGS.find((t) => t.id === note.tag) : undefined;
  const tagColor = note.tag ? TAG_COLOR[note.tag] : Colors.textMuted;
  const preview = note.content.length > 120 ? note.content.slice(0, 120) + "…" : note.content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        noteStyles.card,
        note.pinned && noteStyles.cardPinned,
        pressed && noteStyles.cardPressed,
      ]}
    >
      {/* Pin stripe */}
      {note.pinned && <View style={noteStyles.pinStripe} />}

      <View style={noteStyles.content}>
        {note.title && <Text style={noteStyles.title}>{note.title}</Text>}
        <Text style={noteStyles.preview}>{preview}</Text>
        <View style={noteStyles.footer}>
          {tagConfig && (
            <View style={[noteStyles.tag, { borderColor: tagColor + "40" }]}>
              <Text style={[noteStyles.tagText, { color: tagColor }]}>{tagConfig.label}</Text>
            </View>
          )}
          <Text style={noteStyles.date}>{formatDate(note.createdAt)}</Text>
          <Pressable onPress={onPin} style={noteStyles.pinBtn}>
            <Text style={[noteStyles.pinIcon, note.pinned && noteStyles.pinIconActive]}>
              {note.pinned ? "◆" : "◇"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const noteStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.md,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardPinned: {
    borderColor: Colors.amberBorder,
  },
  cardPressed: { opacity: 0.85 },
  pinStripe: {
    width: 3,
    backgroundColor: Colors.amber,
    flexShrink: 0,
  },
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.sm },
  title: { ...Typography.labelLG, color: Colors.textPrimary },
  preview: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontFamily: "DMSans_300Light",
    fontStyle: "italic",
  },
  footer: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.xs },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: { ...Typography.eyebrow, fontSize: 9 },
  date: { ...Typography.bodyXS, color: Colors.textMuted, flex: 1 },
  pinBtn: { padding: Spacing.xs },
  pinIcon: { fontSize: 12, color: Colors.textMuted },
  pinIconActive: { color: Colors.amber },
});

// ─────────────────────────────────────────────
// NEW NOTE SHEET
// ─────────────────────────────────────────────

function NewNoteSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (note: Omit<RecoveryNote, "id" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<RecoveryNote["tag"]>("general");
  const slideAnim = useRef(new Animated.Value(700)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 28,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  }, []);

  const close = (cb?: () => void) => {
    Animated.timing(slideAnim, { toValue: 700, duration: 220, useNativeDriver: true }).start(() => {
      onClose();
      cb?.();
    });
  };

  const save = () => {
    if (!content.trim()) return;
    close(() =>
      onSave({
        title: title.trim() || undefined,
        content: content.trim(),
        tag,
        pinned: false,
      }),
    );
  };

  return (
    <KeyboardAvoidingView
      style={sheetStyles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable style={sheetStyles.backdrop} onPress={() => close()} />
      <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={sheetStyles.handle} />

        <Text style={sheetStyles.sheetTitle}>New note</Text>

        <TextInput
          style={sheetStyles.titleInput}
          placeholder="Title (optional)"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
          returnKeyType="next"
        />

        <TextInput
          style={sheetStyles.contentInput}
          placeholder="What's on your mind…"
          placeholderTextColor={Colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        {/* Tag selection */}
        <View style={sheetStyles.tagRow}>
          {TAGS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTag(t.id)}
              style={[
                sheetStyles.tagBtn,
                tag === t.id && {
                  borderColor: TAG_COLOR[t.id] + "60",
                  backgroundColor: TAG_COLOR[t.id] + "12",
                },
              ]}
            >
              <Text style={[sheetStyles.tagBtnText, tag === t.id && { color: TAG_COLOR[t.id] }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={sheetStyles.btnRow}>
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => close()}
            style={{ flex: 0, paddingHorizontal: Spacing.xl }}
          />
          <Button
            label="Save note"
            variant="primary"
            onPress={save}
            disabled={!content.trim()}
            style={{ flex: 1 }}
          />
        </View>

        {/* Privacy note */}
        <Text style={sheetStyles.privacyNote}>
          This note is private. The AI does not read recovery notes.
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)" },
  sheet: {
    backgroundColor: Colors.bgRaised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.xxl,
  },
  sheetTitle: { ...Typography.displaySM, color: Colors.textPrimary, marginBottom: Spacing.lg },
  titleInput: {
    ...Typography.labelLG,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  contentInput: {
    ...Typography.bodyMD,
    color: Colors.textPrimary,
    fontFamily: "DMSans_300Light",
    minHeight: 120,
    marginBottom: Spacing.lg,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.xl },
  tagBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  tagBtnText: { ...Typography.labelSM, color: Colors.textMuted },
  btnRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md },
  privacyNote: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "DMSans_300Light",
  },
});

// ─────────────────────────────────────────────
// RECOVERY CONTEXT SCREEN
// ─────────────────────────────────────────────

export default function RecoveryContextScreen() {
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [showNew, setShowNew] = useState(false);
  const [filterTag, setFilterTag] = useState<RecoveryNote["tag"] | "all">("all");

  const pinNote = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const addNote = (data: Omit<RecoveryNote, "id" | "createdAt">) => {
    setNotes((prev) => [
      {
        ...data,
        id: Date.now().toString(),
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned && (filterTag === "all" || n.tag === filterTag));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Recovery context</Text>
          <Text style={styles.subtitle}>Private. Not read by the AI.</Text>
        </View>
        <Pressable onPress={() => setShowNew(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy notice */}
        <View style={styles.privacyBanner}>
          <Text style={styles.privacyText}>
            Notes written here are yours alone. The AI does not access this space unless you
            explicitly choose to share a note with it in the future.
          </Text>
        </View>

        {/* Pinned */}
        {pinned.length > 0 && (
          <View style={styles.group}>
            <SectionLabel>Pinned</SectionLabel>
            {pinned.map((n) => (
              <NoteCard key={n.id} note={n} onPress={() => {}} onPin={() => pinNote(n.id)} />
            ))}
          </View>
        )}

        {/* Filter */}
        <View style={styles.filterRow}>
          {(["all", ...TAGS.map((t) => t.id)] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilterTag(f as RecoveryNote["tag"] | "all")}
              style={[styles.filterChip, filterTag === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterTag === f && styles.filterChipTextActive]}>
                {f === "all" ? "All" : TAGS.find((t) => t.id === f)?.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
        {unpinned.length === 0 ? (
          <EmptyState
            icon="○"
            title="Nothing here yet"
            subtitle="Write your first note when you're ready"
          />
        ) : (
          unpinned.map((n) => (
            <NoteCard key={n.id} note={n} onPress={() => {}} onPin={() => pinNote(n.id)} />
          ))
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {showNew && <NewNoteSheet onClose={() => setShowNew(false)} onSave={addNote} />}
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
  headerContent: { flex: 1 },
  title: { ...Typography.displaySM, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyXS, color: Colors.textMuted },
  addBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.amberGlow,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 20, color: Colors.amber, lineHeight: 24 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },

  privacyBanner: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderLeftWidth: 2,
    borderLeftColor: Colors.sage,
  },
  privacyText: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    fontFamily: "DMSans_300Light",
    fontStyle: "italic",
    lineHeight: 20,
  },

  group: { marginBottom: Spacing.xl },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgRaised,
  },
  filterChipActive: { backgroundColor: Colors.amberGlow, borderColor: Colors.amberBorder },
  filterChipText: { ...Typography.labelSM, color: Colors.textMuted },
  filterChipTextActive: { color: Colors.amber },
});
