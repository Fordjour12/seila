import React from "react";
import { Pressable, Text, View } from "react-native";

type WindowOption = 7 | 30 | 90;

type TrendDatum = {
  dayKey: string;
  value: number;
};

type Props = {
  title: string;
  subtitle: string;
  scoreLabel: string;
  scoreValue: string;
  statLine: string;
  trend: TrendDatum[];
  selectedDayKey?: string;
  selectedWindow: WindowOption;
  onWindowChange: (window: WindowOption) => void;
  onDayPress?: (dayKey: string) => void;
};

function chunk<T>(items: T[], size: number) {
  const output: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }
  return output;
}

function dayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Dot({ value, selected }: { value: number; selected?: boolean }) {
  const shade =
    value >= 0.95
      ? "bg-success"
      : value >= 0.6
        ? "bg-warning"
        : value > 0
          ? "bg-warning/40"
          : "bg-muted";
  return <View className={`h-4 flex-1 rounded-md ${shade} ${selected ? "border border-foreground" : ""}`} />;
}

export default function ConsistencyDetailCard({
  title,
  subtitle,
  scoreLabel,
  scoreValue,
  statLine,
  trend,
  selectedDayKey,
  selectedWindow,
  onWindowChange,
  onDayPress,
}: Props) {
  const rows = chunk(trend, 7);

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 gap-4 shadow-sm">
      <View className="gap-1">
        <Text className="text-2xl font-serif text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground">{subtitle}</Text>
      </View>

      <View className="flex-row gap-2">
        {[7, 30, 90].map((window) => {
          const active = selectedWindow === window;
          return (
            <Pressable
              key={window}
              className={`rounded-full border px-3 py-1.5 ${
                active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
              }`}
              onPress={() => onWindowChange(window as WindowOption)}
            >
              <Text className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                {window}d
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-1">
        <Text className="text-xs uppercase tracking-wider text-muted-foreground">{scoreLabel}</Text>
        <Text className="text-5xl font-serif text-foreground">{scoreValue}</Text>
        <Text className="text-xs text-muted-foreground">{statLine}</Text>
      </View>

      <View className="gap-2">
        <Text className="text-xs uppercase tracking-wider text-muted-foreground">Calendar Heatmap</Text>
        <View className="gap-1.5">
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-1">
              {row.map((item) => (
                <Pressable
                  key={item.dayKey}
                  className="flex-1"
                  onPress={() => onDayPress?.(item.dayKey)}
                  disabled={!onDayPress}
                >
                  <Dot value={item.value} selected={item.dayKey === selectedDayKey} />
                </Pressable>
              ))}
            </View>
          ))}
        </View>
        <View className="flex-row justify-between">
          <Text className="text-[11px] text-muted-foreground">{trend[0] ? dayLabel(trend[0].dayKey) : "-"}</Text>
          <Text className="text-[11px] text-muted-foreground">
            {trend[trend.length - 1] ? dayLabel(trend[trend.length - 1].dayKey) : "-"}
          </Text>
        </View>
      </View>
    </View>
  );
}
