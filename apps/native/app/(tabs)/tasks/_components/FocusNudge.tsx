import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Text, View } from "react-native";
import { SpicedCard } from "@/components/ui/SpicedCard";

export function FocusNudge() {
  const inboxTasks = useQuery(api.queries.taskQueries.inbox);
  const focusTasks = useQuery(api.queries.taskQueries.todayFocus);

  const hasInboxItems = (inboxTasks?.length ?? 0) > 0;
  const hasNoFocusItems = (focusTasks?.length ?? 0) === 0;

  if (!hasInboxItems || !hasNoFocusItems) {
    return null;
  }

  return (
    <SpicedCard className="p-4 bg-primary/5 border-primary/20 shadow-none">
      <Text className="text-foreground text-sm font-medium">
        You have {inboxTasks?.length} task{inboxTasks?.length === 1 ? "" : "s"} in your inbox ready
        for your focus.
      </Text>
    </SpicedCard>
  );
}
