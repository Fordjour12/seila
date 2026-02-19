import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Container } from "@/components/container";
import { DailyCheckin, WeeklyCheckin } from "@/components/checkin";

type CheckinType = "daily" | "weekly";

export default function CheckinPage() {
  const [checkinType, setCheckinType] = useState<CheckinType>("daily");

  const handleComplete = () => {
    router.back();
  };

  return (
    <Container>
      <View className="flex-1">
        <View className="flex-row gap-2 p-4">
          <View className="flex-1">
            <View
              className={`p-3 rounded-lg text-center ${
                checkinType === "daily" ? "bg-primary" : "bg-default-100"
              }`}
            >
              <View
                className="cursor-pointer"
                onTouchEnd={() => setCheckinType("daily")}
              >
                <View className="text-center">
                  <View className="text-foreground font-medium">
                    Daily
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View className="flex-1">
            <View
              className={`p-3 rounded-lg ${
                checkinType === "weekly" ? "bg-primary" : "bg-default-100"
              }`}
            >
              <View
                className="cursor-pointer"
                onTouchEnd={() => setCheckinType("weekly")}
              >
                <View className="text-center">
                  <View className="text-foreground font-medium">
                    Weekly
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {checkinType === "daily" ? (
          <DailyCheckin onComplete={handleComplete} />
        ) : (
          <WeeklyCheckin onComplete={handleComplete} />
        )}
      </View>
    </Container>
  );
}
