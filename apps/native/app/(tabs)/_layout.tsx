import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TabBar } from "@/lib/tabbar/v2";
import { isReviewWindowOpen } from "@/lib/review-window";

type IconName = React.ComponentProps<typeof Ionicons>["name"];



export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
                headerShown: false
            }}
        />
    );
}
