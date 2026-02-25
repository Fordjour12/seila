import { Stack } from "expo-router";
import { Colors } from "../../../../../constants/theme";

export default function InvestmentsLayout() {
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
          title: "Investments",
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
          title: "Add Investment",
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
          title: "Edit Investment",
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
