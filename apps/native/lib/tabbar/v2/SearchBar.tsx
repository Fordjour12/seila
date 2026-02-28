import React, { useRef, useCallback } from "react";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useModeThemeColors } from "../../../lib/theme";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
}

export function SearchBar({
  query,
  onQueryChange,
  onFocus,
  onBlur,
  onSubmit,
}: SearchBarProps) {
  const colors = useModeThemeColors();
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      onBlur();
    }, 120);
  }, [onBlur]);

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    onFocus();
  }, [onFocus]);

  return (
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
        className="text-sm text-muted-foreground flex-1"
        placeholder="Search for actions, people, instruments"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={onQueryChange}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </View>
  );
}
