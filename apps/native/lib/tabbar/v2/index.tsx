import React, { useMemo, useRef, useEffect, useState } from "react";
import { View, Platform, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useModeThemeColors } from "@/lib/theme";
import { isReviewWindowOpen } from "@/lib/review-window";
import { HABITS_ENABLED } from "@/lib/features";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useTabSearchController } from "@/hooks/useTabSearchController";
import { SearchBar } from "./SearchBar";
import { SearchResults } from "./SearchResults";
import { TabItem, useTabScaleAnimation } from "./TabItem";
import { getOrderedTabs, TAB_CONFIG } from "./config";

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
});

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useModeThemeColors();
  const reviewWindowOpen = isReviewWindowOpen();
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

  const isTabVisible = (routeName: string) =>
    (routeName !== "review/index" || reviewWindowOpen) &&
    (HABITS_ENABLED || routeName !== "habits");

  const activeRouteName = state.routes[state.index]?.name ?? "";
  const isSettingsRoute =
    activeRouteName === "settings" ||
    activeRouteName === "settings/index" ||
    activeRouteName.startsWith("settings/");

  const searchRoutes = useMemo(
    () =>
      getOrderedTabs()
        .filter((tab) => isTabVisible(tab.key))
        .map((tab) => ({
          name: tab.key,
          label: tab.label,
          icon: tab.icon,
        })),
    [reviewWindowOpen],
  );

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results,
    isFocused: isSearchFocused,
    setIsFocused: setIsSearchFocused,
    closeSearch,
  } = useTabSearchController(searchRoutes);

  const scaleAnims = useTabScaleAnimation(state.routes, state.index);

  useEffect(() => {
    setIsFullScreenOpen((prev) => {
      if (!isSearchFocused) return false;
      return prev;
    });
  }, [isSearchFocused]);

  useEffect(() => {
    if (searchQuery) {
      setIsSearchFocused(true);
    }
  }, [searchQuery, setIsSearchFocused]);

  const handleTabPress = (
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

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const handleDismissFullScreen = () => {
    setIsSearchFocused(false);
    setIsFullScreenOpen(false);
  };

  const handleSearchSubmit = () => {
    const firstResult = results[0];
    if (!firstResult) return;
    closeSearch();
    setIsFullScreenOpen(false);
  };

  if (isSettingsRoute) {
    return null;
  }

  const visibleRoutes = state.routes.filter((route) =>
    isTabVisible(route.name),
  );

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
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          onSubmit={handleSearchSubmit}
        />

        {isSearchFocused && (
          <SearchResults
            query={searchQuery}
            results={results}
            isFullScreenOpen={isFullScreenOpen}
            onDismissFullScreen={handleDismissFullScreen}
          />
        )}

        <View className="flex-row items-center pb-0.5 mt-1.5">
          <View className="flex-1 flex-row justify-between">
            {visibleRoutes.map((route) => {
              const globalIdx = state.routes.findIndex(
                (r) => r.key === route.key,
              );
              return (
                <TabItem
                  key={route.key}
                  route={route}
                  globalIndex={globalIdx}
                  currentIndex={state.index}
                  onPress={handleTabPress}
                  scaleAnim={scaleAnims[globalIdx]}
                />
              );
            })}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export { TAB_CONFIG, getOrderedTabs, getTabOrder, setTabOrder, resetTabOrder, DEFAULT_TAB_ORDER } from "./config";
export { TabItem } from "./TabItem";
export { SearchBar } from "./SearchBar";
export { SearchResults } from "./SearchResults";
