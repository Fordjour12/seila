import { Card, Chip, Button, Separator } from "heroui-native";
import React from "react";
import { Text, View, Pressable } from "react-native";
import { formatRelativeDate, getTaskStatusColor } from "@/lib/task-utils";

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
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export function TaskCard({
  task,
  onPress,
  onMenuPress,
  showMenu = true,
}: TaskCardProps) {
  const hasDescription = task.description && task.description.length > 0;
  const relativeDate = task.dueAt
    ? formatRelativeDate(new Date(task.dueAt))
    : null;

  return (
    <Pressable onPress={onPress}>
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
                  color={getTaskStatusColor(task.status) as "success" | "warning" | "default" | "danger" | "accent"}
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
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                onPress={(e) => {
                  e.stopPropagation();
                  onMenuPress?.();
                }}
                className="w-8 h-8"
              >
                <Text className="text-muted-foreground text-lg">⋯</Text>
              </Button>
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
