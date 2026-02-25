import { Avatar, Button, Card } from "heroui-native";
import React from "react";

//<SafeAreaView edges={["top"]}>

import { TodayScreenCalm } from "@/components/today/variants/TodayScreenCalm";
import { TodayScreenCommand } from "@/components/today/variants/TodayScreenCommand";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Image } from "react-native";

export default function TwoScreen() {
  return <TodayScreenCalm />;
}
