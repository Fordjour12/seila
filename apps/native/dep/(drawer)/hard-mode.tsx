import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
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

import { Container } from "@/components/container";
import { HardModeIndicator } from "@/components/hard-mode/HardModeIndicator";
import {
  activateHardModeRef,
  crisisOverrideHardModeRef,
  currentHardModePlanRef,
  deactivateHardModeRef,
  extendHardModeRef,
  flagHardModeItemRef,
  hardModeSessionRef,
  type HardModeConstraint,
  type HardModePlannedItem,
  type HardModeScope,
} from "@/lib/hard-mode-refs";

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

const anchorChoices: Array<"morning" | "afternoon" | "evening" | "anytime"> = [
  "morning",
  "afternoon",
  "evening",
  "anytime",
];

export default function HardModeScreen() {
  const session = useQuery(hardModeSessionRef, {});
  const plan = useQuery(currentHardModePlanRef, {});

  const activateHardMode = useMutation(activateHardModeRef);
  const flagItem = useMutation(flagHardModeItemRef);
  const deactivateHardMode = useMutation(deactivateHardModeRef);
  const extendHardMode = useMutation(extendHardModeRef);
  const crisisOverride = useMutation(crisisOverrideHardModeRef);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [durationDays, setDurationDays] = useState("1");
  const [maxItems, setMaxItems] = useState("3");
  const [selectedAnchors, setSelectedAnchors] = useState<Array<"morning" | "afternoon" | "evening" | "anytime">>([
    "morning",
    "anytime",
  ]);
  const [scope, setScope] = useState<HardModeScope>({
    habits: true,
    tasks: true,
    checkin: true,
    finance: false,
  });

  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flaggingItem, setFlaggingItem] = useState<HardModePlannedItem | null>(null);

  const constraints = useMemo<HardModeConstraint[]>(() => {
    const items: HardModeConstraint[] = [
      {
        id: "constraint:anchors",
        type: "allowed_habit_anchors",
        anchors: selectedAnchors.length > 0 ? selectedAnchors : ["anytime"],
      },
      {
        id: "constraint:max-items",
        type: "max_planned_items",
        value: Math.max(1, Number(maxItems) || 3),
      },
    ];

    if (!scope.finance) {
      items.push({
        id: "constraint:no-finance",
        type: "disallow_module",
        module: "finance",
      });
    }

    return items;
  }, [maxItems, scope.finance, selectedAnchors]);

  const activeSessionId = session?._id as Id<"hardModeSessions"> | undefined;

  const onActivate = async () => {
    const parsedDays = Number(durationDays);
    if (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 14) {
      Alert.alert("Invalid duration", "Choose an integer duration between 1 and 14 days.");
      return;
    }

    await activateHardMode({
      idempotencyKey: idempotencyKey("hardMode.activate"),
      scope,
      constraints,
      durationDays: parsedDays,
    });

    setSheetOpen(false);
  };

  return (
    <Container className="px-4 pb-6">
      <View className="py-6 mb-4">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">Hard Mode</Text>
        <Text className="text-muted text-sm mt-1">
          Structured support window with conservative AI planning.
        </Text>
        <HardModeIndicator />
      </View>

      {!session || !session.isActive ? (
        <Surface variant="secondary" className="p-4 rounded-xl mb-4">
          <Text className="text-foreground font-medium mb-2">Start Hard Mode</Text>
          <Text className="text-muted text-sm mb-3">
            Choose scope, duration, and constraints before handing over planning.
          </Text>
          <Button variant="primary" onPress={() => setSheetOpen(true)}>
            Activate
          </Button>
        </Surface>
      ) : (
        <Surface variant="secondary" className="p-4 rounded-xl mb-4">
          <Text className="text-foreground font-medium">Session active</Text>
          <Text className="text-muted text-sm mt-1">
            Window: {new Date(session.windowStart).toLocaleString()} - {new Date(session.windowEnd).toLocaleString()}
          </Text>
          <View className="flex-row gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                if (!activeSessionId) {
                  return;
                }
                void extendHardMode({
                  idempotencyKey: idempotencyKey("hardMode.extend"),
                  sessionId: activeSessionId,
                  extendDays: 1,
                  confirmExtend: true,
                });
              }}
            >
              Extend +1 day
            </Button>
            <Button
              size="sm"
              variant="danger"
              onPress={() => {
                if (!activeSessionId) {
                  return;
                }
                void deactivateHardMode({
                  idempotencyKey: idempotencyKey("hardMode.deactivate"),
                  sessionId: activeSessionId,
                });
              }}
            >
              Exit
            </Button>
          </View>
          <Pressable
            onLongPress={() => {
              if (!activeSessionId) {
                return;
              }
              void crisisOverride({
                idempotencyKey: idempotencyKey("hardMode.crisisOverride"),
                sessionId: activeSessionId,
              });
            }}
            delayLongPress={500}
            className="mt-3 rounded-lg border border-default-300 px-3 py-2"
          >
            <Text className="text-muted text-xs">Press and hold for Crisis Override</Text>
          </Pressable>
        </Surface>
      )}

      <Surface variant="secondary" className="p-4 rounded-xl">
        <Text className="text-foreground font-medium mb-2">Today&apos;s Plan</Text>
        {!plan || plan.items.length === 0 ? (
          <Text className="text-muted text-sm">No plan generated yet.</Text>
        ) : (
          <View className="gap-3">
            {plan.items.map((item) => (
              <Pressable
                key={item.id}
                className="rounded-lg bg-default-100 p-3"
                onLongPress={() => {
                  Alert.alert("Rationale", item.rationale);
                }}
                delayLongPress={250}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-foreground font-medium">{item.title}</Text>
                    <Text className="text-muted text-xs mt-1">
                      {item.module} · {new Date(item.scheduledAt).toLocaleTimeString()} · {(item.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                      setFlaggingItem(item);
                      setFlagModalOpen(true);
                    }}
                    isDisabled={!activeSessionId || item.status !== "planned"}
                  >
                    Flag
                  </Button>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </Surface>

      <Modal
        visible={sheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-background px-4 py-4">
            <Text className="text-foreground font-semibold text-lg mb-3">Activate Hard Mode</Text>

            <Text className="text-muted text-xs mb-1">Scope</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {(["habits", "tasks", "checkin", "finance"] as const).map((module) => (
                <Button
                  key={module}
                  size="sm"
                  variant={scope[module] ? "primary" : "secondary"}
                  onPress={() => setScope((prev) => ({ ...prev, [module]: !prev[module] }))}
                >
                  {module}
                </Button>
              ))}
            </View>

            <Text className="text-muted text-xs mb-1">Duration (days)</Text>
            <TextInput
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
              placeholder="1"
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

            <Text className="text-muted text-xs mb-1">Allowed habit anchors</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {anchorChoices.map((anchor) => (
                <Button
                  key={anchor}
                  size="sm"
                  variant={selectedAnchors.includes(anchor) ? "primary" : "secondary"}
                  onPress={() => {
                    setSelectedAnchors((prev) =>
                      prev.includes(anchor)
                        ? prev.filter((value) => value !== anchor)
                        : [...prev, anchor],
                    );
                  }}
                >
                  {anchor}
                </Button>
              ))}
            </View>

            <Text className="text-muted text-xs mb-1">Max planned items</Text>
            <TextInput
              value={maxItems}
              onChangeText={setMaxItems}
              keyboardType="number-pad"
              placeholder="3"
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

            <View className="flex-row gap-2">
              <Button variant="secondary" className="flex-1" onPress={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" onPress={() => void onActivate()}>
                Start
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={flagModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setFlagModalOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/30 px-6">
          <View className="w-full rounded-xl bg-background p-4">
            <Text className="text-foreground font-semibold text-base mb-1">Flag Item</Text>
            <Text className="text-muted text-xs mb-3">Choose how to adjust this item.</Text>
            <View className="gap-2">
              <Button
                variant="secondary"
                onPress={() => {
                  if (!activeSessionId || !flaggingItem) return;
                  void flagItem({
                    idempotencyKey: idempotencyKey("hardMode.flag.not-now"),
                    sessionId: activeSessionId,
                    itemId: flaggingItem.id,
                    flag: "not_now",
                  });
                  setFlagModalOpen(false);
                  setFlaggingItem(null);
                }}
              >
                Not now
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  if (!activeSessionId || !flaggingItem) return;
                  void flagItem({
                    idempotencyKey: idempotencyKey("hardMode.flag.not-aligned"),
                    sessionId: activeSessionId,
                    itemId: flaggingItem.id,
                    flag: "not_aligned",
                  });
                  setFlagModalOpen(false);
                  setFlaggingItem(null);
                }}
              >
                Not aligned
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  if (!activeSessionId || !flaggingItem) return;
                  void flagItem({
                    idempotencyKey: idempotencyKey("hardMode.flag.too-much"),
                    sessionId: activeSessionId,
                    itemId: flaggingItem.id,
                    flag: "too_much",
                  });
                  setFlagModalOpen(false);
                  setFlaggingItem(null);
                }}
              >
                Too much
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  setFlagModalOpen(false);
                  setFlaggingItem(null);
                }}
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
