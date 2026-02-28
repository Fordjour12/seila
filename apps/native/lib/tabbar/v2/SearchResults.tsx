import React, { useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useModeThemeColors } from "../../../lib/theme";
import { TAB_ICON_MAP, getSuggestionRouteName, IconName } from "./config";
import type { SearchResult } from "../../../hooks/useSearch";

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  isFullScreenOpen: boolean;
  onDismissFullScreen: () => void;
}

const SUGGESTIONS = [
  { label: "Add new task", icon: "add-circle-outline" as IconName, action: "nav", route: "tasks" },
  { label: "Quick check-in", icon: "pulse-outline" as IconName, action: "nav", route: "checkin/index" },
  { label: "Log habit", icon: "leaf-outline" as IconName, action: "nav", route: "habits/index" },
  { label: "Add expense", icon: "wallet-outline" as IconName, action: "nav", route: "finance" },
  { label: "Start review", icon: "document-text-outline" as IconName, action: "nav", route: "review/index" },
];

function getTimeBasedSuggestions() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return [
      { label: "Morning check-in", icon: "sunny-outline" as IconName, action: "nav", route: "checkin/index" },
      { label: "Today's tasks", icon: "checkbox-outline" as IconName, action: "nav", route: "tasks" },
    ];
  }
  if (hour >= 12 && hour < 17) {
    return [
      { label: "Review progress", icon: "analytics-outline" as IconName, action: "nav", route: "patterns/index" },
      { label: "Focus task", icon: "radio-button-on-outline" as IconName, action: "nav", route: "tasks" },
    ];
  }
  if (hour >= 17 && hour < 21) {
    return [
      { label: "Evening review", icon: "moon-outline" as IconName, action: "nav", route: "review/index" },
      { label: "Log expenses", icon: "card-outline" as IconName, action: "nav", route: "finance" },
    ];
  }
  return [
    { label: "Plan tomorrow", icon: "calendar-outline" as IconName, action: "nav", route: "tasks" },
    { label: "Quick note", icon: "document-append-outline" as IconName, action: "nav", route: "index" },
  ];
}

export function SearchResults({
  query,
  results,
  isFullScreenOpen,
  onDismissFullScreen,
}: SearchResultsProps) {
  const colors = useModeThemeColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();

  const panelHeight = windowHeight * 0.8;

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    onDismissFullScreen();
  }, [onDismissFullScreen]);

  useEffect(() => {
    if (!isFullScreenOpen) return;
    const sub = require("react-native").BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleDismiss();
        return true;
      },
    );
    return () => sub.remove();
  }, [isFullScreenOpen, handleDismiss]);

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
    ],
    [results],
  );

  const suggestions = query.length === 0 ? getTimeBasedSuggestions() : [];

  const handleSelectResult = (result: SearchResult) => {
    void Haptics.selectionAsync().catch(() => undefined);
    Keyboard.dismiss();

    if (result.type === "route") {
      router.navigate(result.routeName as never);
      handleDismiss();
      return;
    }

    if (result.type === "habit") {
      router.push({ pathname: "/(tabs)/habits/edit", params: { id: result.id } } as never);
      handleDismiss();
      return;
    }

    if (result.type === "task") {
      router.push({ pathname: "/(tabs)/tasks/edit", params: { id: result.id } } as never);
      handleDismiss();
      return;
    }

    if (result.type === "transaction") {
      router.push({ pathname: "/(tabs)/finance/transactions/edit", params: { transactionId: result.id } } as never);
      handleDismiss();
      return;
    }

    if (result.type === "account") {
      router.push("/(tabs)/finance/accounts" as never);
      handleDismiss();
      return;
    }

    if (result.type === "envelope") {
      router.push({ pathname: "/(tabs)/finance/budget/edit", params: { id: result.id } } as never);
      handleDismiss();
      return;
    }

    if (result.type === "savingsGoal") {
      router.push({ pathname: "/(tabs)/finance/savings/edit", params: { id: result.id } } as never);
      handleDismiss();
      return;
    }

    if (result.type === "suggestion") {
      const routeName = getSuggestionRouteName(result.screen);
      if (routeName) {
        router.navigate(routeName as never);
        handleDismiss();
      }
    }
  };

  const handleSuggestionPress = (suggestion: typeof SUGGESTIONS[0]) => {
    void Haptics.selectionAsync().catch(() => undefined);
    Keyboard.dismiss();
    router.navigate(suggestion.route as never);
    handleDismiss();
  };

  const renderResultRow = (result: SearchResult) => {
    const iconName: IconName =
      result.type === "route"
        ? (result.icon as IconName)
        : TAB_ICON_MAP[result.type];

    return (
      <TouchableOpacity
        key={result.key}
        activeOpacity={0.7}
        className="flex-row items-center gap-3 px-3.5 py-3.5 border-b border-border/60 min-h-14"
        onPress={() => handleSelectResult(result)}
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

  if (!isFullScreenOpen) {
    return results.length > 0 ? (
      <View className="mt-1.5 bg-surface border border-border rounded-2xl overflow-hidden max-h-56">
        <ScrollView keyboardShouldPersistTaps="handled">
          {results.map(renderResultRow)}
        </ScrollView>
      </View>
    ) : null;
  }

  return (
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
        style={{ backgroundColor: "rgba(12, 13, 15, 0.5)" }}
        onPress={handleDismiss}
      />
      <View
        className="absolute left-0 right-0 px-2.5 pb-2"
        style={{ bottom: insets.bottom + 60, height: panelHeight - 60 }}
      >
        <View
          className="flex-1 rounded-t-3xl border-t border-l border-r overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -8 },
            elevation: 20,
          }}
        >
          <View
            className="px-3 py-3 border-b"
            style={{ borderColor: colors.border }}
          >
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 text-base"
                style={{ color: colors.foreground }}
                placeholder="Search..."
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={() => {}}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleDismiss}
                className="px-2 py-1"
              >
                <Text className="text-sm" style={{ color: colors.warning }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1 px-2.5 pt-2"
            contentContainerStyle={{ paddingBottom: 18 }}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.length > 0 && results.length === 0 && (
              <View className="mb-4">
                <Text className="text-xs uppercase tracking-wide text-muted-foreground mb-2 px-1">
                  Suggestions
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className="flex-row items-center gap-2 px-3 py-2 rounded-full border"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      }}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <Ionicons
                        name={suggestion.icon}
                        size={14}
                        color={colors.accent}
                      />
                      <Text
                        className="text-sm"
                        style={{ color: colors.foreground }}
                      >
                        {suggestion.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {groupedResults.map((group) => {
              if (group.items.length === 0) return null;
              return (
                <View
                  key={group.key}
                  className="mb-3"
                >
                  <Text className="text-xs uppercase tracking-wide text-muted-foreground mb-2 px-1">
                    {group.title} ({group.items.length})
                  </Text>
                  <View
                    className="rounded-xl overflow-hidden border"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    }}
                  >
                    {group.items.slice(0, 4).map(renderResultRow)}
                    {group.items.length > 4 && (
                      <TouchableOpacity className="px-3.5 py-3 border-t" style={{ borderColor: colors.border }}>
                        <Text className="text-sm" style={{ color: colors.warning }}>
                          +{group.items.length - 4} more
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {results.length === 0 && suggestions.length === 0 && (
              <View className="py-8 items-center">
                <Ionicons name="search-outline" size={32} color={colors.muted} />
                <Text className="text-sm text-muted-foreground mt-2">
                  No results found
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
