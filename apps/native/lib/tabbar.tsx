import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
  BackHandler,
  Image,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useModeThemeColors } from "./theme";
import { isReviewWindowOpen } from "./review-window";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { type SearchResult } from "../hooks/useSearch";
import { useTabSearchController } from "../hooks/useTabSearchController";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const TAB_CONFIG: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Today", icon: "home-outline" },
  "habits/index": { label: "Habits", icon: "leaf-outline" },
  "checkin/index": { label: "Check-in", icon: "pulse-outline" },
  tasks: { label: "Tasks", icon: "checkbox-outline" },
  finance: { label: "Finance", icon: "wallet-outline" },
  "patterns/index": { label: "Patterns", icon: "analytics-outline" },
  "review/index": { label: "Review", icon: "document-text-outline" },
  settings: { label: "Settings", icon: "settings-outline" },
};
const SETTINGS_TAB_AVATAR = require("../assets/bba8b6ac6c886a26604e0b8f74964127.jpg");

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
  const { height: windowHeight } = useWindowDimensions();
  const colors = useModeThemeColors();
  const reviewWindowOpen = isReviewWindowOpen();
  const router = useRouter();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullScreenOpenRef = useRef(false);
  const isTabVisible = (routeName: string) =>
    routeName !== "review/index" || reviewWindowOpen;
  const activeRouteName = state.routes[state.index]?.name ?? "";
  const isSettingsRoute =
    activeRouteName === "settings" ||
    activeRouteName === "settings/index" ||
    activeRouteName.startsWith("settings/");

  const searchRoutes = useMemo(
    () =>
      Object.entries(TAB_CONFIG)
        .filter(([name]) => isTabVisible(name))
        .map(([name, config]) => ({
          name,
          label: config.label,
          icon: config.icon,
        })),
    [reviewWindowOpen],
  );
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results,
    isFocused: isSearchFocused,
    setIsFocused: setIsSearchFocused,
    isFullScreenOpen,
    showDropdown,
    closeSearch,
  } = useTabSearchController(searchRoutes);

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

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setExpandedGroups({});
  }, [searchQuery]);

  useEffect(() => {
    fullScreenOpenRef.current = isFullScreenOpen;
  }, [isFullScreenOpen]);

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
  };

  const iconByType: Record<SearchResult["type"], IconName> = {
    route: "navigate-outline",
    habit: "leaf-outline",
    task: "checkbox-outline",
    transaction: "wallet-outline",
    account: "card-outline",
    envelope: "pricetag-outline",
    savingsGoal: "trophy-outline",
    suggestion: "sparkles-outline",
  };

  const getSuggestionRouteName = (screen?: string) => {
    if (screen === "checkin") return "checkin/index";
    if (screen === "tasks") return "tasks";
    if (screen === "finance") return "finance";
    if (screen === "patterns") return "patterns/index";
    if (screen === "weekly-review") return "review/index";
    return undefined;
  };

  const handleSelectResult = (result: SearchResult) => {
    closeSearch();
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    if (result.type === "route") {
      navigation.navigate(result.routeName);
      return;
    }

    if (result.type === "habit") {
      router.push({
        pathname: "/(tabs)/habits/edit",
        params: { id: result.id },
      } as any);
      return;
    }

    if (result.type === "task") {
      router.push({
        pathname: "/(tabs)/tasks/edit",
        params: { id: result.id },
      } as any);
      return;
    }

    if (result.type === "transaction") {
      router.push({
        pathname: "/(tabs)/finance/transactions/edit",
        params: { transactionId: result.id },
      } as any);
      return;
    }

    if (result.type === "account") {
      router.push("/(tabs)/finance/accounts" as any);
      return;
    }

    if (result.type === "envelope") {
      router.push({
        pathname: "/(tabs)/finance/budget/edit",
        params: { id: result.id },
      } as any);
      return;
    }

    if (result.type === "savingsGoal") {
      router.push({
        pathname: "/(tabs)/finance/savings/edit",
        params: { id: result.id },
      } as any);
      return;
    }

    if (result.type === "suggestion") {
      const routeName = getSuggestionRouteName(result.screen);
      if (routeName) {
        navigation.navigate(routeName);
      }
    }
  };

  const onPressResult = (result: SearchResult) => {
    void Haptics.selectionAsync().catch(() => undefined);
    handleSelectResult(result);
  };

  const dismissFullScreenSearch = () => {
    setIsSearchFocused(false);
  };

  const groupedResults = useMemo(
    () => [
      {
        key: "navigate",
        title: "Navigate",
        items: results.filter((r) => r.type === "route"),
      },
      {
        key: "habits",
        title: "Habits",
        items: results.filter((r) => r.type === "habit"),
      },
      {
        key: "tasks",
        title: "Tasks",
        items: results.filter((r) => r.type === "task"),
      },
      {
        key: "finance",
        title: "Finance",
        items: results.filter(
          (r) =>
            r.type === "transaction" ||
            r.type === "account" ||
            r.type === "envelope" ||
            r.type === "savingsGoal",
        ),
      },
      {
        key: "suggestions",
        title: "Suggestions",
        items: results.filter((r) => r.type === "suggestion"),
      },
    ],
    [results],
  );

  const renderResultRow = (result: SearchResult) => {
    const iconName =
      result.type === "route"
        ? (result.icon as IconName)
        : iconByType[result.type];
    return (
      <TouchableOpacity
        key={result.key}
        activeOpacity={0.7}
        className="flex-row items-center gap-3 px-3.5 py-3.5 border-b border-border/60 min-h-14"
        onPress={() => onPressResult(result)}
      >
        <Ionicons name={iconName} size={16} color={colors.foreground} />
        <View className="flex-1">
          <Text className="text-sm text-foreground" numberOfLines={1}>
            {result.label}
          </Text>
          {result.subtitle ? (
            <Text
              className="text-[11px] text-muted-foreground"
              numberOfLines={1}
            >
              {result.subtitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (!isFullScreenOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      dismissFullScreenSearch();
      return true;
    });
    return () => sub.remove();
  }, [isFullScreenOpen]);

  if (isSettingsRoute) {
    return null;
  }

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
            returnKeyType="search"
            onSubmitEditing={() => {
              const firstResult = results[0];
              if (!firstResult) return;
              onPressResult(firstResult);
            }}
            onFocus={() => {
              if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
              setIsSearchFocused(true);
            }}
            onBlur={() => {
              blurTimeoutRef.current = setTimeout(() => {
                if (fullScreenOpenRef.current) {
                  return;
                }
                setIsSearchFocused(false);
              }, 120);
            }}
          />
        </View>

        {showDropdown ? (
          <View className="mt-1.5 bg-surface border border-border rounded-2xl overflow-hidden max-h-56">
            {results.length === 0 ? (
              <View className="px-3 py-2.5">
                <Text className="text-xs text-muted-foreground">
                  No results
                </Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {results.map(renderResultRow)}
              </ScrollView>
            )}
          </View>
        ) : null}

        {isFullScreenOpen ? (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: windowHeight,
              zIndex: 50,
            }}
          >
            <Pressable
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(12, 13, 15, 0.42)" }}
              onPress={dismissFullScreenSearch}
            />
            <View className="absolute inset-0 px-2.5 pt-2.5 pb-2">
              <View
                className="flex-1 rounded-2xl border overflow-hidden"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: "#000",
                  shadowOpacity: 0.2,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 18,
                }}
              >
                <View
                  className="px-3 py-2.5 border-b"
                  style={{ borderColor: colors.border }}
                >
                  <View
                    className="flex-row items-center border rounded-xl px-3 py-2 gap-2.5"
                    style={{
                      borderColor: colors.warning,
                      backgroundColor: colors.background,
                    }}
                  >
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={colors.warning}
                    />
                    <TextInput
                      className="text-sm flex-1"
                      style={{ color: colors.foreground }}
                      placeholder="Search..."
                      placeholderTextColor={colors.muted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                      returnKeyType="search"
                      onSubmitEditing={() => {
                        const firstResult = results[0];
                        if (!firstResult) return;
                        onPressResult(firstResult);
                      }}
                    />
                    <TouchableOpacity
                      onPress={dismissFullScreenSearch}
                      className="size-5 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.muted }}
                    >
                      <Ionicons
                        name="close"
                        size={12}
                        color={colors.foreground}
                      />
                    </TouchableOpacity>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-muted-foreground uppercase tracking-wide">
                        Navigate
                      </Text>
                      <View
                        className="rounded-md px-1.5 py-0.5"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          borderWidth: 1,
                        }}
                      >
                        <Text
                          className="text-[10px]"
                          style={{ color: colors.muted }}
                        >
                          Tap
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={dismissFullScreenSearch}
                      className="rounded-md px-2 py-1 border"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      }}
                    >
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  className="flex-1 px-2.5 pt-2"
                  contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {groupedResults.map((group) => {
                    if (group.items.length === 0) return null;
                    const isExpanded = expandedGroups[group.key] ?? false;
                    const visibleItems = isExpanded
                      ? group.items
                      : group.items.slice(0, 4);
                    return (
                      <View
                        key={group.key}
                        className="mb-3 rounded-xl overflow-hidden border"
                        style={{
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                        }}
                      >
                        <View
                          className="px-3.5 py-2 border-b"
                          style={{
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                          }}
                        >
                          <Text className="text-xs uppercase tracking-wide text-muted-foreground">
                            {group.title}
                            {"  "}
                            <Text style={{ color: colors.warning }}>
                              {group.items.length}
                            </Text>
                          </Text>
                        </View>
                        {visibleItems.map(renderResultRow)}
                        {group.items.length > 4 ? (
                          <TouchableOpacity
                            className="px-3.5 py-3"
                            style={{ backgroundColor: colors.surface }}
                            onPress={() =>
                              setExpandedGroups((prev) => ({
                                ...prev,
                                [group.key]: !isExpanded,
                              }))
                            }
                          >
                            <Text className="text-sm text-warning">
                              {isExpanded ? "Show less" : "Show more"}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                  <TouchableOpacity
                    className="mb-2 rounded-xl border px-3.5 py-3 items-center"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    }}
                    onPress={dismissFullScreenSearch}
                  >
                    <Text className="text-sm" style={{ color: colors.muted }}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </View>
        ) : null}

        <View className="flex-row items-center pb-0.5 mt-1.5">
          <View className="flex-1 flex-row justify-between">
            {state.routes
              .filter((route) => isTabVisible(route.name))
              .map(renderTab)}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
