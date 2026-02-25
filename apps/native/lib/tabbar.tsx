import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useModeThemeColors } from "./theme";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const TAB_CONFIG: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Today", icon: "home-outline" },
  "habits/index": { label: "Habits", icon: "leaf-outline" },
  "checkin/index": { label: "Check-in", icon: "pulse-outline" },
  tasks: { label: "Tasks", icon: "checkbox-outline" },
  finance: { label: "Finance", icon: "wallet-outline" },
  "patterns/index": { label: "Patterns", icon: "analytics-outline" },
  "review/index": { label: "Review", icon: "document-text-outline" },
};

function getTabIconName(icon: IconName, isFocused: boolean): IconName {
  if (isFocused && icon.endsWith("-outline")) {
    return icon.replace("-outline", "") as IconName;
  }
  return icon;
}

const styles = StyleSheet.create({
  wrapperShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: { elevation: 14 },
    }),
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    maxWidth: 56,
    textAlign: "center",
    fontSize: 9,
  },
});

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useModeThemeColors();
  const [searchQuery, setSearchQuery] = useState("");

  const scaleAnims = useRef(
    state.routes.map(() => new Animated.Value(1)),
  ).current;

  useEffect(() => {
    scaleAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === state.index ? 1.1 : 1,
        useNativeDriver: true,
        tension: 220,
        friction: 14,
      }).start();
    });
  }, [scaleAnims, state.index]);

  const handlePress = (
    routeName: string,
    routeKey: string,
    globalIdx: number,
  ) => {
    const event = navigation.emit({
      type: "tabPress",
      target: routeKey,
      canPreventDefault: true,
    });

    if (state.index !== globalIdx && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const renderTab = (route: (typeof state.routes)[0]) => {
    const globalIdx = state.routes.findIndex((r) => r.key === route.key);
    const isActive = state.index === globalIdx;
    const cfg = TAB_CONFIG[route.name] ?? {
      label: route.name,
      icon: "ellipse-outline" as IconName,
    };
    const { label, icon } = cfg;

    return (
      <TouchableOpacity
        key={route.key}
        className="flex-1 items-center justify-center py-1.5 min-h-12.5 px-0.5"
        onPress={() => handlePress(route.name, route.key, globalIdx)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Animated.View
          style={[
            styles.tabInner,
            { transform: [{ scale: scaleAnims[globalIdx] }] },
          ]}
        >
          <Ionicons
            name={getTabIconName(icon, isActive)}
            size={20}
            color={isActive ? colors.foreground : colors.muted}
          />
          {label ? (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.tabLabel}
              className={`text-[10px] tracking-[0.2px] ${
                isActive ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {label}
            </Text>
          ) : null}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView pointerEvents="box-none" behavior="padding">
      <View
        className="bg-background border-t border-border px-3.5 pt-1"
        style={[
          styles.wrapperShadow,
          {
            paddingBottom: insets.bottom + 6,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View className="flex-row items-center bg-surface border-border border rounded-2xl px-3.5 py-0.3 gap-2.5">
          <View className="size-4.4 items-center justify-center">
            <View
              style={{
                width: 11,
                height: 11,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: colors.foreground,
              }}
            />
            <View
              style={{
                position: "absolute",
                width: 1.5,
                height: 5,
                backgroundColor: colors.foreground,
                borderRadius: 1,
                transform: [{ rotate: "45deg" }],
                top: 10,
                left: 11,
              }}
            />
          </View>
          <TextInput
            className="text-sm  text-muted-foreground flex-1"
            placeholder="Search for actions, people, instruments"
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="flex-row items-center pb-0.5 mt-1.5">
          <View className="flex-1 flex-row justify-between">
            {state.routes.map(renderTab)}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
