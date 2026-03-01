import { Redirect, Stack } from "expo-router";
import { HABITS_ENABLED } from "@/lib/features";

export default function HabitsLayout() {
  if (!HABITS_ENABLED) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"

      />
      <Stack.Screen
        name="add"

      />
      <Stack.Screen
        name="edit"

      />
      <Stack.Screen
        name="consistency"

      />
      <Stack.Screen
        name="manage"

      />
    </Stack>
  );
}
