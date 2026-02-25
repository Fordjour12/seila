import { Stack } from "expo-router";
import { Colors } from "../../../constants/theme";

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Tasks",
          headerStyle: { backgroundColor: Colors.bgRaised },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerShown: true,
          title: "Add Task",
          headerBackVisible: true,
          headerStyle: { backgroundColor: Colors.bgRaised },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: true,
          title: "Edit Task",
          headerBackVisible: true,
          headerStyle: { backgroundColor: Colors.bgRaised },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
      />
      <Stack.Screen
        name="consistency"
        options={{
          headerShown: true,
          title: "Task Consistency",
          headerBackVisible: true,
          headerStyle: { backgroundColor: Colors.bgRaised },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
      />
      <Stack.Screen
        name="task-consistency"
        options={{
          headerShown: true,
          title: "Task Details",
          headerBackVisible: true,
          headerStyle: { backgroundColor: Colors.bgRaised },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
      />
    </Stack>
  );
}
