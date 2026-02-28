import { Stack } from "expo-router";

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Tasks",
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerShown: true,
          title: "Add Task",
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: true,
          title: "Edit Task",
          headerBackVisible: true,
        }}
      />

      <Stack.Screen name="details" />
      <Stack.Screen
        name="consistency"
        options={{
          headerShown: false,
          title: "Task History",
        }}
      />
      <Stack.Screen
        name="task-consistency"
        options={{
          headerShown: true,
          title: "Task Details",
        }}
      />
    </Stack>
  );
}
