import { Stack } from "expo-router";
import { Colors } from "../../../../constants/theme";

export default function TransactionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Transactions",
          headerBackVisible: true,
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
          title: "Log Transaction",
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
          presentation: "modal",
          headerShown: true,
          title: "Edit Transaction",
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
