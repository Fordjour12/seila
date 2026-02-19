import { api } from "@seila/backend/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { Button, Surface } from "heroui-native";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { Container } from "@/components/container";
import { CheckinWidget } from "@/components/checkin";
import { HardModeIndicator } from "@/components/hard-mode/HardModeIndicator";
import { PatternStrip } from "@/components/patterns";
import { ScratchpadCapture } from "@/components/scratchpad";
import { SuggestionStrip } from "@/components/suggestions";
import { QuickCapture, TodayFocus, TaskInbox, FocusNudge } from "@/components/tasks";
import { TodayOrchestrationCard } from "@/components/today";
import { WeeklyReview } from "@/components/weekly-review";
import { quietTodayRef } from "@/lib/recovery-refs";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";

type UiCadence = "daily" | "weekdays";
type UiAnchor = "morning" | "afternoon" | "evening" | "anytime";
type UiDifficulty = "low" | "medium" | "high";

function getIdempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export default function Home() {
  const healthCheck = useQuery(api.healthCheck.get);
  const eventCount = useQuery(api.events.count);
  const todayHabits = useQuery(api.queries.todayHabits.todayHabits);

  const appendTestEvent = useMutation(api.events.appendTestEvent);
  const createHabit = useMutation(api.commands.createHabit.createHabit);
  const logHabit = useMutation(api.commands.logHabit.logHabit);
  const skipHabit = useMutation(api.commands.skipHabit.skipHabit);
  const snoozeHabit = useMutation(api.commands.snoozeHabit.snoozeHabit);
  const archiveHabit = useMutation(api.commands.archiveHabit.archiveHabit);

  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");
  const quietToday = useQuery(quietTodayRef, {});

  const [isSheetOpen, setSheetOpen] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [cadence, setCadence] = useState<UiCadence>("daily");
  const [anchor, setAnchor] = useState<UiAnchor>("anytime");
  const [difficulty, setDifficulty] = useState<UiDifficulty>("medium");

  const habits = todayHabits ?? [];

  const emptyHabitLabel = useMemo(() => {
    if (todayHabits === undefined) {
      return "Loading habits...";
    }

    if (todayHabits.length === 0) {
      return "No habits yet. Add one to get started.";
    }

    return null;
  }, [todayHabits]);

  const onSubmitHabit = async () => {
    const name = habitName.trim();
    if (!name) {
      Alert.alert("Habit name required", "Enter a name before saving.");
      return;
    }

    await createHabit({
      idempotencyKey: getIdempotencyKey("habit.create"),
      name,
      cadence,
      anchor,
      difficulty,
    });

    setHabitName("");
    setCadence("daily");
    setAnchor("anytime");
    setDifficulty("medium");
    setSheetOpen(false);
  };

  return (
    <Container className="px-4 pb-6">
      <View className="py-6 mb-5">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">Life OS</Text>
        <Text className="text-muted text-sm mt-1">Recovery-first operating system</Text>
      </View>

      {user ? (
        <Surface variant="secondary" className="mb-4 p-4 rounded-xl">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-foreground font-medium">{user.name}</Text>
              <Text className="text-muted text-xs mt-0.5">{user.email}</Text>
            </View>
            <Button
              variant="danger"
              size="sm"
              onPress={() => {
                authClient.signOut();
              }}
            >
              Sign Out
            </Button>
          </View>
        </Surface>
      ) : null}

      {user && <CheckinWidget onPress={() => router.push("/checkin")} />}
      {user && <HardModeIndicator />}
      {user && <TodayOrchestrationCard />}
      {user && !quietToday?.isQuiet && <SuggestionStrip />}
      {user && <PatternStrip />}

      {user && (
        <View className="mt-4">
          <ScratchpadCapture />
        </View>
      )}

      {user && (
        <View className="mt-4">
          <QuickCapture />
        </View>
      )}

      {user && (
        <View className="mt-4 gap-4">
          {!quietToday?.isQuiet && <WeeklyReview />}
          <TodayFocus />
          {!quietToday?.isQuiet && <FocusNudge />}
          <TaskInbox />
        </View>
      )}

      <Surface variant="secondary" className="p-4 rounded-xl mb-4 mt-4">
        <Text className="text-foreground font-medium mb-2">API Status</Text>
        <Text className="text-muted text-xs">
          {healthCheck === undefined
            ? "Checking..."
            : healthCheck === "OK"
              ? "Connected to API"
              : "API Disconnected"}
        </Text>
      </Surface>

      <Surface variant="secondary" className="p-4 rounded-xl mb-4">
        <Text className="text-foreground font-medium mb-2">Event Log</Text>
        <Text className="text-muted text-xs mb-3">
          Total events: {eventCount === undefined ? "Loading..." : eventCount}
        </Text>
        <Button
          variant="primary"
          size="sm"
          onPress={() => {
            void appendTestEvent({
              idempotencyKey: getIdempotencyKey("event.test"),
            });
          }}
        >
          Write Test Event
        </Button>
      </Surface>

      <Surface variant="secondary" className="p-4 rounded-xl mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-medium">Today&apos;s Habits</Text>
          <Button variant="primary" size="sm" onPress={() => setSheetOpen(true)}>
            Add Habit
          </Button>
        </View>

        {emptyHabitLabel ? (
          <Text className="text-muted text-xs">{emptyHabitLabel}</Text>
        ) : (
          <View className="gap-3">
            {habits.map((habit) => (
              <Swipeable
                key={habit.habitId}
                renderRightActions={() => (
                  <View className="justify-center items-center pr-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => {
                        void skipHabit({
                          habitId: habit.habitId,
                          idempotencyKey: getIdempotencyKey("habit.skip"),
                        });
                      }}
                    >
                      Skip
                    </Button>
                  </View>
                )}
              >
                <Pressable
                  className="rounded-xl border border-default-300 px-3 py-3 bg-background"
                  onPress={() => {
                    void logHabit({
                      habitId: habit.habitId,
                      idempotencyKey: getIdempotencyKey("habit.log"),
                    });
                  }}
                  onLongPress={() => {
                    void snoozeHabit({
                      habitId: habit.habitId,
                      idempotencyKey: getIdempotencyKey("habit.snooze"),
                      snoozedUntil: Date.now() + 60 * 60 * 1000,
                    });
                  }}
                  delayLongPress={300}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-foreground font-medium">{habit.name}</Text>
                      <Text className="text-muted text-xs mt-1">
                        {habit.todayStatus
                          ? habit.todayStatus === "completed"
                            ? "Completed"
                            : habit.todayStatus === "skipped"
                              ? "Skipped intentionally"
                              : "Snoozed"
                          : "Pending"}
                      </Text>
                    </View>
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => {
                        Alert.alert(
                          "Archive habit?",
                          "Archive this habit from the active list? This keeps its history.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Archive",
                              style: "destructive",
                              onPress: () => {
                                void archiveHabit({
                                  habitId: habit.habitId,
                                  idempotencyKey: getIdempotencyKey("habit.archive"),
                                });
                              },
                            },
                          ],
                        );
                      }}
                    >
                      Archive
                    </Button>
                  </View>
                </Pressable>
              </Swipeable>
            ))}
          </View>
        )}

        <Text className="text-muted text-xs mt-3">
          Tap to complete. Swipe right to skip. Long-press to snooze one hour.
        </Text>
      </Surface>

      {!user && (
        <View className="mt-2 gap-4">
          <SignIn />
          <SignUp />
        </View>
      )}

      <Modal visible={isSheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-background px-4 py-4">
            <Text className="text-foreground font-semibold text-lg mb-3">Add Habit</Text>

            <Text className="text-muted text-xs mb-1">Name</Text>
            <TextInput
              value={habitName}
              onChangeText={setHabitName}
              placeholder="e.g. Walk 20 min"
              placeholderTextColor="#9CA3AF"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 12,
                color: "#111827",
              }}
            />

            <Text className="text-muted text-xs mb-1">Cadence</Text>
            <View className="flex-row gap-2 mb-3">
              <Button size="sm" variant={cadence === "daily" ? "primary" : "secondary"} onPress={() => setCadence("daily")}>
                Daily
              </Button>
              <Button
                size="sm"
                variant={cadence === "weekdays" ? "primary" : "secondary"}
                onPress={() => setCadence("weekdays")}
              >
                Weekdays
              </Button>
            </View>

            <Text className="text-muted text-xs mb-1">Anchor</Text>
            <View className="flex-row gap-2 mb-3 flex-wrap">
              {(["morning", "afternoon", "evening", "anytime"] as const).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={anchor === value ? "primary" : "secondary"}
                  onPress={() => setAnchor(value)}
                >
                  {value}
                </Button>
              ))}
            </View>

            <Text className="text-muted text-xs mb-1">Difficulty</Text>
            <View className="flex-row gap-2 mb-4">
              {(["low", "medium", "high"] as const).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={difficulty === value ? "primary" : "secondary"}
                  onPress={() => setDifficulty(value)}
                >
                  {value}
                </Button>
              ))}
            </View>

            <View className="flex-row gap-2">
              <Button variant="secondary" className="flex-1" onPress={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" onPress={() => void onSubmitHabit()}>
                Save Habit
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
