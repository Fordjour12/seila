import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";

import { savingsGoalsRef, deleteSavingsGoalRef } from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";

export default function SavingsScreen() {
  const router = useRouter();
  const goals = useQuery(savingsGoalsRef, {});
  const deleteGoal = useMutation(deleteSavingsGoalRef);

  const [selectedGoal, setSelectedGoal] = React.useState<string | null>(null);

  const isLoading = goals === undefined;

  const handleLongPress = (goalId: string) => {
    setSelectedGoal(goalId);
  };

  const handleEdit = () => {
    if (selectedGoal) {
      router.push({ pathname: "/(tabs)/finance/savings/edit", params: { id: selectedGoal } } as any);
    }
    setSelectedGoal(null);
  };

  const handleDelete = async () => {
    if (selectedGoal) {
      try {
        await deleteGoal({
          goalId: selectedGoal as Id<"savingsGoals">,
        });
      } catch (e) {
        // Handle error
      }
    }
    setSelectedGoal(null);
  };

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-6 pb-24 gap-6">
        <View className="mb-2">
          <Text className="text-3xl font-serif text-foreground tracking-tight">Savings Goals</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Track your progress toward financial goals.
          </Text>
        </View>

        {goals && goals.length > 0 ? (
          <View className="gap-3">
            {goals.map((goal) => (
              <Pressable
                key={goal.goalId}
                className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm active:bg-muted"
                onPress={() => router.push({ pathname: "/(tabs)/finance/savings/edit", params: { id: goal.goalId } } as any)}
                onLongPress={() => handleLongPress(goal.goalId)}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-base font-medium text-foreground">{goal.name}</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {formatGhs(goal.currentAmount)} / {formatGhs(goal.targetAmount)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-medium text-warning">
                      {Math.round((goal.progress || 0) * 100)}%
                    </Text>
                  </View>
                </View>

                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-warning rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, (goal.progress || 0) * 100))}%` }}
                  />
                </View>

                {goal.deadlineAt && (
                  <Text className="text-xs text-muted-foreground">
                    Deadline: {new Date(goal.deadlineAt).toLocaleDateString()}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="py-12 items-center justify-center">
            <Text className="text-lg font-medium text-foreground mb-2">No savings goals yet</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Create a goal to start tracking your savings
            </Text>
          </View>
        )}

        <Pressable
          className="bg-surface rounded-2xl border border-border border-dashed p-4 items-center"
          onPress={() => router.push("/(tabs)/finance/savings/add" as any)}
        >
          <Text className="text-base text-warning font-medium">+ Add Savings Goal</Text>
        </Pressable>
      </ScrollView>

      {selectedGoal && (
        <View className="absolute inset-0 bg-black/50 justify-end">
          <Pressable className="absolute inset-0" onPress={() => setSelectedGoal(null)} />
          <View className="bg-surface rounded-t-3xl p-6 pb-12">
            <View className="w-9 h-0.75 bg-border rounded-sm self-center mb-6" />
            <Text className="text-lg font-medium text-foreground mb-4">Goal Options</Text>
            <Pressable
              className="bg-background border border-border rounded-xl p-4 mb-3"
              onPress={handleEdit}
            >
              <Text className="text-base text-foreground font-medium">Edit Goal</Text>
              <Text className="text-sm text-muted-foreground mt-1">Modify name, target, or deadline</Text>
            </Pressable>
            <Pressable
              className="bg-danger/10 border border-danger/20 rounded-xl p-4 mb-3"
              onPress={handleDelete}
            >
              <Text className="text-base text-danger font-medium">Delete Goal</Text>
              <Text className="text-sm text-muted-foreground mt-1">Remove this goal permanently</Text>
            </Pressable>
            <Pressable className="p-4 items-center" onPress={() => setSelectedGoal(null)}>
              <Text className="text-base text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
