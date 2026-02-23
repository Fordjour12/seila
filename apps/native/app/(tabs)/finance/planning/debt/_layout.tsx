import { Stack } from "expo-router";
import { Colors } from "../../../../../constants/theme";

export default function DebtLayout() {
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
          title: "Debt",
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
          title: "Add Debt",
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
          title: "Edit Debt",
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
