import { Stack } from "expo-router";
import { Colors } from "../../../../constants/theme";

export default function AccountsLayout() {
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
          title: "Accounts",
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
          headerShown: false,
          title: "Add Account",
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
