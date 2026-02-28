import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { useToast, Button, Chip, Surface, Separator } from "heroui-native";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { TaskCard } from "@/app/(tabs)/tasks/_components/TaskCard";
import {
  WeekCalendar,
  WeekHeroCard,
} from "@/app/(tabs)/tasks/_components/WeekCalendar";
import { isSameDay } from "@/lib/task-utils";
import { Container } from "@/components/container";
import { Ionicons } from "@expo/vector-icons";

function getIdempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

interface Task {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  source?: string;
  dueAt?: number;
  priority?: string;
  status?: string;
  tags?: string[];
  createdAt: number;
}

export function TaskList() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Check if selected date is today
  const isTodaySelected = useMemo(() => {
    return isSameDay(selectedDate, new Date());
  }, [selectedDate]);

  // Queries - use different queries based on selected date
  const inboxTasks = useQuery(api.queries.taskQueries.inbox);
  const focusTasks = useQuery(api.queries.taskQueries.todayFocus);
  const completedTasks = useQuery(api.queries.taskQueries.doneRecently);

  // For today, show inbox + focus tasks
  // For other dates, we need to fetch all tasks and filter
  const allTasks = useQuery(api.queries.taskQueries.filteredTasks, {});

  // Mutations
  const focusTaskMutation = useMutation(api.commands.tasks.focusTask.focusTask);
  const deferTaskMutation = useMutation(api.commands.tasks.deferTask.deferTask);
  const abandonTaskMutation = useMutation(
    api.commands.tasks.abandonTask.abandonTask,
  );
  const completeTaskMutation = useMutation(
    api.commands.tasks.completeTask.completeTask,
  );

  // Filtered tasks for selected date
  const filteredTasks: Task[] = useMemo(() => {
    if (isTodaySelected) {
      // For today, combine inbox and focus tasks
      return [...(inboxTasks ?? []), ...(focusTasks ?? [])] as Task[];
    }

    // For other dates, filter from all tasks
    if (!allTasks) return [];

    return (allTasks as Task[]).filter((task) => {
      if (!task.dueAt) return false;
      const taskDate = new Date(task.dueAt);
      return isSameDay(taskDate, selectedDate);
    });
  }, [allTasks, inboxTasks, focusTasks, isTodaySelected, selectedDate]);

  // Get dates with tasks for highlighting
  const datesWithTasks = useMemo(() => {
    if (!allTasks) return [];

    const dates: Date[] = [];
    (allTasks as Task[]).forEach((task) => {
      if (task.dueAt) {
        dates.push(new Date(task.dueAt));
      }
    });
    return dates;
  }, [allTasks]);

  // Stats
  const completedCount = completedTasks?.length ?? 0;
  const pendingCount = (inboxTasks?.length ?? 0) + (focusTasks?.length ?? 0);

  // Handlers
  const handleTaskPress = (taskId: string) => {
    router.push(`/(tabs)/tasks/edit?id=${taskId}`);
  };

  const handleMenuPress = (task: Task) => {
    toast.show({
      variant: "default",
      label: `Options for: ${task.title}`,
    });
  };

  const handleAddTask = () => {
    router.push("/(tabs)/tasks/add");
  };

  const handleHistoryTask = () => {
    router.push(`/tasks/details`);
  };

  const isFocusFull = (focusTasks?.length ?? 0) >= 3;

  return (
    <Container className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-3xl font-bold text-foreground">Today</Text>
        <View className="flex-row">
          <Button variant="ghost" onPress={handleAddTask} isIconOnly>
            <Ionicons name="add" size={24} color="white" />
          </Button>

          <Button variant="ghost" onPress={handleHistoryTask} isIconOnly>
            <Ionicons name="menu" size={24} color="white" />
          </Button>
        </View>
      </View>

      {/* Week Hero Card */}
      <WeekHeroCard
        date={selectedDate}
        completedCount={completedCount}
        pendingCount={pendingCount}
      />

      {/* Week Calendar Strip */}
      <WeekCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        highlightDates={datesWithTasks}
      />

      {/*<Separator className="mx-4 mb-4" />*/}

      {/* Task List */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        {filteredTasks.length === 0 ? (
          <Surface className="rounded-2xl p-8 items-center justify-center">
            <Text className="text-muted-foreground text-center mb-2">
              No tasks for{" "}
              {selectedDate.toLocaleDateString(undefined, { weekday: "long" })}
            </Text>
            <Text className="text-sm text-muted-foreground/70 text-center">
              Tap + to add a task for this day
            </Text>
          </Surface>
        ) : (
          <View>
            {filteredTasks.map((task: Task, index: number) => (
              <React.Fragment key={task._id}>
                <TaskCard
                  task={{
                    _id: task._id.toString(),
                    title: task.title,
                    description: task.description,
                    source: task.source || "Inbox",
                    dueAt: task.dueAt,
                    priority: task.priority,
                    status: task.status,
                    tags: task.tags,
                  }}
                  onPress={() => handleTaskPress(task._id.toString())}
                  onMenuPress={() => handleMenuPress(task)}
                />
                {index < filteredTasks.length - 1 && (
                  <Separator className="my-1" />
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </Container>
  );
}
