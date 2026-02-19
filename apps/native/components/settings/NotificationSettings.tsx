import { useState } from "react";
import { View, Text, Switch, TouchableOpacity } from "react-native";
import { Surface, Button } from "heroui-native";

interface NotificationSettingsProps {
  onClose?: () => void;
}

const POLICIES = [
  { id: "morning_habit", label: "Morning Habit Reminder", description: "Remind to log habits by 10am" },
  { id: "checkin_prompt", label: "Check-in Reminder", description: "Prompt for daily check-in by 8pm" },
  { id: "weekly_review", label: "Weekly Review", description: "Reminder on Sunday evenings" },
  { id: "focus_empty", label: "Focus Reminder", description: "When focus is empty and inbox has items" },
  { id: "pattern_surface", label: "Pattern Alerts", description: "When new patterns are detected" },
  { id: "rest_permission", label: "Rest Permission", description: "After 5+ active days" },
];

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [enabledPolicies, setEnabledPolicies] = useState<Record<string, boolean>>({
    morning_habit: true,
    checkin_prompt: true,
    weekly_review: true,
    focus_empty: true,
    pattern_surface: true,
    rest_permission: true,
  });

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  const togglePolicy = (id: string) => {
    setEnabledPolicies((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const activeCount = Object.values(enabledPolicies).filter(Boolean).length;

  return (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-foreground text-lg font-medium">Notifications</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text className="text-primary">Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <Surface variant="secondary" className="p-4 rounded-xl mb-4">
        <Text className="text-foreground font-medium mb-3">Quiet Hours</Text>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-muted">Enable quiet hours</Text>
          <Switch
            value={quietHoursEnabled}
            onValueChange={setQuietHoursEnabled}
          />
        </View>
        {quietHoursEnabled && (
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-muted text-xs mb-1">Start</Text>
              <View className="bg-default-100 p-2 rounded-lg">
                <Text className="text-foreground">{quietStart}</Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-muted text-xs mb-1">End</Text>
              <View className="bg-default-100 p-2 rounded-lg">
                <Text className="text-foreground">{quietEnd}</Text>
              </View>
            </View>
          </View>
        )}
      </Surface>

      <Surface variant="secondary" className="p-4 rounded-xl mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-medium">Policy Notifications</Text>
          <Text className="text-muted text-sm">{activeCount} active</Text>
        </View>
        
        <Text className="text-muted text-xs mb-4">
          Choose which suggestions can notify you. All messages use neutral, non-urgent language.
        </Text>

        {POLICIES.map((policy) => (
          <View
            key={policy.id}
            className="flex-row items-center justify-between py-3 border-b border-default-100 last:border-0"
          >
            <View className="flex-1 mr-4">
              <Text className="text-foreground text-sm">{policy.label}</Text>
              <Text className="text-muted text-xs">{policy.description}</Text>
            </View>
            <Switch
              value={enabledPolicies[policy.id]}
              onValueChange={() => togglePolicy(policy.id)}
            />
          </View>
        ))}
      </Surface>

      <Text className="text-muted text-xs text-center">
        Notifications are always neutral. No urgency language, streaks, or failure states.
      </Text>
    </View>
  );
}
