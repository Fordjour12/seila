import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button, Surface, useToast } from "heroui-native";
import { useState } from "react";
import { Text, View, ScrollView, Alert, Share } from "react-native";

const MODULES = [
  { value: "", label: "All" },
  { value: "habit", label: "Habits" },
  { value: "checkin", label: "Check-in" },
  { value: "task", label: "Tasks" },
  { value: "review", label: "Reviews" },
  { value: "finance", label: "Finance" },
  { value: "pattern", label: "Patterns" },
];

export function AuditLog() {
  const untypedApi = api as any;
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState("");

  const events = useQuery(
    untypedApi.queries.auditLog.allEvents,
    { module: selectedModule || undefined, limit: 50 }
  ) as any[];
  
  const eventCount = useQuery(
    untypedApi.queries.auditLog.eventCount,
    { module: selectedModule || undefined }
  ) as number;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getEventLabel = (type: string) => {
    const parts = type.split(".");
    return parts.length > 1 ? parts[1] : type;
  };

  const getModuleColor = (type: string) => {
    if (type.startsWith("habit")) return "bg-blue-100";
    if (type.startsWith("checkin")) return "bg-green-100";
    if (type.startsWith("task")) return "bg-purple-100";
    if (type.startsWith("review")) return "bg-orange-100";
    if (type.startsWith("finance")) return "bg-yellow-100";
    if (type.startsWith("pattern")) return "bg-pink-100";
    return "bg-gray-100";
  };

  const handleShare = async () => {
    try {
      const exportData = useQuery(
        untypedApi.queries.auditLog.exportEvents,
        { module: selectedModule || undefined }
      );
      
      const json = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: json,
        title: "Life OS Event Log Export",
      });
    } catch (error) {
      // User cancelled
    }
  };

  return (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-medium">Event Log</Text>
        <Text className="text-muted text-sm">{eventCount ?? 0} events</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {MODULES.map((mod) => (
            <Button
              key={mod.value}
              size="sm"
              variant={selectedModule === mod.value ? "primary" : "secondary"}
              onPress={() => setSelectedModule(mod.value)}
            >
              {mod.label}
            </Button>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row gap-2 mb-4">
        <Button
          size="sm"
          variant="secondary"
          onPress={handleShare}
        >
          Export JSON
        </Button>
      </View>

      <View className="gap-2">
        {!events ? (
          <Text className="text-muted">Loading...</Text>
        ) : events.length === 0 ? (
          <Text className="text-muted">No events yet.</Text>
        ) : (
          events.map((event) => (
            <Surface key={event._id} variant="secondary" className="p-3 rounded-lg">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className={`px-2 py-1 rounded ${getModuleColor(event.type)}`}>
                    <Text className="text-xs text-foreground">{getEventLabel(event.type)}</Text>
                  </View>
                </View>
                <Text className="text-muted text-xs">{formatDate(event.occurredAt)}</Text>
              </View>
              {event.payload && (
                <Text className="text-muted text-xs mt-1" numberOfLines={2}>
                  {JSON.stringify(event.payload).slice(0, 100)}
                </Text>
              )}
            </Surface>
          ))
        )}
      </View>
    </View>
  );
}
