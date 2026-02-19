import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Surface } from "heroui-native";
import { Text, View } from "react-native";

export function FocusNudge() {
  const inboxTasks = useQuery(api.queries.taskQueries.inbox);
  const focusTasks = useQuery(api.queries.taskQueries.todayFocus);

  const hasInboxItems = (inboxTasks?.length ?? 0) > 0;
  const hasNoFocusItems = (focusTasks?.length ?? 0) === 0;

  if (!hasInboxItems || !hasNoFocusItems) {
    return null;
  }

  return (
    <Surface variant="secondary" className="p-3 rounded-lg">
      <Text className="text-muted text-sm">
        You have {inboxTasks?.length} task{inboxTasks?.length === 1 ? "" : "s"} in your inbox ready for today&apos;s focus.
      </Text>
    </Surface>
  );
}
