import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useModeThemeColors } from "../../../lib/theme";
import { TAB_CONFIG, SETTINGS_TAB_AVATAR, getTabIconName, IconName } from "./config";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const styles = {
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  } as const,
  tabLabel: {
    maxWidth: 56,
    textAlign: "center" as const,
    fontSize: 9,
  },
};

interface TabItemProps {
  route: BottomTabBarProps["state"]["routes"][0];
  globalIndex: number;
  currentIndex: number;
  onPress: (routeName: string, routeKey: string, globalIdx: number) => void;
  scaleAnim: Animated.Value;
}

export function TabItem({
  route,
  globalIndex,
  currentIndex,
  onPress,
  scaleAnim,
}: TabItemProps) {
  const colors = useModeThemeColors();
  const isActive = currentIndex === globalIndex;

  const cfg = TAB_CONFIG[route.name] ?? {
    label: route.name,
    icon: "ellipse-outline" as IconName,
  };
  const { label, icon } = cfg;

  return (
    <TouchableOpacity
      key={route.key}
      className="flex-1 items-center justify-center py-1.5 min-h-12.5 px-0.5"
      onPress={() => onPress(route.name, route.key, globalIndex)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View
        style={[
          styles.tabInner,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {route.name === "settings" ? (
          <View
            className="h-5 w-5 overflow-hidden rounded-full border"
            style={{
              borderColor: isActive ? colors.accent : colors.border,
              borderWidth: isActive ? 1.5 : 1,
            }}
          >
            <Image
              source={SETTINGS_TAB_AVATAR}
              className="h-full w-full"
              resizeMode="cover"
            />
          </View>
        ) : (
          <Ionicons
            name={getTabIconName(icon, isActive)}
            size={20}
            color={isActive ? colors.foreground : colors.muted}
          />
        )}
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
}

export function useTabScaleAnimation(
  routes: BottomTabBarProps["state"]["routes"],
  currentIndex: number,
) {
  const scaleAnims = useRef(
    routes.map(() => new Animated.Value(1)),
  ).current;

  useEffect(() => {
    scaleAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === currentIndex ? 1.1 : 1,
        useNativeDriver: true,
        tension: 220,
        friction: 14,
      }).start();
    });
  }, [scaleAnims, currentIndex]);

  return scaleAnims;
}
