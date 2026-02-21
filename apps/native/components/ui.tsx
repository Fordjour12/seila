import React from "react";
import { Pressable, Text, TextStyle, View, ViewStyle } from "react-native";
import { Typography } from "../constants/theme";

export function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return (
    <Text className="text-muted-foreground mb-2" style={[Typography.eyebrow, style]}>
      {children}
    </Text>
  );
}

export function EmptyState({
  title,
  body,
  subtitle,
  icon,
}: {
  title: string;
  body?: string;
  subtitle?: string;
  icon?: string;
}) {
  const details = body ?? subtitle;
  return (
    <View className="bg-surface border border-border rounded-2xl p-4 gap-1">
      {icon ? <Text className="text-lg">{icon}</Text> : null}
      <Text className="text-foreground" style={Typography.labelLG}>
        {title}
      </Text>
      {details ? (
        <Text className="text-muted-foreground" style={Typography.bodySM}>
          {details}
        </Text>
      ) : null}
    </View>
  );
}

export function Badge({ label }: { label: string }) {
  return (
    <View className="self-start bg-warning/15 border border-warning/30 rounded-full px-2.5 py-1">
      <Text className="text-warning" style={Typography.labelSM}>
        {label}
      </Text>
    </View>
  );
}

export function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      className={`h-7 w-12 rounded-full justify-center ${value ? "bg-accent/35" : "bg-border"}`}
    >
      <View
        className={`h-5 w-5 rounded-full ${value ? "bg-accent translate-x-6" : "bg-muted-foreground translate-x-1"}`}
      />
    </Pressable>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = "primary", disabled, style }: ButtonProps) {
  const containerClass =
    variant === "primary"
      ? "bg-accent border-accent"
      : variant === "secondary" || variant === "outline"
        ? "bg-surface border-border"
        : "bg-transparent border-transparent";

  const textClass =
    variant === "primary"
      ? "text-accent-foreground"
      : variant === "secondary" || variant === "outline"
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-h-11 items-center justify-center rounded-xl border px-4 py-3 ${containerClass} ${disabled ? "opacity-50" : ""}`}
      style={style}
    >
      <Text className={textClass} style={Typography.labelMD}>
        {label}
      </Text>
    </Pressable>
  );
}
