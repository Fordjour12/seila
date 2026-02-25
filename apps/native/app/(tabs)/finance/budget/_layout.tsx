import { Stack } from "expo-router";
import { Colors } from "../../../../constants/theme";

export default function BudgetLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen
                name="add"
                options={{
                    headerShown: false,
                    title: "Add Envelope",
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
                    headerShown: false,
                    title: "Edit Envelope",
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
