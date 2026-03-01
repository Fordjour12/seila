import { Card, Chip, Button, Popover, Separator } from "heroui-native";
import React from "react";
import { Text, View, Pressable } from "react-native";
import { formatRelativeDate, getTaskStatusColor } from "@/lib/task-utils";
import { Ionicons } from "@expo/vector-icons";
import { useModeThemeColors } from "@/lib/theme";

interface TaskCardProps {
  task: {
    _id: string;
    title: string;
    description?: string;
    source?: string;
    dueAt?: number;
    priority?: string;
    status?: string;
    tags?: string[];
  };
  onPress?: () => void;
  onFocusPress?: () => void;
  onDeferPress?: () => void;
  onCompletePress?: () => void;
  onAbandonPress?: () => void;
  showMenu?: boolean;
  disabled?: boolean;
}

export function TaskCard({
  task,
  onPress,
  onFocusPress,
  onDeferPress,
  onCompletePress,
  onAbandonPress,
  showMenu = true,
  disabled = false,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const hasDescription = task.description && task.description.length > 0;
  const relativeDate = task.dueAt
    ? formatRelativeDate(new Date(task.dueAt))
    : null;

  const colors = useModeThemeColors();

  const actionItems: Array<{
    key: string;
    label: string;
    hint: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    toneClass: string;
    labelClass: string;
    iconColor: string;
    onPress?: () => void;
  }> = [
    {
      key: "complete",
      label: "Complete",
      hint: "Mark done and move out of active lists",
      icon: "checkmark-circle-outline",
      toneClass: "bg-success/10 border-success/30",
      labelClass: "text-foreground",
      iconColor: colors.success,
      onPress: onCompletePress,
    },
    {
      key: "focus",
      label: "Focus",
      hint: "Move into your active focus list",
      icon: "flash-outline",
      toneClass: "bg-primary/10 border-primary/30",
      labelClass: "text-foreground",
      iconColor: colors.accent,
      onPress: onFocusPress,
    },
    {
      key: "defer",
      label: "Defer",
      hint: "Push this task to tomorrow",
      icon: "time-outline",
      toneClass: "bg-warning/10 border-warning/30",
      labelClass: "text-foreground",
      iconColor: colors.warning,
      onPress: onDeferPress,
    },
    {
      key: "abandon",
      label: "Abandon",
      hint: "Archive this task as no longer needed",
      icon: "close-circle-outline",
      toneClass: "bg-danger/10 border-danger/30",
      labelClass: "text-danger",
      iconColor: colors.danger,
      onPress: onAbandonPress,
    },
  ];
  const availableActions = actionItems.filter((item) => Boolean(item.onPress));
  const hasActions = availableActions.length > 0;

  const handleActionPress = (action?: () => void) => {
    setMenuOpen(false);
    action?.();
  };

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Card className="mb-3 rounded-2xl overflow-hidden bg-surface">
        <Card.Body className="p-4">
          {/* Task Title */}
          <Text className="text-base font-semibold text-foreground mb-1">
            {task.title}
          </Text>

          {/* Source & Description */}
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">
              {task.source || "Inbox"}
            </Text>
            <Text className="text-sm text-muted-foreground/70">
              {hasDescription ? task.description : "No description"}
            </Text>
          </View>

          {/* Tags Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row gap-2">
              {/* Due Date Tag */}
              {relativeDate && (
                <Chip size="sm" variant="soft" color="success">
                  <Chip.Label className="text-xs">{relativeDate}</Chip.Label>
                </Chip>
              )}

              {/* Status Tag */}
              {task.status && task.status !== "pending" && (
                <Chip
                  size="sm"
                  variant="soft"
                  color={
                    getTaskStatusColor(task.status) as
                      | "success"
                      | "warning"
                      | "default"
                      | "danger"
                      | "accent"
                  }
                >
                  <Chip.Label className="text-xs capitalize">
                    {task.status.replace("_", " ")}
                  </Chip.Label>
                </Chip>
              )}

              {/* Priority Tag */}
              {task.priority && (
                <Chip size="sm" variant="soft" color="default">
                  <Chip.Label className="text-xs uppercase">
                    {task.priority}
                  </Chip.Label>
                </Chip>
              )}
            </View>

            {/* Menu Button */}
            {showMenu && (
              <Popover
                presentation="bottom-sheet"
                isOpen={menuOpen}
                onOpenChange={setMenuOpen}
              >
                <Popover.Trigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    isIconOnly
                    isDisabled={!hasActions}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (!hasActions) return;
                      setMenuOpen(true);
                    }}
                  >
                    <Ionicons
                      name="ellipsis-horizontal-outline"
                      size={16}
                      color={colors.foreground}
                    />
                  </Button>
                </Popover.Trigger>

                <Popover.Portal>
                  <Popover.Overlay className="bg-black/40" />
                  <Popover.Content
                    presentation="bottom-sheet"
                    className="rounded-t-3xl border border-border bg-surface px-4 pt-4 pb-6"
                  >
                    <Text className="text-base font-semibold text-foreground">
                      Task Options
                    </Text>
                    <Text className="text-sm text-foreground mt-1">
                      {task.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1 mb-3">
                      Choose an action
                    </Text>

                    <View className="gap-2">
                      {availableActions.map((item) => (
                        <Pressable
                          key={item.key}
                          className={`flex-row items-center rounded-2xl border px-3 py-3 ${item.toneClass}`}
                          onPress={() => {
                            handleActionPress(item.onPress);
                          }}
                        >
                          <View className="h-9 w-9 rounded-full bg-background/70 items-center justify-center">
                            <Ionicons
                              name={item.icon}
                              size={18}
                              color={item.iconColor}
                            />
                          </View>
                          <View className="flex-1 ml-3">
                            <Text
                              className={`text-sm font-medium ${item.labelClass}`}
                            >
                              {item.label}
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-0.5">
                              {item.hint}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.foreground}
                          />
                        </Pressable>
                      ))}
                    </View>

                    <Pressable
                      className="items-center justify-center py-4 mt-3 border-t border-border"
                      onPress={() => setMenuOpen(false)}
                    >
                      <Text className="text-sm text-muted-foreground">
                        Cancel
                      </Text>
                    </Pressable>
                  </Popover.Content>
                </Popover.Portal>
              </Popover>
            )}
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}

export function TaskCardSeparator() {
  return <Separator className="my-1" />;
}
